// web/app/management/admin/page.tsx
import { auth } from "@/auth";
import PrivateHeader from "@/components/layouts/PrivateHeader";
import RoleChangeButton from "@/components/RoleChangeButton";
import UserStatusToggle from "@/components/UserStatusToggle";
import { getAllUser } from "@/lib/users";
import Image from "next/image";
import Link from "next/link";
// import { redirect } from "next/navigation";

export default async function AdminPage() {
    const session = await auth();                       // SSRで現在のセッション取得
    if (!session || session.user.role !== "admin") {
              <div className="min-h-screen bg-app text-app font-mono">
                  <div className="flex justify-center text-center text-xl sm:text-2xl leading-relaxed">
                      ログインしていないか正しいユーザーではありません。<br />
                      権限のある管理者ユーザーでサインインして下さい <br />
                      <Link href="/">戻る</Link>
                  </div>
              </div>        
    }


    const users = await getAllUser();
    return (
        <div className="min-h-screen bg-app text-app font-mono">
            {/* タイトル */}
            <PrivateHeader session={session} />

            {/* 本文 */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">

                {/* セクションタイトル */}
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-wide">
                        ユーザー一覧
                    </h3>
                    <p className="opacity-70 text-sm mt-1">
                        登録されている全てのユーザーの情報を確認・管理できます。
                    </p>
                </div>

                {/* カード */}
                <div className="rounded-2xl border border-[var(--border)] bg-card/60 backdrop-blur-sm shadow-[0_0_50px_-20px_rgba(255,255,255,0.2)] p-6">

                    {/* テーブル */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border)] text-sm font-bold text-app/80">
                                    <th className="py-3 px-4 text-left">ユーザー</th>
                                    <th className="py-3 px-4 text-left">ロール</th>
                                    <th className="py-3 px-4 text-left">状態</th>
                                    <th className="py-3 px-4 text-left">作成日</th>
                                    <th className="py-3 px-4 text-center">操作</th>
                                </tr>
                            </thead>

                            <tbody className="text-sm">
                                {users ? 
                                    users?.map((u) => (
                                        <tr key={u.id} className="border-b border-[var(--border)] hover:bg-app/40 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--border)]">
                                                        {u.pictureUrl ? (
                                                            <Image 
                                                                src={u.pictureUrl}
                                                                alt={u.displayName}
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-[var(--accent-cyan)] text-black font-bold text-2xl">
                                                                {u.displayName?.charAt(0).toUpperCase() ?? "?"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{u.displayName}</p>
                                                        <p className="text-xs opacity-60">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className="px-3 py-1 rounded-full text-xs bg-[var(--accent-pink)]/20 border border-[var(--accent-pink)]/40">
                                                    {u.role}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4">
                                                {u.isActive ? (
                                                    <span className="text-green-400 font-bold text-xs">有効</span>
                                                ) : (
                                                    <span className="text-red-400 font-bold text-xs">停止</span>
                                                )}
                                            </td>

                                            <td className="py-3 px-4 opacity-70 text-xs">
                                                {u.createdAt.toLocaleString("ja-JP", {
                                                    timeZone: "Asia/Tokyo",
                                                })}
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-2 text-xs">
                                                    <RoleChangeButton
                                                        userId={u.id}
                                                        currentRole={u.role as "editor" | "author" | "reader"}
                                                        displayName={u.displayName}
                                                        email={u.email}
                                                    />
                                                    <UserStatusToggle 
                                                        userId={u.id}
                                                        isActive={u.isActive}
                                                        displayName={u.displayName}
                                                        email={u.email}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                : 
                                    <div>アカウントが作成されていません</div>
                                }
                            </tbody>
                        </table>
                    </div>

                </div>
            </main>
        </div>
    );
}