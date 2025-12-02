import { auth } from "@/auth";
import BioEditor from "@/components/BioEditor";
import PrivateHeader from "@/components/layouts/PrivateHeader";
import { getUserById } from "@/lib/users";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
    title: "management",
};


export default async function ManagementPage() {
    const session = await auth();
    if(!session) {
        return (
            <div className="min-h-screen bg-app text-app font-mono">
                <div className="flex justify-center text-center text-xl sm:text-2xl leading-relaxed">
                    ログインしていないか正しいユーザーではありません。<br />
                    管理者ユーザーでサインインして下さい <br />
                    <Link href="/">戻る</Link>
                </div>
            
            </div>        
        )
    }

    const userid_number = parseInt(session.user.id);
    const user = await getUserById(userid_number);
    if(!user) {
        return (
            <h1>ユーザーが存在しません</h1>
        )
    } 

    const createdAtLabel =
        user.createdAt
            ? user.createdAt.toLocaleString("ja-JP", {
                timeZone: "Asia/Tokyo",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            })
            : "不明";


    return (
        <div className="min-h-screen bg-app text-app font-mono">
            <PrivateHeader session={session} />
            {/* 本文 */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">

                {/* セクションタイトル */}
                <h3 className="text-xl sm:text-2xl font-bold tracking-wide">
                    アカウント情報
                </h3>

                {/* カード */}
                <div className="rounded-2xl border border-[var(--border)] bg-card/60 backdrop-blur-sm shadow-[0_0_50px_-20px_rgba(255,255,255,0.2)] p-6 space-y-6">

                    {/* プロフィール上部 */}
                    <div className="flex items-center gap-6">
                        {/* アイコン */}
                        <div className="relative w-20 h-20 rounded-full border border-[var(--border)] bg-[#0f1319] overflow-hidden">
                            {user.pictureUrl ? (
                                <Image
                                    src={user.pictureUrl}
                                    alt={user.displayName}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[var(--accent-cyan)] text-black font-bold text-2xl">
                                    {user.displayName?.charAt(0).toUpperCase() ?? "?"}
                                </div>
                            )}
                        </div>
                        {/* 名前・メールなど */}
                        <div className="space-y-1">
                            <p className="text-lg font-bold">表示名: <span className="opacity-80">{user.displayName}</span></p>
                            <p className="text-sm opacity-80">メール: ==セキュリティの観点から非公開==</p>
                            <p className="text-sm opacity-80">ロール: <span className="text-[var(--accent-cyan)] font-bold">{user.role}</span></p>
                            <p className="text-sm opacity-80">状態: <span className="text-green-400 font-bold">有効</span></p>
                        </div>
                    </div>

                    <hr className="border-[var(--border)]" />

                    {/* 自己紹介 */}
                    <BioEditor initialBio={user?.bio ?? null} />
                    {/* <div className="space-y-2">
                        <p className="font-bold">自己紹介</p>
                        <div className="rounded-xl border border-[var(--border)] bg-app/40 p-4 text-sm leading-relaxed text-app/90">
                            {user.bio ?? "未記入"} <br />
                            ここに自己紹介文が入ります。  
                            後で編集機能を付ける予定です。
                        </div>
                    </div> */}

                    <hr className="border-[var(--border)]" />

                    {/* 作成日時 */}
                    <div>
                        <p className="font-bold">アカウント作成日</p>
                        <p className="opacity-80 text-sm">{createdAtLabel}</p>
                    </div>

                </div>
            </main>
        </div>    
    )
}
