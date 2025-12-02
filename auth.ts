// web/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getDb } from "./lib/db"; // すでにお持ちの Drizzle(D1)ヘルパ
import { eq } from "drizzle-orm";
import { users, invites } from "@/db/schema";

const OWNER_EMAIL = process.env.OWNER_EMAIL;

export type AppUser = {
    id: number;
    email: string;
    displayName: string;
    pictureUrl: string | null;
    role: "admin" | "editor" | "author" | "reader";
    isActive: boolean;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
    // v5では自動的に /api/auth/* が生える
    secret: process.env.AUTH_SECRET, // 必須
    trustHost: true,                 // Cloudflare/カスタムドメイン向けのお守り
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60,  // 7日（秒）
    },
    jwt: {
        maxAge: 7 * 24 * 60 * 60,  // 基本的には session と揃えておく
    },

    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            allowDangerousEmailAccountLinking: false,
            profile(profile) {
                // Google プロファイル → アプリユーザーのひな型
                return {
                    id: profile.sub,
                    email: profile.email,
                    name: profile.name,
                    image: profile.picture,
                };
            },
        }),
    ],

    callbacks: {
        /**
         * signIn:
         *  - 既存ユーザー: isActive=1 ならOK
         *  - 未登録:
         *     a) OWNER_EMAIL なら admin で作成してOK（ブートストラップ）
         *     b) invites.email に一致すれば、その role で作成 & OK
         *     c) それ以外は拒否（招待が必要）
         */
        async signIn({ user, account, profile }) {
            if (!user?.email) return false;

            const db = getDb();

            // 既存ユーザーadmin
            const [u] = await db.select().from(users).where(eq(users.email, user.email));
            if (u) {
                return u.isActive === true;
            }

            // 新規：オーナーなら即 admin として有効化
            if (OWNER_EMAIL && user.email === OWNER_EMAIL) {
                await db.insert(users).values({
                    email: user.email,
                    displayName: user.name ?? user.email.split("@")[0],
                    pictureUrl: user.image ?? null,
                    googleSub: (profile as any)?.sub ?? null,
                    role: "admin",
                    isActive: true,
                });
                return true;
            }

            // 招待に一致している場合
            const now = Date.now();
            const [inv] = await db
                .select()
                .from(invites)
                .where(eq(invites.email, user.email));

            if (
                inv && (!inv.expiresAt || inv.expiresAt.getTime() > now) && !inv.usedAt
            ) {
                await db.insert(users).values({
                    email: user.email,
                    displayName: user.name ?? user.email.split("@")[0],
                    pictureUrl: user.image ?? null,
                    googleSub: (profile as any)?.sub ?? null,
                    role: inv.role as any,
                    isActive: true,
                });
                // 1回使い切りにするなら usedAt を詰める（任意）
                await db.update(invites).set({ usedAt: new Date() }).where(eq(invites.id, inv.id));
                return true;
            }

            // ここまで来たら拒否（未招待）
            return false;
        },

        /**
         * jwt: DBの情報をトークンへ
         */
        async jwt({ token }) {
            if (!token?.email) return token;

            const db = getDb();
            const [u] = await db.select().from(users).where(eq(users.email, token.email as string));
            if (u) {
                token.userId = String(u.id);
                token.role = u.role;
                token.isActive = u.isActive;
                token.name = u.displayName;
                token.picture = u.pictureUrl ?? undefined;
            }
            return token;
        },

        /**
         * session: クライアントで使いやすい形に
         */
        async session({ session, token }) {
            session.user.id = token.userId as string;
            session.user.role = token.role as any;
            session.user.isActive = token.isActive as boolean;            

            return session;
        },

        /**
         * authorized: ルート単位のガード（middleware でも行うが、APIに対しても効かせる）
         * v5では `authorized` は Route Handlers 用コールバック（任意）
         */
        // authorized({ request, auth }) {
        //     const { pathname } = request.nextUrl;
        //     const needsAdmin = pathname.startsWith("/admin");
        //     if (!needsAdmin) return true;
        //     return !!auth && (auth.user as any)?.role === "admin";
        // },
    },
});
