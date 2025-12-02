import Footer from '@/components/layouts/Footer';
import PublicHeader from '@/components/layouts/PublicHeader';
import { getPost } from '@/lib/posts'
import { getUserById } from '@/lib/users';
import Image from 'next/image';
import Link from 'next/link';
import { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const metadata = {
  title: "Post Page",
};

type Params = {
    params: Promise<{slug: string}>
}

export const revalidate = 60 // 任意: 1分キャッシュ

export default async function PostPage({ params }: Params) {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post) {
        return (
            <main className="min-h-screen bg-app text-app font-mono">
                {/* 共有ヘッダー（簡易） */}
                <PublicHeader />

                <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
                    <p className="opacity-80">記事が見つかりませんでした。</p>
                    <Link href="/posts" className="mt-4 inline-block text-[var(--accent-cyan)] hover:text-[var(--accent-pink)]">
                        ← 一覧に戻る
                    </Link>
                </section>
            </main>
        )
    }

    const published = new Date(post.publishedAt).toISOString().slice(0, 10);
    const user = await getUserById(post.authorId);

    
    return (
        <main className="min-h-screen bg-app text-app font-mono">
        {/* ヘッダー（SP対応版） */}
        <PublicHeader />

        {/* 記事本体 */}
        <article className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            {/* タイトル＆メタ */}
            <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black leading-tight break-words">
                {post.title}
            </h1>
            <div className="mt-3 text-sm opacity-70 flex justify-between flex-wrap items-center gap-x-3 gap-y-1">                
                {/* 著者情報 */}
                <div className="flex items-center gap-2 mb-3">
                    {user?.pictureUrl ? (
                        <Image 
                            src={user.pictureUrl} 
                            alt={user.displayName}
                            className="w-6 h-6 rounded-full"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-[var(--accent-cyan)] flex items-center justify-center text-xs font-bold text-black">
                            {user?.displayName.charAt(0).toUpperCase() ?? '?'}
                        </div>
                    )}
                    <span className="text-xs opacity-70">
                        {user?.displayName ?? '不明'}
                    </span>
                    {/* {user?.role && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent-pink)] text-black font-semibold">
                            {user.role}
                        </span>
                    )} */}
                </div>

                <time dateTime={post.publishedAt}>公開日:{published}</time>
                {/* {post.tags?.length ? (
                <>
                    <span className="opacity-50">•</span>
                    <ul className="flex flex-wrap gap-2">
                    {post.tags.map((t: string) => (
                        <li key={t} className="text-xs px-2 py-0.5 rounded border border-[var(--border)] bg-[color:rgba(34,211,238,0.08)]">
                        {t}
                        </li>
                    ))}
                    </ul>
                </>
                ) : null} */}
            </div>
            <div className="h-0.5 w-28 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-pink)] to-[var(--accent-yellow)] mt-4" />
            </header>

            {/* アイキャッチ（任意） */}
            {/* {post.coverImage?.src ? (
            <figure className="mb-8">
                <Image
                    src={post.coverImage.src} // 例: '/media/posts/hello-world-r2/here.png'
                    alt={post.coverImage.alt ?? post.title}
                    width={1280}
                    height={720}
                    className="w-full h-auto rounded-lg border border-[var(--border)]"
                    priority
                />
                {post.coverImage.caption ? (
                <figcaption className="mt-2 text-xs opacity-60">{post.coverImage.caption}</figcaption>
                ) : null}
            </figure>
            ) : (
            // もとの固定画像を使いたい場合はこちらを残す
            <figure className="mb-8">
                <Image
                    src="/media/posts/hello-world-r2/here.png"
                    alt="表紙"
                    width={1280}
                    height={720}
                    className="w-full h-auto rounded-lg border border-[var(--border)]"
                    priority
                />
            </figure>
            )} */}

            {/* Markdown本文 */}
            <div className="prose prose-pre:bg-[#0b0f14] prose-pre:border prose-pre:border-[var(--border)] prose-img:rounded-lg prose-img:border prose-img:border-[var(--border)] max-w-none
                            prose-a:text-[var(--accent-cyan)] hover:prose-a:text-[var(--accent-pink)]
                            prose-hr:border-[var(--border)]
                            prose-code:bg-[color:rgba(34,211,238,0.08)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                            prose-table:border prose-table:border-[var(--border)] prose-th:border prose-td:border prose-td:px-3 prose-td:py-1.5">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    // 画像は next/image で描画（Markdown内の ![]() を置換）
                    components={{
                        // 画像: string だけ許可。string でない（Blob 等）なら描画しない。
                        img: (props) => {
                            const { src, alt } = props as ComponentPropsWithoutRef<"img">;
                            if (typeof src !== "string" || src.length === 0) return null;
                            // alt の中から |w=数字 を抽出（例: "説明|w=480"）
                            const [altText, sizeSpec] = (alt ?? "").split("|", 2);
                            const widthMatch = sizeSpec?.match(/w=(\d{2,4})/);
                            const width = widthMatch ? parseInt(widthMatch[1], 10) : undefined;
                            const resolvedSrc = src.startsWith("/")
                                ? `${process.env.APP_ORIGIN ?? "https://dev.kmdworks.com"}${src}`
                                : src;
                            // 外部ドメインの画像を使う場合は next.config.js の images.domains / remotePatterns を設定してください
                            return (
                                <div className="flex justify-center my-4">
                                    <Image
                                        src={resolvedSrc}
                                        alt={altText?.trim() ?? ""}
                                        width={width ? width : undefined}                                                                                
                                        className="rounded-lg border border-[var(--border)] h-auto"
                                    />
                                </div>
                            );
                        },

                        // リンク: 内部は <Link>、外部は <a target="_blank"> に自動振り分け
                        a: (props) => {
                            const { href, children, ...rest } = props as ComponentPropsWithoutRef<"a">;
                            const h = typeof href === "string" ? href : "";
                            const isExternal =
                            /^https?:\/\//i.test(h) || h.startsWith("//");
                            if (isExternal) {
                                return (
                                    <a
                                        href={h}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        {...rest}
                                        >
                                        {children}
                                    </a>
                                );
                            }
                            // 内部リンクは Next Link
                            return (
                                <Link href={h || "#"} {...rest}>
                                    {children}
                                </Link>
                            );
                        },
                    }}
                >
                    {post.markdown}
                </ReactMarkdown>
            </div>

            {/* フッター ナビ */}
            <div className="mt-10 flex items-center justify-between">
                <Link href="/posts" className="text-[var(--accent-cyan)] hover:text-[var(--accent-pink)]">
                    ← 一覧へ戻る
                </Link>
            {/* 次/前の記事リンクは後で実装（getAdjacentPostsなどに置換予定） */}
            </div>
        </article>

        {/* ページフッター（共通） */}
        <Footer />
        </main>
    )
}

