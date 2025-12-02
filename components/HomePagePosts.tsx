import { getHomePost } from "@/lib/posts";
import Link from "next/link";

export default async function HomePagePosts() {
    const posts = await getHomePost();

    return (
        <section id="posts" className="max-w-7xl mx-auto px-6 py-20">
            <h3 className="text-3xl font-black mb-6">LATEST <span className="text-[var(--accent-cyan)]">POSTS</span></h3>
            <div className="h-0.5 w-full bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-pink)] to-[var(--accent-yellow)] mb-8" />
            {posts?.length ? (
                <ul className="grid md:grid-cols-3 gap-6">
                {posts.map(p => (
                    <li key={p.slug} className="bg-card border border-[var(--border)] rounded-xl p-5 hover:shadow-lg transition">
                        <time className="block text-sm opacity-60 mb-2">{p.publishedAt}</time>
                        <a href={`/posts/${p.slug}`} className="text-lg font-semibold text-[var(--accent-cyan)] hover:text-[var(--accent-pink)]">
                            {p.title}
                        </a>
                    </li>
                ))}
                </ul>
            ) : (
                <div className="text-sm opacity-70">まだ公開記事がありません。</div>
            )}

            <div className="mt-8 text-right">
                <Link className="text-[var(--accent-cyan)] hover:text-[var(--accent-pink)]" href="/posts">[VIEW_ALL]</Link>
            </div>
        </section>
    )
}
