"use client"

import { toggleUserActiveAction } from "@/lib/actions/toggleUserActive";
import { useActionState, useEffect, useState } from "react";


type Props = {
    userId: number;
    isActive: boolean;
    displayName: string;
    email: string;
};



export default function UserStatusToggle({ userId, isActive, displayName, email }: Props) {
    const [open, setOpen] = useState(false);

    const [state, formAction, pending] = useActionState(toggleUserActiveAction, {
        success: false, 
        error: undefined,
    });

    // 成功したらモーダルを閉じる
    useEffect(() => {
        if (!pending && state.success && !state.error) {
            setOpen(false);
        }
    }, [pending, state.success, state.error]);

    return (
        <form action={formAction}>
            {/* 操作対象ユーザーIDを送る（信頼はせずサーバー側でチェック） */}
            <input type="hidden" name="userId" value={userId} />

            {/* 一覧テーブル上のボタン（ここでは confirm を出すだけ） */}
            <button
                type="button"
                className={`
                    px-3 py-1 rounded-full border text-xs transition-colors
                    ${
                        isActive
                            ? "border-red-500/40 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                            : "border-green-500/40 bg-green-500/20 text-green-300 hover:bg-green-500/30"
                    }
                `}
                onClick={() => setOpen(true)}
            >
                {isActive ? "停止" : "有効"}
            </button>

            {/* モーダル */}
            {open && (
                <div className="                    
                    fixed inset-0 z-50
                    flex items-center justify-center
                    bg-app text-app
                ">
                    <div className="bg-app rounded-xl border border-[var(--border)] bg-card/90 p-6 w-[90%] max-w-sm space-y-4 shadow-2xl">
                        <h2 className="text-lg font-bold">
                            {isActive ? "このユーザーを停止しますか？" : "このユーザーを有効化しますか？"}
                        </h2>

                        <p className="text-sm opacity-80">
                            対象: <span className="font-bold">{displayName}</span> / <span className="font-bold">{email}</span>
                        </p>

                        {state.error && (
                            <p className="text-xs text-red-400">{state.error}</p>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                className="px-4 py-1 text-xs rounded-full border border-[var(--border)] bg-app/40 hover:bg-app/60"
                                onClick={() => setOpen(false)}
                                disabled={pending}
                            >
                                キャンセル
                            </button>

                            {/* ここが submit → server action 発火 */}
                            <button
                                type="submit"
                                className={`
                                    px-4 py-1 text-xs rounded-full font-bold transition-colors
                                    ${
                                        isActive
                                            ? "bg-red-500 text-black hover:bg-red-400"
                                            : "bg-green-400 text-black hover:bg-green-300"
                                    }
                                `}
                                disabled={pending}
                            >
                                {pending ? "処理中…" : "OK"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    )
}
