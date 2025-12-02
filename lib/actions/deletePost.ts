"use server";

import { auth } from "@/auth";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { posts, postsTags } from "@/db/schema";

type DeleteState = {
  success: boolean;
  error?: string;
};


export async function deletePostAction(
    prevState: DeleteState,
    formData: FormData
): Promise<DeleteState> {
    // 1) 認証と権限チェック
    const session = await auth();
    const role = session?.user?.role;
    
    // 許可するロール
    const canPost = role === "admin" || role === "editor";
    if (!session?.user || !canPost) {
        return {
            success: false,
            error: "削除権限がありません",
        };
    }


    // 2) 値の取得と判定
    const postIdRaw = formData.get("postId");
    const postId = postIdRaw ? Number(postIdRaw) : NaN;
    if (!postId || Number.isNaN(postId)) {
        return { success: false, error: "postIdが不正です" };
    }


    // 3) DB接続
    const db = getDb();
    // 対象の投稿を確認
    const row = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
    });
    if (!row) {
        return { success: false, error: "対象の投稿が存在しません" };
    }

    // ★ 4) オブジェクトレベルの権限チェック
    const userId = Number(session.user.id);; // auth() で付けている想定

    const isAdmin = role === "admin";
    const isOwner = row.authorId === userId;

    if (!isAdmin && !isOwner) {
        return { success: false, error: "この投稿を削除する権限がありません。" };
    }


    // 4) 関連タグを削除
    await db.delete(postsTags).where(eq(postsTags.postId, postId));

    // 5) 投稿本体を削除
    await db.delete(posts).where(eq(posts.id, postId));

    // R2 の本文データを物理的に消すかは運用次第
    // （ここでは残す。戻せるようにしたい場合が多いので）

    // KVキャッシュ無効化
    // await invalidatePostsCache(row.slug);    

    return { success: true };
}
