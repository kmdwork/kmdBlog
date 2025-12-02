import "next-auth";
import type { DefaultSession } from "next-auth";
import "@auth/core/jwt";


type AppUserRole = "admin" | "editor" | "author" | "reader";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;                 // ★ 文字列で統一
      role: AppUserRole;
      isActive: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId: string;               // ★ 文字列で統一
    role: AppUserRole;
    isActive: boolean;
  }
}