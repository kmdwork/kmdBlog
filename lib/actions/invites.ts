"use server";

import { auth } from "@/auth";
import { getDb } from "../db";
import { invites, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateInviteToken } from "../token";
import { redirect } from "next/navigation";
import { sendEmail } from "../mailer";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type InviteRole = "admin" | "editor" | "author" | "reader";

export type CreateInviteInput = {
  email: string;
  role: InviteRole;
  days?: number; // 期限（日）
};


// 招待メールHTML（テンプレ）
function inviteHtml(params: {
    email: string;
    role: InviteRole;
    acceptUrl: string;
    expiresAtMs: number;
}) {
    const d = new Date(params.expiresAtMs);
    const when = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    return `
        <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.6;color:#e5e7eb;background:#0b0f14;padding:24px">
        <h2 style="margin:0 0 12px 0;color:#fff">kmdBlog への招待</h2>
        <p>次のアドレス宛に、<b>${params.role}</b> ロールで招待が届いています。</p>
        <p style="margin:12px 0"><b>${params.email}</b></p>
        <p>有効期限：<b>${when}</b></p>
        <p style="margin:20px 0">
            <a href="${params.acceptUrl}" style="display:inline-block;padding:10px 16px;border:1px solid #334155;border-radius:10px;text-decoration:none;color:#e5e7eb">参加する</a>
        </p>
        <p>リンクが開けない場合は、次のURLをコピーしてブラウザで開いてください。</p>
        <code style="word-break:break-all">${params.acceptUrl}</code>
        </div>
    `;
}


const enc = (s: unknown) => encodeURIComponent(
  typeof s === "string" ? s : (s instanceof Error ? s.message : String(s))
);


export async function createAndSendInvite(formData: FormData) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "admin") {
            throw new Error("Forbidden");
        }
    
        const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();
        const rawRole = String(formData.get("role") ?? "author") as InviteRole;
        const rawDays = Number(formData.get("days") ?? 7);
    
        // バリデーション
        if (!rawEmail) {
            throw new Error("有効なメールアドレスを入力してください");
        }
        if (!["editor", "author", "reader"].includes(rawRole)) {
            throw new Error("ロールが不正です");
        }
        const days = Number.isFinite(rawDays) ? Math.max(1, Math.min(60, rawDays)) : 7; // 1〜60日にクランプ
    
        // DB接続
        const db = getDb();
    
        // 既存ユーザーなら招待不要
        const [u] = await db.select().from(users).where(eq(users.email, rawEmail));
        if (u) {
            throw new Error("このメールアドレスは既にユーザー登録済みです");
        }
    
        // 招待レコード作成
        const token = generateInviteToken();
        const now = Date.now();
        const expiresAt = now + days * 86_400_000;
        const createdByUserId = Number(session.user.id) || null;
    
        await db.insert(invites).values({
            token,
            email: rawEmail,
            role: rawRole,
            expiresAt: new Date(expiresAt),
            createdByUserId: Number.isNaN(createdByUserId) ? null : createdByUserId,
        });
    
        // 受け口URL
        const origin = process.env.APP_ORIGIN!;
        // const acceptUrl = `${origin}/invite/${token}`;
        const acceptUrl = new URL(`/invite/${token}`, origin).toString();
    
        // From 切り替え（必要なら MAIL_FROM を優先）
        const mailFrom =
            process.env.MAIL_FROM ??
            (origin.includes("dev.")
            ? "onboarding@resend.dev"
            : "noreply@kmdworks.com");
    
        // メール送信
        await sendEmail({
            from: mailFrom,
            to: rawEmail,
            subject: "【kmdBlog】招待のご案内",
            html: inviteHtml({ email: rawEmail, role: rawRole, acceptUrl, expiresAtMs: expiresAt }),
        });
    
        redirect("/management/admin/invites?sent=1");
    } catch (error) {
        // ★ redirect() 由来なら“正常系”なので捕まえない
        if (isRedirectError(error)) {
            throw error; // ← 重要
        }
        console.error("[createAndSendInvite] failed:", error);
        redirect(`/management/admin/invites?error=${enc(error) ?? "unknown"}`);
    }
}