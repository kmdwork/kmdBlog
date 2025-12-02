import { auth } from "@/auth";
import EditPost from "@/components/EditPost";
import PrivateHeader from "@/components/layouts/PrivateHeader";
import { getManagementPost } from "@/lib/posts";
import { getUserById } from "@/lib/users";
import Link from "next/link";

export const metadata = {
    title: "management Edit Post",
};

type Params = {
    params: Promise<{slug: string}>
}

export default async function EditPostPage({ params }: Params) {
    const { slug } = await params;
    const session = await auth();

    const post = await getManagementPost(slug);

    if (!post) {
        return (
            <main className="min-h-screen bg-app text-app font-mono">
                {/* 共有ヘッダー（簡易） */}
                <PrivateHeader session={session} />

                <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
                    <p className="opacity-80">記事が見つかりませんでした。</p>
                    <Link href="/management/posts" className="mt-4 inline-block text-[var(--accent-cyan)] hover:text-[var(--accent-pink)]">
                        ← 一覧に戻る
                    </Link>
                </section>
            </main>
        )
    }

    // ユーザーデータの取得
    const user = await getUserById(post.authorId);

    
    return (
        <div className="min-h-screen bg-app text-app font-mono">
            <PrivateHeader session={session} />
            <div className="space-y-4">
                <EditPost post={post} user={user}/>
            </div>
        </div>    
    )
}
