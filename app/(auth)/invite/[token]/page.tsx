import { auth, signIn } from "@/auth";
import { invites } from "@/db/schema";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export const metadata = {
  title: "invite",
};


type Params = {
    params: Promise<{token: string}>
}


export default async function InviteAcceptPage({ params }: Params) {
    const { token } = await params;
    const db = getDb();
    const [inv] = await db.select().from(invites).where(eq(invites.token, token));

    if (!inv) notFound();
    if (inv.usedAt) return <Msg text="この招待は使用済みです。" />;
    if (inv.expiresAt <= new Date()) return <Msg text="この招待は期限切れです。" />;

    // すでにログイン済みなら管理画面に連れていく
    const session = await auth();
    if (session) redirect("/management");

    // サーバーアクションで Google ログイン開始
    async function accept() {
        "use server";
        await signIn("google", { redirectTo: "/management" });
    }

    return (
        <div className="min-h-[50vh] grid place-items-center p-6">
            <form action={accept} className="space-y-4 max-w-lg text-center">
                <h1 className="text-2xl font-bold">招待を受け取る</h1>
                <p className="opacity-80">メール: <b>{inv.email}</b></p>
                <p className="opacity-80">ロール: <b>{inv.role}</b></p>
                <button className="mt-4 px-4 py-2 rounded-xl border">Googleで参加</button>
            </form>
        </div>
    );
}

function Msg({ text }: { text: string }) {
  return (
    <div className="min-h-[50vh] grid place-items-center">
      <div className="text-center space-y-2">
        <p>{text}</p>
        <a className="underline" href="/login">ログインへ戻る</a>
      </div>
    </div>
  );
}