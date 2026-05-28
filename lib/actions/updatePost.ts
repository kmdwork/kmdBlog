"use server";

import { auth } from "@/auth";
import { getDb } from "../db";
import { eq, inArray } from "drizzle-orm";
import { posts, postsTags, tags, users } from "@/db/schema";
import { updatePostSchema } from "@/validations/updatePost";
import { putR2Markdown } from "../r2";




type UpdateState = {
    success: boolean;
    errors: {
        title?: string[];
        // slug?: string[];
        tags?: string[];
        content?: string[];
        form?: string[];
    };
    debug?: unknown;
};

function parseJstDateTimeLocal(value: string | null): Date | null {
    if (!value || value.trim() === "") return null;

    const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
    );
    if (!match) return null;

    const [, year, month, day, hour, minute] = match;
    const utcMs = Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour) - 9,
        Number(minute)
    );

    const date = new Date(utcMs);
    return Number.isNaN(date.getTime()) ? null : date;
}


export async function updatePostAction(
    prevState: UpdateState,
    formData: FormData
): Promise<UpdateState> {

    try {
        
        // 1) 認証と権限チェック
        const session = await auth();
        const role = session?.user?.role;
    
        // 許可するロール
        const canPost = role === "admin" || role === "editor";
        if (!session?.user || !canPost) {
            return {
                success: false,
                errors: {
                    form: ["権限がありません（ログイン or 権限不足）"],
                },
            };
        }
    
        const db = getDb();
        const userRow = await db.query.users.findFirst({
            where: eq(users.email, session.user.email ?? ""),
        });
        if (!userRow) {
            return {
                success: false,
                errors: {
                    form: ["投稿者ユーザーがDBに存在しません"],
                },
            };
        }
        
        // 2) フォームデータの取り出し
        const raw = {
            postId: formData.get("postId") as string,
            title: formData.get("title") as string,
            // slug: formData.get("slug") as string,
            tags: formData.get("tags") as string,
            content: formData.get("content") as string,
            publish: formData.get("publish")  === "on",
            publishDate: parseJstDateTimeLocal(
                formData.get("publishDate") as string | null
            ),
            // publishDate: String(formData.get("publishDate") ?? ""),
        };
    
    
        // 3) バリデーション
        const parsed = updatePostSchema.safeParse(raw);
        if (!parsed.success) {
            // Zod のエラーを UI 側の shape に落とす
            const fieldErrors: UpdateState["errors"] = {};
            for (const issue of parsed.error.issues) {
                const k = issue.path[0] as keyof UpdateState["errors"];
                if (!fieldErrors[k]) fieldErrors[k] = [];
                fieldErrors[k]!.push(issue.message);
            }
            return { success: false, errors: fieldErrors };
        }
        const { title, content } = parsed.data;
    
    
        // 4) 既存ポスト取得
        const postRow = await db.query.posts.findFirst({
            where: eq(posts.id, Number(raw.postId)),
        });
        if (!postRow) {
            return {
            success: false,
            errors: { form: ["対象の投稿が存在しません"] },
            };
        }
    
        // 5) 値の整理
            // 公開日時の計算
        const publishedAt: Date | null =
            raw.publish
                ? (raw.publishDate
                    ? raw.publishDate // ユーザー指定日時
                    : new Date()                // 今この瞬間
                )
                : null;
        // const { publish } = parsed.data; // publishDate: Date|null
        // const publishedAt: Date | null = publish
        //     ? (raw.publishDate ? raw.publishDate.getTime() : Date.now())
        //     : null;
    
    
        // 6) R2 の本文を更新
        const r2_key = postRow.r2Key;
        const { key: r2Key, etag, size } = await putR2Markdown(r2_key, content);
        
    
        // 7) DB（D1）を更新
        await db
            .update(posts)
            .set({
                title,
                r2Key,
                checksum: etag ?? null,
                sizeBytes: size ?? null,
                contentType: postRow.contentType ?? "text/markdown",
                publishedAt: publishedAt,
                // updatedAt は DB 側の $onUpdate に任せる
            })
            .where(eq(posts.id, Number(raw.postId)));
    
        // 6) タグの更新（tags / posts_tags）
            // カンマ区切りタグを配列化
        const tagList = raw.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        
        // 一回全部消して入れ直す
        await db.delete(postsTags).where(eq(postsTags.postId, Number(raw.postId)));
    
        if (tagList.length) {
            // 既存タグを取得
            const existing = await db
                .select()
                .from(tags)
                .where(inArray(tags.name, tagList));
            
            const existingNames = new Set(existing.map((t) => t.name));
            const toInsert = tagList.filter((n) => !existingNames.has(n));
            
            // 新しいタグを挿入
            if (toInsert.length) {
                await db
                    .insert(tags)
                    .values(toInsert.map((n) => ({ name: n })))
                    .onConflictDoNothing();
            }
            
            // もう一回全タグを取得して ID を揃える
            const allTags = await db
                .select()
                .from(tags)
                .where(inArray(tags.name, tagList));
            
            if (allTags.length) {
                await db
                    .insert(postsTags)
                    .values(
                    allTags.map((t) => ({
                        postId: Number(raw.postId),
                        tagId: t.id,
                    }))
                    )
                    .onConflictDoNothing();
            }
        }
    
        // 8) KVキャッシュを無効化（一覧と詳細）
        // await invalidatePostsCache(slug);
    
        // 8) 成功レスポンス
        // 本番
        //     return {
        //         success: true,
        //         errors: {},
        //     };
        // デバック
        return {
            success: true,
            errors: {},
            debug: { publishedAt, parsed, tagList, r2Key, etag, size },
        };
    } catch (err) {
        console.error("updatePostAction error:", err);
        return {
            success: false,
            errors: { form: ["サーバー側でエラーが発生しました"] },
            debug: String(err),
        };
    }

}
