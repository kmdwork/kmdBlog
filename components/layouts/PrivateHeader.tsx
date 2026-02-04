
import React from 'react'
import ThemeToggle from '../ThemeToggle'
import Link from 'next/link'
import { Session } from 'next-auth'
// import { signOut } from '@/auth';
// import { redirect } from 'next/navigation';
import SignOutButton from './SignOutButton';


const navItems = [
    { label: "DASHBOARD", href: "/management" },               // 全ロール
    { label: "POSTS",     href: "/management/posts" },         // 全ロール（投稿管理想定）
    { label: "ADMIN",     href: "/management/admin", admin: true }, // adminのみ
    { label: "INVITES",   href: "/management/admin/invites", admin: true }, // adminのみ
];

export default function PrivateHeader({ session }:{ session?: Session | null }) {
    const user = session?.user;
    const role = user?.role as "admin" | "editor" | "author" | "reader" | undefined;
    const displayName =
        user?.name ??
        user?.email?.split("@")[0] ??
        "User";

    // ロールで絞ったメニュー
    const items = navItems.filter((x) => !x.admin || role === "admin");

    // async function doSignOut() {
    //     "use server";
    //     await signOut();
    //     redirect("/login");
    // }

    return (
        <header className="border-b border-app bg-card/80 backdrop-blur-sm sticky top-0 z-[110]">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-3">
                {/* 左：タイトル（可縮小） */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <h1 className="text-xl sm:text-3xl font-black whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className="text-[var(--accent-cyan)]">&gt;_</span>
                        <span className="text-[var(--accent-pink)]">KMD</span>
                        <span className="text-[var(--accent-yellow)]">Works</span>
                        {/* サフィックスはsm以上のみ表示 */}
                        <span className="ml-2 text-sm align-middle opacity-70 hidden sm:inline">/ management</span>
                    </h1>
                    </div>

                    {/* 右：ナビ＋ユーザー（非可変） */}
                    <div className="flex items-center shrink-0 gap-2 sm:gap-6 text-sm">
                    {/* PC ナビ */}
                    <div className="hidden sm:flex items-center gap-6">
                        {items.map((item, i) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-[var(--accent-cyan)] hover:text-[var(--accent-pink)] transition whitespace-nowrap"
                        >
                            [{i.toString().padStart(2, "0")}] {item.label}
                        </Link>
                        ))}
                    </div>

                    {/* SP: <details> ドロップダウン */}
                    <details className="relative sm:hidden">
                        <summary className="list-none cursor-pointer text-[var(--accent-cyan)] hover:text-[var(--accent-pink)]">
                        [MENU]
                        </summary>
                        <div className="absolute right-0 mt-2 w-48 bg-card border border-[var(--border)] rounded-lg shadow-lg p-2">
                            <ul className="flex flex-col">
                                {items.map((item, i) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="block px-2 py-2 rounded hover:bg-[var(--bg)]"
                                    >
                                        [{i.toString().padStart(2, "0")}] {item.label}
                                    </Link>
                                </li>
                                ))}
                                <li className="mt-1 border-t border-[var(--border)]" />
                                {/* SPではトグルをメニュー内に格納 */}
                                <li className="px-2 py-2">
                                    <ThemeToggle />
                                </li>
                            </ul>
                        </div>
                    </details>

                    {/* テーマ切替：PCのみ常時表示（SPは上のMENU内） */}
                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>

                    {/* ユーザー情報＆サインアウト */}
                    <details className="relative">
                        <summary className="list-none cursor-pointer flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                                <div className="font-semibold leading-4">{displayName}</div>
                                <div className="text-[10px] opacity-70 uppercase">{role ?? "guest"}</div>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-[var(--border)] grid place-items-center text-xs">
                                {(displayName ?? "U").slice(0, 1).toUpperCase()}
                            </div>
                        </summary>
                        <div className="absolute right-0 mt-2 w-52 bg-card border border-[var(--border)] rounded-lg shadow-lg p-2">
                            <div className="px-2 py-1.5 text-xs opacity-70 break-all">
                                {user?.email ?? ""}
                            </div>
                            <Link href="/management" className="block px-2 py-2 rounded hover:bg-[var(--bg)]">
                                ダッシュボード
                            </Link>
                            {role === "admin" && (
                                <Link href="/management/admin" className="block px-2 py-2 rounded hover:bg-[var(--bg)]">
                                管理メニュー
                                </Link>
                            )}
                            <SignOutButton />
                        </div>
                    </details>
                </div>
            </nav>
        </header>
    )
}
