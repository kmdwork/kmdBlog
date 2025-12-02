"use server";

import { auth } from "@/auth";
import { getDb } from "../db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

type ActionState = {
    success: boolean;
    error?: string;
};


export async function toggleUserActiveAction(
    prevState: ActionState,
    formData: FormData
) {
    // ユーザー認証
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return { success: false, error: "権限がありません。" };
    }

    // 値の取得
    const rawUserId = formData.get("userId");
    const userId = Number(rawUserId);
    if (!rawUserId || !Number.isInteger(userId)) {
        return { success: false, error: "ユーザーIDが不正です。" };
    }

    const db = getDb();
    // 今回は安全の為 一度dbから特定のデータを取得してきて確認する
    // 必要ない場合はupdateから始める
    const [u] = await db
        .select({
            id: users.id,
            isActive: users.isActive,
            role: users.role,
            email: users.email,
        })
        .from(users)
        .where(eq(users.id, userId));

    if (!u) {
        return { success: false, error: "ユーザーが見つかりません。" };
    }
    // 例: admin はここでは停止/有効化させない
    if (u.role === "admin") {
        return { success: false, error: "管理者ユーザーはこの操作の対象外です。" };
    }

    await db
        .update(users)
        .set({ isActive: !u.isActive })
        .where(eq(users.id, userId));

    return { success: true };
}
