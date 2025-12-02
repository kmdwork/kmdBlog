"use server";

import { auth } from "@/auth";
import { getDb } from "../db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateRoleSchema } from "@/validations/updateRole";

type ActionState = {
    success: boolean;
    error?: string;
};


export async function updateUserRoleAction(
    prevState: ActionState,
    formData: FormData
) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return { success: false, error: "権限がありません。" };
    }

    const rawUserId = formData.get("userId");
    const rawRole = formData.get("role");

    const userId = Number(rawUserId);
    if (!rawUserId || !rawRole || !Number.isInteger(userId)) {
        return { success: false, error: "ユーザーIDまたはロールが不適切です。" };
    }


    // zod
    const parsed = updateRoleSchema.safeParse(rawRole);
    if (!parsed.success) {
        return { success: false, error: "ロールの指定が不正です。" };
    }
    const newRole = parsed.data;

    const db = getDb();
    const [u] = await db
        .select({
            id: users.id,
            role: users.role,
            email: users.email,
        })
        .from(users)
        .where(eq(users.id, userId));

    if (!u) {
        return { success: false, error: "ユーザーが見つかりません。" };
    }
    // 念のため admin はここでも変更不可にしておく
    if (u.role === "admin") {
        return { success: false, error: "管理者ユーザーの権限は変更できません。" };
    }

    await db
        .update(users)
        .set({ role: newRole })
        .where(eq(users.id, userId));

    return { success: true };

}