"use client";

import { useActionState, useEffect, useState, useRef } from "react";
// import { useRouter } from "next/navigation";
// import type { CreatePostState } from "@/lib/actions/createPost";
import { createPostAction } from "@/lib/actions/createPost";
import { MarkdownEditor, type MarkdownEditorHandle } from "@/components/MarkdownEditor";
import { uploadImageAction } from "@/lib/actions/uploadImage";
import { prepareImageForUpload } from "@/lib/images/client";
import { IMAGE_INPUT_ACCEPT } from "@/lib/images/policy";
import { MarkdownRenderer, markdownProseClassName } from "@/lib/markdown";
// import Image from "next/image";


// const initialState: CreatePostState = { ok: false };

type ActionState = {
    success: boolean;
    errors: {
        title?: string[];
        slug?: string[];
        tags?: string[];
        content?: string[];
        form?: string[];  // フォーム全体の汎用エラーにも対応したい場合
    };
};



// スラッグ生成ヘルパー
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // アクセント記号削除
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CreatePost() {
    // const router = useRouter();
    // 送信処理
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction, pending] = useActionState(createPostAction, {
        success: false, 
        errors: {},
        debug: null,
    });
    const err = (key: keyof ActionState['errors']) => state.errors[key]?.[0];     

    // 画像アップロード用のアクション状態
    const [uploadState, uploadAction, uploading] = useActionState(
        uploadImageAction,
        { ok: false } // 初期値
    );

    // 画像ファイルが選択されたら、FormData を組んで uploadAction を呼ぶ
    async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!slug) {
            alert("まずスラッグを入力してください。画像は /<slug>/ ディレクトリに保存します。");
            return;
        }

        try {
            setCompressing(true);
            const prepared = await prepareImageForUpload(file);
            
            const fd = new FormData();
            fd.set("slug", slug);
            fd.set("image", prepared);
    
            // サーバーアクション実行
            uploadAction(fd);            
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "画像を処理できませんでした。");
        } finally {
            // 同じファイルを続けて選べるようにinput値をリセット
            e.target.value = "";
            setCompressing(false);
        }
    }

    // 別のuseEffectで結果を処理
    useEffect(() => {
        if (uploadState.ok && uploadState.markdown) {
            editorRef.current?.insertText(uploadState.markdown);
        } else if (uploadState.error) {
            alert(uploadState.error);
        }
    }, [uploadState]);


    // 編集・プレビュー切り替え
    const [mode, setMode] = useState<"edit" | "preview">("edit");
    // フォーム状態
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState("");
    const [autoSlug, setAutoSlug] = useState(false); // スラッグ自動生成
    const editorRef = useRef<MarkdownEditorHandle>(null);
    // 追加: 圧縮中フラグ
    const [compressing, setCompressing] = useState(false);
    // 圧縮中　画像追加中　切り替え
    const disabled = uploading || compressing;

    // タイトル変更時にスラッグを自動生成
    useEffect(() => {
        if (autoSlug && title) {
            setSlug(slugify(title));
        }
    }, [title, autoSlug]);

    // 成功時のリダイレクト
    // useEffect(() => {
    //     if (state.ok && state.slug) {
    //     router.push(`/posts/${state.slug}`);
    //     }
    // }, [state, router]);

    // ローカルストレージに自動保存（5秒ごと）
    useEffect(() => {
        const timer = setTimeout(() => {
        if (title || content) {
            localStorage.setItem(
            "draft-post",
            JSON.stringify({ title, slug, content, tags, timestamp: Date.now() })
            );
        }
        }, 5000);
        return () => clearTimeout(timer);
    }, [title, slug, content, tags]);

    // 下書き復元
    useEffect(() => {
        const draft = localStorage.getItem("draft-post");
        if (draft) {
            const parsed = JSON.parse(draft);
            const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000; // 24時間以内
            if (isRecent && confirm("下書きが見つかりました。復元しますか？")) {
                setTitle(parsed.title || "");
                setSlug(parsed.slug || "");
                setContent(parsed.content || "");
                setTags(parsed.tags || "");
            }
        }
    }, []);

    return (
        <form ref={formRef} action={formAction} className="space-y-6 max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold">新規投稿</h1>
            {/* デバッグ出力 */}
            {state.debug != null && (
                <pre className="text-xs bg-gray-800 text-white p-2 rounded overflow-auto">
                    {JSON.stringify(state.debug, null, 2)}
                </pre>
            )}
            {state.success && (
                <p className="text-center text-green-600 font-medium">
                    送信に成功！
                </p>
            )}
            {err('form') && (
                <p className="text-red-600 text-sm mt-1">{err('form')}</p>
            )}



            {/* タブ切り替え */}
            <div className="flex gap-2 text-sm border-b border-[var(--border)] mb-4">
                <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className={`px-3 py-2 border-b-2 ${
                        mode === "edit"
                        ? "border-[var(--accent-cyan)] text-[var(--accent-cyan)]"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                >
                編集
                </button>
                <button
                    type="button"
                    onClick={() => setMode("preview")}
                    className={`px-3 py-2 border-b-2 ${
                        mode === "preview"
                        ? "border-[var(--accent-pink)] text-[var(--accent-pink)]"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                >
                    プレビュー
                </button>
            </div>

            
            
            {/* タイトル */}
            <div>
                <label className="block text-sm font-medium mb-2">タイトル *</label>
                <input
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full rounded border p-3 bg-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="記事のタイトルを入力"
                />
                {err('title') && (
                    <p className="text-red-600 text-sm mt-1">{err('title')}</p>
                )}
            </div>

            {/* スラッグ */}
            <div>
                <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">スラッグ *</label>
                <label className="text-xs flex items-center gap-1">
                    <input
                        type="checkbox"
                        checked={autoSlug}
                        onChange={(e) => setAutoSlug(e.target.checked)}
                    />
                    自動生成
                </label>
                </div>
                <input
                    name="slug"
                    value={slug}
                    onChange={(e) => {
                        setSlug(e.target.value);
                        setAutoSlug(false); // 手動編集時は自動生成OFF
                    }}
                    required
                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                    className="w-full rounded border p-3 bg-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="hello-world"
                />
                <p className="text-xs opacity-60 mt-1">
                    URL: /posts/yyyy/mm/{slug || "(スラッグ)"}
                </p>
                {err('slug') && (
                    <p className="text-red-600 text-sm mt-1">{err('slug')}</p>
                )}
            </div>

            {/* タグ */}
            <div>
                <label className="block text-sm font-medium mb-2">タグ（カンマ区切り）</label>
                <input
                    name="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full rounded border p-3 bg-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="nextjs, cloudflare, drizzle"
                />
                {tags && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {tags.split(",").map((tag, i) => {
                            const trimmed = tag.trim();
                            return trimmed ? (
                                <span
                                    key={i}
                                    className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs"
                                    >
                                    {trimmed}
                                </span>
                            ) : null;
                        })}
                    </div>
                )}
            </div>

            {mode === "edit" && (
                <>
                    {/* 本文 */}
                    <div>
                        <label className="block text-sm font-medium mb-2">本文（Markdown）*</label>
                        <MarkdownEditor
                            ref={editorRef}
                            name="content"
                            value={content}
                            onChange={setContent}
                            required={true}
                            minLength={20}
                            className="w-full rounded border p-3 bg-transparent min-h-[400px] font-mono text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="# 見出し&#10;&#10;本文を書く..."
                        />
                        <p className="text-xs opacity-60 mt-1">
                            {content.length} 文字 / 最低 20 文字
                        </p>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                                type="file"
                                accept={IMAGE_INPUT_ACCEPT}
                                className="hidden"
                                disabled={uploading}
                                onChange={handleImageSelect}
                            />
                            <span className="px-2 py-1 rounded border text-[10px] leading-none cursor-pointer">
                            画像を挿入
                            </span>
                            {/* 画像アップロード中のメッセージ */}
                            {disabled ? (
                                <p className="text-xs opacity-60 mt-1">
                                    {compressing ? "画像を圧縮中…" : "画像をアップロード中…"}
                                </p>
                            ) : (
                                <p className="text-xs opacity-60 mt-1">JPEG・PNG・WebP / 最大5 MiB</p>
                            )}
                        </label>
                        {err('content') && (
                            <p className="text-red-600 text-sm mt-1">{err('content')}</p>
                        )}
                    </div>


                    {/* 公開設定 */}
                    <div className="flex flex-col gap-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="publish"
                                id="publish"
                                className="w-4 h-4"
                                onChange={(e) => {
                                    const dateInput = document.querySelector<HTMLInputElement>('#publishDate');
                                    if (dateInput) dateInput.disabled = !e.target.checked;
                                }}
                            />
                            <span className="text-sm">公開する（editor 以上のみ有効）</span>
                        </label>

                        <label htmlFor="publishDate" className="text-sm ml-6 opacity-80">
                            公開日を指定：
                        </label>
                        <input
                            type="datetime-local"
                            name="publishDate"
                            id="publishDate"
                            className="border rounded-md px-2 py-1 text-sm ml-6"
                            disabled
                        />
                    </div>
                    {/* エラー表示 */}

                    {/* ボタン */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={pending}
                            className="px-6 py-3 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                            {pending ? "保存中..." : "保存"}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (confirm("入力内容を破棄しますか？")) {
                                    formRef.current?.reset();
                                    setTitle("");
                                    setSlug("");
                                    setContent("");
                                    setTags("");
                                    localStorage.removeItem("draft-post");
                                }
                            }}
                            className="px-6 py-3 rounded border hover:bg-gray-100"
                        >
                        リセット
                        </button>
                    </div>

                    {/* 自動保存インジケーター */}
                    <p className="text-xs opacity-50">💾 下書きは自動保存されます</p>

                </>
            )}


            {mode === "preview" && (
                <div
                    className={markdownProseClassName}
                >
                    <MarkdownRenderer
                        markdown={content}
                        className=""
                        sanitize
                        enableLinkCard={false}
                        emptyFallback="（プレビューする内容がありません）"
                    />
                </div>
            )}

        </form>
    );
}
