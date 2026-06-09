import type { Metadata } from "next";
import TableOfContents from '@/components/TableOfContents';
import Footer from '@/components/layouts/Footer';
import PublicHeader from '@/components/layouts/PublicHeader';
import {
    MarkdownRenderer,
    extractMarkdownDescription,
    extractTableOfContents,
    markdownProseClassName,
} from '@/lib/markdown';
import { getPost } from '@/lib/posts'
import { getUserById } from '@/lib/users';
import Image from 'next/image';
import { notFound } from "next/navigation";
import Link from 'next/link';

type Params = {
    params: Promise<{slug: string}>
}

export const revalidate = 60 // 任意: 1分キャッシュ

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPost(slug);
    const origin = process.env.APP_ORIGIN ?? "https://kmdworks.com";

    if (!post) {
        return {
            title: "記事が見つかりません",
            robots: {
                index: false,
                follow: false,
            },
        };
    }

    const canonical = `${origin}/posts/${post.slug}`;
    const description = extractMarkdownDescription(post.markdown, "記事の詳細ページです。");
    const tagList = post.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

    return {
        title: post.title,
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            type: "article",
            url: canonical,
            title: post.title,
            description,
            siteName: "KMD WORKS",
            locale: "ja_JP",
            publishedTime: new Date(post.publishedAt).toISOString(),
            tags: tagList.length > 0 ? tagList : undefined,
            images: [
                {
                    url: `${origin}/ogp.jpg`,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description,
            images: [`${origin}/ogp.jpg`],
        },
    };
}

export default async function PostPage({ params }: Params) {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post) {
        notFound();
    }

    const published = new Date(post.publishedAt).toISOString().slice(0, 10);
    const user = await getUserById(post.authorId);
    const tocItems = extractTableOfContents(post.markdown);
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
            <TableOfContents items={tocItems} />
            <MarkdownRenderer markdown={post.markdown} className={markdownProseClassName} />

            <section className="mt-10 rounded-xl border border-[var(--border)] bg-card/70 p-4 sm:p-5">
                <p className="text-xs opacity-60 mb-3">Author</p>
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
                    <span className="text-xs opacity-80">
                        {user?.displayName ?? '不明'}
                    </span>
                </div>
                <p className="text-sm opacity-75 leading-relaxed whitespace-pre-wrap">
                    {user?.bio?.trim() ? user.bio : "プロフィールはまだ設定されていません。"}
                </p>
            </section>

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
