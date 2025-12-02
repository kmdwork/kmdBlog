"use client";

import { updateBioAction } from "@/lib/actions/updateBio";
import { useActionState, useEffect, useState } from "react";

type BioEditorProps = {
    initialBio: string | null;
};


export default function BioEditor({ initialBio }: BioEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialBio ?? "");

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setValue(initialBio ?? "");
        setIsEditing(false);
    };

    const [state, formAction, pending] = useActionState(updateBioAction, {
        success: false, 
        error: undefined,
        bio: null,
    });

    // サーバーアクションの結果（state.bio）が返ってきたらローカル値を更新
    useEffect(() => {
        if (state.success && state.bio !== undefined) {
            setValue(state.bio ?? "");
            setIsEditing(false);
        }
    }, [state.success, state.bio]);

    if (!isEditing) {
        // 表示モード
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                    <p className="font-bold">自己紹介</p>
                    <button
                        type="button"
                        onClick={handleEditClick}
                        className="text-xs px-3 py-1 rounded-full border border-[var(--border)] bg-app/60 hover:bg-app/80 transition-colors"
                    >
                        編集
                    </button>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-app/40 p-4 text-sm leading-relaxed text-app/90 min-h-[4rem]">
                    {value.trim() !== "" ? value : "未記入"}
                </div>
            </div>
        );
    }

    // 編集モード
    return (
        <form action={formAction} className="space-y-2">
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                    <p className="font-bold">自己紹介</p>
                </div>

                <textarea
                    name="bio"
                    className="w-full rounded-xl border border-[var(--border)] bg-app/60 p-3 text-sm leading-relaxed text-app/90 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
                    rows={4}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="自己紹介文を入力してください"
                />

                {state.error && (
                    <p className="text-xs text-red-400">{state.error}</p>
                )}


                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="text-xs px-3 py-1 rounded-full border border-[var(--border)] bg-app/40 hover:bg-app/60 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        disabled={pending}
                        type="submit"
                        className="text-xs px-4 py-1 rounded-full bg-[var(--accent-cyan)] text-black font-bold hover:opacity-90 transition-opacity"
                    >
                        {pending ? "保存中..." : "保存"}
                    </button>
                </div>
            </div>
        </form>
    );
}
