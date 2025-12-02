"use client"

import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";


type AuthorOption = {
  id: number;
  displayName: string;
  pictureUrl: string | null;
};


export default function SearchField({ defaultValue = "", defaultAuthor = "all" , authors = []}: { defaultValue?: string, defaultAuthor?: string, authors?: AuthorOption[]; }) {
    const router = useRouter();
    const [value, setValue] = useState(defaultValue);
    const [author, setAuthor] = useState(defaultAuthor);
    const pathname = usePathname();
    const basePath = pathname.startsWith("/management") ? "/management/posts": "/posts";

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        const q = value.trim();
        const params = new URLSearchParams();

        if (q) params.set("search", q);
        if (author !== "all") params.set("author", author);
        const query = params.toString();
        const url = query ? `${basePath}?${query}` : basePath;
        router.push(url);
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full">
            <details className="block sm:contents" open>
                {/* スマホだけ表示するトグル */}
                <summary className="mb-2 flex items-center justify-between rounded border border-[var(--border)] px-3 py-2 text-sm sm:hidden">
                    検索条件
                    <span className="opacity-70">▼</span>
                </summary>
                {/* 中身：スマホでは縦並び、PCでは今まで通り横並び */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="タイトル・タグで検索…"
                        className="px-3 py-2 rounded border border-[var(--border)] bg-transparent sm:flex-1"
                    />
                    <select
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="px-3 py-2 rounded border border-[var(--border)] bg-transparent text-sm sm:w-auto"
                    >
                        <option value="all">すべてのユーザー</option>
                        {authors.map((u) => (
                            <option key={u.id} value={String(u.id)}>
                                {u.pictureUrl ? '👤 ' : ''}
                                {u.displayName}
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        className="px-3 py-2 rounded border border-[var(--border)] hover:bg-[var(--accent-yellow)] sm:w-auto"
                    >
                        検索
                    </button>
                </div>
            </details>
        </form>
    )
}
