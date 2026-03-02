import type { Metadata } from "next";
import Footer from "@/components/layouts/Footer"
import PublicHeader from "@/components/layouts/PublicHeader"
import SearchField from "@/components/layouts/SearchField";
import { getAllPosts } from "@/lib/posts";
import { getPostAuthors } from "@/lib/users";
import Image from "next/image";
import Link from "next/link";

type PostsSearchParams = {
    page?: string;
    search?: string;
    author?: string;
};

type PageProps = {
    searchParams: Promise<PostsSearchParams>;
};

function normalizeOrigin(raw: string): string {
    return raw.replace(/\/+$/, "");
}

function resolvePage(rawPage?: string): number {
    const n = Number(rawPage ?? "1");
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
    const params = await searchParams;
    const origin = normalizeOrigin(process.env.APP_ORIGIN ?? "https://kmdworks.com");
    const page = resolvePage(params?.page);
    const search = (params?.search ?? "").trim();
    const author = params?.author ?? "all";

    const hasSearch = search.length > 0;
    const hasAuthor = author !== "all" && author.trim() !== "";

    const canonicalParams = new URLSearchParams();
    if (!hasSearch && !hasAuthor && page > 1) {
        canonicalParams.set("page", String(page));
    }
    const canonical = canonicalParams.toString()
        ? `${origin}/posts?${canonicalParams.toString()}`
        : `${origin}/posts`;

    let title = "All Posts";
    if (hasSearch) {
        title = `「${search}」の検索結果`;
    } else if (hasAuthor) {
        title = "投稿一覧（著者絞り込み）";
    } else if (page > 1) {
        title = `All Posts - Page ${page}`;
    }

    const description = hasSearch
        ? `「${search}」の検索結果一覧です。`
        : hasAuthor
            ? "著者で絞り込んだ投稿一覧です。"
            : "公開中の投稿一覧です。";

    return {
        title,
        description,
        alternates: {
            canonical,
        },
        robots: hasSearch || hasAuthor
            ? {
                index: false,
                follow: true,
            }
            : undefined,
        openGraph: {
            type: "website",
            url: canonical,
            title,
            description,
            images: [
                {
                    url: `${origin}/ogp.jpg`,
                    width: 1200,
                    height: 630,
                    alt: "KMD WORKS",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [`${origin}/ogp.jpg`],
        },
    };
}

// const mockPosts = Array.from({ length: 9 }).map((_, i) => ({
//   title: `Post Title ${i + 1}`,
//   slug: `post-${i + 1}`,
//   date: '2025-10-01',
//   summary:
//     'This is a short summary for the article. It describes the core idea in one or two sentences.',
//   tags: ['Next.js', 'Notes', 'Design'].slice(0, (i % 3) + 1),
// }))
export const revalidate = 60 // 任意: 1分キャッシュ


export default async function PostsPage({ 
        searchParams 
    } : PageProps) {
    const params = await searchParams;
    const page = Math.max(1, Number(params?.page ?? '1'));
    const search = params?.search || "";
    const author = params?.author ?? "all";
    const hrefPage = (p: number) => `/posts?page=${p}&search=${search}&author=${author}`;
    const { items, total: _total, pageSize: _pageSize, hasPrev, hasNext } = await getAllPosts(page, 9, search, author);
    const authors = await getPostAuthors();


    return (
        <main className="min-h-screen bg-app text-app border-app font-mono">

            <PublicHeader />
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-black leading-tight break-words">
                        <span className="text-[var(--accent-cyan)]">[</span>
                        <span className="text-[var(--accent-pink)]">ALL</span>{' '}
                        <span className="text-[var(--accent-yellow)]">POSTS</span>
                        <span className="text-[var(--accent-cyan)]">]</span>
                        </h2>
                        <div className="h-0.5 w-36 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-pink)] to-[var(--accent-yellow)] mt-3" />
                    </div>

                    {/* 最小のフィルタUI（ダミー） */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <SearchField defaultValue={search} defaultAuthor={author} authors={authors}/>
                    </div>
                </div>
            </section>

            {/* グリッド一覧（レスポンシブ） */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
                    {items.length === 0 ? (
                        <p className="opacity-70">No posts yet.</p>
                    ) : (
                        <ul className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {items.map(p => (
                            <li key={p.slug} className="bg-card border border-[var(--border)] rounded-xl hover:shadow-lg transition group">
                                <Link href={`/posts/${p.slug}`} className="block p-5 sm:p-6">
                                    {/* ヘッダー部分：公開日と著者 */}
                                    <div className="flex items-center justify-between mb-3">
                                        <time className="text-xs opacity-60">公開日：{p.publishedAt}</time>
                                        <div className="flex items-center gap-2 text-xs opacity-80">
                                            {p.author?.pictureUrl ? (
                                                <Image 
                                                    src={p.author.pictureUrl} 
                                                    alt={p.author.displayName}
                                                    width={24}
                                                    height={24}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-[var(--accent-cyan)] flex items-center justify-center text-xs font-bold text-black">
                                                    {p.author?.displayName?.charAt(0).toUpperCase() ?? '?'}
                                                </div>
                                            )}
                                            <span>{p.author?.displayName ?? '不明'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* タイトル */}
                                    <h3 className="text-lg sm:text-xl font-bold mb-4 group-hover:text-[var(--accent-cyan)]">
                                        {p.title}
                                    </h3>
                                    
                                    {/* タグ */}
                                    <div className="flex flex-wrap gap-2">
                                        {p.tags.length === 0 ? (
                                            <span className="text-xs px-2 py-1 rounded border border-[var(--border)] opacity-60">
                                                no-tags
                                            </span>
                                        ) : (
                                            p.tags.map(t => (
                                                <span key={t} className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-[color:rgba(34,211,238,0.08)]">
                                                    {t}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </Link>                            
                            </li>
                            ))}
                        </ul>
                    )}
                        
                {/* {mockPosts.map((p) => (
                    <li
                    key={p.slug}
                    className="bg-card border border-[var(--border)] rounded-xl hover:shadow-lg transition group"
                    >
                    <a href={`/posts/${p.slug}`} className="block p-5 sm:p-6">
                        <time className="block text-xs opacity-60 mb-2">{p.date}</time>
                        <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-[var(--accent-cyan)]">
                        {p.title}
                        </h3>
                        <p className="text-sm opacity-80 line-clamp-3 mb-4">
                        {p.summary}
                        </p>
                        <div className="flex flex-wrap gap-2">
                        {p.tags.map((t) => (
                            <span
                            key={t}
                            className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-[color:rgba(34,211,238,0.08)]"
                            >
                            {t}
                            </span>
                        ))}
                        </div>
                    </a>
                    </li>
                ))} */}

                {/* ページネーション */}
                <div className="flex items-center justify-between mt-10">
                    {hasPrev ? (
                        <Link href={hrefPage(page - 1)} className="px-4 py-2 border-2 border-[var(--accent-cyan)] bg-[var(--accent-cyan)] text-black rounded font-bold hover:bg-[var(--accent-pink)] hover:border-[var(--accent-pink)] transition">
                        ← Prev
                        </Link>
                    ) : (
                        <span aria-disabled className="px-4 py-2 border border-[var(--border)] rounded opacity-50 cursor-not-allowed">
                        ← Prev
                        </span>
                    )}
                    {hasNext ? (
                        <Link
                            href={hrefPage(page + 1)}
                            className="px-4 py-2 border-2 border-[var(--accent-cyan)] bg-[var(--accent-cyan)] text-black rounded font-bold hover:bg-[var(--accent-pink)] hover:border-[var(--accent-pink)] transition"
                        >
                        Next →
                        </Link>
                    ) : (
                        <span aria-disabled className="px-4 py-2 border border-[var(--border)] rounded opacity-50 cursor-not-allowed">
                        Next →
                        </span>
                    )}
                    {/* <div>テスト：{total}:{pageSize}</div> */}
                </div>
            </section>
            <Footer />
        </main>
    )
}
