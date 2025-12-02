"use client";

import { updateUserRoleAction } from "@/lib/actions/updateUserRole";
import { useActionState, useEffect, useState } from "react";

type Role = "editor" | "author" | "reader";
type Props = {
    userId: number;
    currentRole: Role;
    displayName: string;
    email: string;
};

export default function RoleChangeButton({
    userId,
    currentRole,
    displayName,
    email,
}: Props) {
    const [open, setOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role>(currentRole);

    const [state, formAction, pending] = useActionState(updateUserRoleAction, {
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
            {/* 操作対象ユーザーID */}
            <input type="hidden" name="userId" value={userId} />

            {/* 一覧側のボタン */}
            <button
                type="button"
                className="px-3 py-1 rounded-full border border-[var(--border)] bg-app/40 hover:bg-app/60 transition-colors text-xs"
                onClick={() => setOpen(true)}
            >
                権限変更
            </button>

            {/* モーダル */}
            {open && (
                <div className="
                    fixed inset-0 z-50
                    flex items-center justify-center
                    bg-app text-app
                ">
                    <div className="bg-app rounded-xl border border-[var(--border)] bg-card/90 p-6 w-[90%] max-w-sm space-y-4 shadow-2xl">
                        <h2 className="text-lg font-bold">権限の変更</h2>

                        <p className="text-sm opacity-80">
                            対象:{" "}
                            <span className="font-bold">{displayName}</span>{" "}
                            / <span className="font-bold">{email}</span>
                        </p>

                        {state.error && (
                            <p className="text-xs text-red-400">{state.error}</p>
                        )}

                        {/* ラジオボタン群 */}
                        <div className="space-y-2 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    value="editor"
                                    checked={selectedRole === "editor"}
                                    onChange={() => setSelectedRole("editor")}
                                    disabled={pending}
                                />
                                <span>editor（編集・公開権限）</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    value="author"
                                    checked={selectedRole === "author"}
                                    onChange={() => setSelectedRole("author")}
                                    disabled={pending}
                                />
                                <span>author（投稿作成権限）</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    value="reader"
                                    checked={selectedRole === "reader"}
                                    onChange={() => setSelectedRole("reader")}
                                    disabled={pending}
                                />
                                <span>reader（閲覧専用）</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                className="px-4 py-1 text-xs rounded-full border border-[var(--border)] bg-app/40 hover:bg-app/60"
                                onClick={() => setOpen(false)}
                                disabled={pending}
                            >
                                キャンセル
                            </button>

                            <button
                                type="submit"
                                className="px-4 py-1 text-xs rounded-full font-bold bg-[var(--accent-cyan)] text-black hover:opacity-90 transition-opacity disabled:opacity-60"
                                disabled={pending}
                            >
                                {pending ? "更新中…" : "保存"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    )
}
