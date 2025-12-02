
"use server";

import { auth } from "@/auth";
import { createPostSchema } from "@/validations/createPost";
// import { canCreate, canPublish } from "@/lib/auth/permissions";
import { putR2Markdown, r2PostsKeyFromSlug } from "@/lib/r2";
import { checkSlug } from "../posts";
import { getDb } from "../db";
import { posts, postsTags, tags, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
// import { invalidatePostsCache } from "@/lib/kv";

// 戻り値は useActionState が扱う形に合わせる
type ActionState = {
    success: boolean;
    errors: {
        title?: string[];
        slug?: string[];
        tags?: string[];
        content?: string[];
        form?: string[];
    };
    debug?: unknown,
};


export async function createPostAction(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {

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
        title: formData.get("title") as string,
        slug: formData.get("slug") as string,
        tags: formData.get("tags") as string,
        content: formData.get("content") as string,
        publish: formData.get("publish")  === "on",
        publishDate: (() => {
            const v = formData.get("publishDate") as string | null;
            if (!v || v.trim() === "") return null; // 未入力 → null
            const date = new Date(v);
            return isNaN(date.getTime()) ? null : date; // 不正な値は null 扱い
        })(),
    };

    
    // 3) バリデーション
    const parsed = createPostSchema.safeParse(raw);
    if (!parsed.success) {
        // Zod のエラーを UI 側の shape に落とす
        const fieldErrors: ActionState["errors"] = {};
        for (const issue of parsed.error.issues) {
            const k = issue.path[0] as keyof ActionState["errors"];
            if (!fieldErrors[k]) fieldErrors[k] = [];
            fieldErrors[k]!.push(issue.message);
        }
        return { success: false, errors: fieldErrors };
    }

    const { title, slug, content } = parsed.data;
    // slugが重複していないか確認
    const checkSlugOk = await checkSlug(slug);
    if(!checkSlugOk) {
        return {
            success: false,
            errors: {
                form: ["同じslug名が使われているため、このslugは使用できません"],
            },
        };
    }

    // const publish = parsed.data.publish === "on";
    // const tagStr = parsed.data.tags || "";

    const publishedAt: Date | null =
        raw.publish
            ? (raw.publishDate
                ? new Date(raw.publishDate) // ユーザー指定日時
                : new Date()                // 今この瞬間
            )
            : null;


    // カンマ区切りタグを配列化
    const tagList = raw.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);


    // try {


    // 4-2) R2 に本文を書き込む
    const key = r2PostsKeyFromSlug(slug); //key発行
    //    putR2Markdown は { key, etag, size } を返す設計だったよね
    const { key: r2Key, etag, size } = await putR2Markdown(key, content);


    // 5) DB（D1）に保存 

        // 公開できるか（editor 以上なら publish 指定OK）
        // const willPublish = publish && canPublish(role);
        // const publishedAt = willPublish ? now : null;

        // authorId は後で users テーブルと session.user.email の対応を入れる前提で、今は null
    await db
        .insert(posts)
        .values({
            title,
            slug,
            authorId: userRow.id, // TODO: あなたの users テーブルに合わせて session.user から埋める
            r2Key,
            checksum: etag ?? null,
            sizeBytes: size ?? null,
            contentType: "text/markdown",
            publishedAt: publishedAt,
        });

    // 6) タグ処理（tags / posts_tags）
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

            // 今のポストIDを取得
            const postRow = await db.query.posts.findFirst({
                where: eq(posts.slug, slug),
            });

            if (postRow && allTags.length) {
                // posts_tags に (postId, tagId) を登録
                await db.insert(postsTags).values(
                    allTags.map((t) => ({
                        postId: postRow.id,
                        tagId: t.id,
                    }))
                )
                .onConflictDoNothing();
            }
        }

        // 7) KVキャッシュを無効化（一覧と詳細）
        // await invalidatePostsCache(slug);

    //     // 8) 成功レスポンス
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
    // } catch (err) {
    //     // 例: slug の UNIQUE 制約衝突, R2エラー, D1エラーなど
    //     console.error("[createPostAction] failure:", err);
    //     return {
    //         success: false,
    //         errors: {
    //             form: ["投稿に失敗しました"],
    //         },
    //     };
    // }
}
