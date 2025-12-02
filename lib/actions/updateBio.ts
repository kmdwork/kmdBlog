"use server";


import { auth } from "@/auth";
import { updateBioSchema } from "@/validations/updateBio";
import { getDb } from "../db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

type ActionState = {
    success: boolean;
    error?: string;
    bio?: string | null;
};


export async function updateBioAction(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    // ログインユーザー認証
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "認証が必要です。" };
    }

    // 値の取得
    const raw = {
        bio: formData.get("bio")?.toString(),
    };

    // バリデーション
    const parsed = updateBioSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0]?.message ?? "入力値が正しくありません。"
        };
    }

    // user dbをアップデート
    const db = getDb();
    await db
        .update(users)
        .set({
            bio: parsed.data.bio || null
        })
        .where(eq(users.id, Number(session.user.id)));

    // 返還
    return {
        success: true,
        error: undefined,
        bio: parsed.data.bio || null
    };
}