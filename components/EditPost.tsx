"use client"

import { uploadImageAction } from "@/lib/actions/uploadImage";
import { useActionState, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// import Image from "next/image";
import Link from "next/link";
import { ComponentPropsWithoutRef } from 'react';
import rehypeSanitize from "rehype-sanitize";
import Image from "next/image";
import { updatePostAction } from "@/lib/actions/updatePost";
import { deletePostAction } from "@/lib/actions/deletePost";



type Post = {
    id: number;
    title: string;
    slug: string;
    authorId: number;
    publishedAt: string | null;
    markdown: string;
    tags: string;
};
type User = {
    id: number;
    displayName: string;
    pictureUrl?: string | null;
    bio?: string | null;
    role: "admin" | "editor" | "author" | "reader";
};


type EditPostProps = {
    post: Post;
    user: User | null;
};

type ActionState = {
    success: boolean;
    errors: {
        title?: string[];
        // slug?: string[];
        tags?: string[];
        content?: string[];
        form?: string[];  // フォーム全体の汎用エラーにも対応したい場合
    };
};


export default function EditPost({ post, user }: EditPostProps) {
        // 送信処理
        const formRef = useRef<HTMLFormElement>(null);
        const [state, formAction, pending] = useActionState(updatePostAction, {
            success: false, 
            errors: {},
            debug: null,
        });
        const err = (key: keyof ActionState['errors']) => state.errors[key]?.[0];           
        
        // 削除送信用
        const [deleteState, deleteAction, deleting] = useActionState(
            deletePostAction,
            { success: false }
        );

    
        // 画像アップロード用のアクション状態
        const [uploadState, uploadAction, uploading] = useActionState(
            uploadImageAction,
            { ok: false } // 初期値
        );
    
        // md内に画像のurlを挿入
        function insertAtCursor(
            textarea: HTMLTextAreaElement | null,
            insertText: string,
            setContent: (v: string) => void
        ) {
            if (!textarea) return;
            
            const start = textarea.selectionStart ?? textarea.value.length;
            const end = textarea.selectionEnd ?? textarea.value.length;
            const before = textarea.value.slice(0, start);
            const after = textarea.value.slice(end);
            const next = before + insertText + after;
            
            setContent(next);
            
            // React の状態更新後にカーソル位置を設定
            // より確実に DOM 更新を待つ
            setTimeout(() => {
                const pos = start + insertText.length;
                textarea.setSelectionRange(pos, pos);
                textarea.focus();
            }, 0);
        }
    
        // 画像ファイルが選択されたら、FormData を組んで uploadAction を呼ぶ
        async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
            const file = e.target.files?.[0];
            if (!file) return;
            // if (!slug) {
            //     alert("まずスラッグを入力してください。画像は /<slug>/ ディレクトリに保存します。");
            //     return;
            // }
            
            try {
                setCompressing(true);
                // ここで圧縮（webp化 & リサイズ）
                const compressed = await compressImageToWebp(file, 1600, 0.8);
                
                const fd = new FormData();
                fd.set("slug", slug);
                fd.set("image", compressed);
        
                // サーバーアクション実行
                uploadAction(fd);            
            } catch (error) {
                console.error(error);
                alert("画像の圧縮中にエラーが発生しました。もう一度お試しください。");
            }finally {
                // 同じファイルを続けて選べるようにinput値をリセット
                e.target.value = "";
                setCompressing(false);
            }
        }

        // 画像の圧縮
        async function compressImageToWebp(
            file: File,
            maxSize = 1600,
            quality = 0.8,
            minSizeToCompress = 300 * 1024 // ← 300KB 未満は圧縮しない
        ): Promise<File> {
            // 小さいファイルはそのまま返す
            if (file.size <= minSizeToCompress) {
                return file;
            }

            return new Promise((resolve, reject) => {
                // タイムアウト設定(30秒)
                const timeout = setTimeout(() => {
                    reject(new Error("Image processing timeout"));
                }, 30000);

                const img = document.createElement("img");
                const reader = new FileReader();

                reader.onload = () => {
                    img.src = reader.result as string;
                };

                reader.onerror = (err) => {
                    clearTimeout(timeout);
                    reject(err);
                };

                img.onload = () => {
                    try {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d", { alpha: false });

                        if (!ctx) {
                            clearTimeout(timeout);
                            reject(new Error("Canvas not supported"));
                            return;
                        }

                        let { width, height } = img;

                        // 既に小さい画像はリサイズせず圧縮だけ（※ただし150KB超えているので再エンコードはする）
                        if (width <= maxSize && height <= maxSize) {
                            canvas.width = width;
                            canvas.height = height;
                        } else {
                            // アスペクト比を保って縮小
                            if (width > height) {
                                if (width > maxSize) {
                                height = Math.round((height * maxSize) / width);
                                width = maxSize;
                                }
                            } else {
                                if (height > maxSize) {
                                width = Math.round((width * maxSize) / height);
                                height = maxSize;
                                }
                            }
                            canvas.width = width;
                            canvas.height = height;
                        }

                        ctx.drawImage(img, 0, 0, width, height);

                        canvas.toBlob(
                            (blob) => {
                                clearTimeout(timeout);

                                if (!blob) {
                                    reject(new Error("Failed to compress image"));
                                    return;
                                }

                                const baseName = file.name.replace(/\.[^/.]+$/, "");
                                const compressedFile = new File([blob], `${baseName}.webp`, {
                                    type: "image/webp",
                                    lastModified: Date.now(),
                                });

                                resolve(compressedFile);
                            },
                            "image/webp",
                            quality
                        );
                    } catch (err) {
                        clearTimeout(timeout);
                        reject(err);
                    }
                };

                img.onerror = (err) => {
                    clearTimeout(timeout);
                    reject(err);
                };
                reader.readAsDataURL(file);
            });
        }

    
        // 別のuseEffectで結果を処理
        useEffect(() => {
            if (uploadState.ok && uploadState.markdown) {
                insertAtCursor(textareaRef.current, uploadState.markdown, setContent);
            } else if (uploadState.error) {
                alert(uploadState.error);
            }
        }, [uploadState]);
    
    
        // 編集・プレビュー切り替え
        const [mode, setMode] = useState<"edit" | "preview">("edit");
        // フォーム状態
        const [title, setTitle] = useState(post.title);
        // const [slug, setSlug] = useState(post.slug);
        const slug = post.slug;
        const [content, setContent] = useState(post.markdown);
        const [tags, setTags] = useState(post.tags);
        // const [autoSlug, setAutoSlug] = useState(false); // スラッグ自動生成
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const [publishChecked, setPublishChecked] = useState(!!post.publishedAt);
        const [publishDate, setPublishDate] = useState(
            toLocalDateTimeString(post.publishedAt) // ← 文字列
        );
        // 追加: 圧縮中フラグ
        const [compressing, setCompressing] = useState(false);
        // 圧縮中　画像追加中　切り替え
        const disabled = uploading || compressing;

    
        // タイトル変更時にスラッグを自動生成
        // useEffect(() => {
        //     if (autoSlug && title) {
        //         setSlug(slugify(title));
        //     }
        // }, [title, autoSlug]);
    
        // 成功時のリダイレクト
        // useEffect(() => {
        //     if (state.ok && state.slug) {
        //     router.push(`/posts/${state.slug}`);
        //     }
        // }, [state, router]);
    
        // ローカルストレージに自動保存（5秒ごと）
        // useEffect(() => {
        //     const timer = setTimeout(() => {
        //     if (title || content) {
        //         localStorage.setItem(
        //         "draft-post",
        //         JSON.stringify({ title, content, tags, timestamp: Date.now() })
        //         );
        //     }
        //     }, 5000);
        //     return () => clearTimeout(timer);
        // }, [title, content, tags]);
    
        // // 下書き復元
        // useEffect(() => {
        //     const draft = localStorage.getItem("draft-post");
        //     if (draft) {
        //         const parsed = JSON.parse(draft);
        //         const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000; // 24時間以内
        //         if (isRecent && confirm("下書きが見つかりました。復元しますか？")) {
        //             setTitle(parsed.title || "");
        //             setContent(parsed.content || "");
        //             setTags(parsed.tags || "");
        //         }
        //     }
        // }, []);


    // date を datetime-local 用に整形する関数を作る
    function toLocalDateTimeString(date: string | number | Date | null): string {
        if (!date) return "";
        const d = new Date(date);
        // タイムゾーン補正：UTC→ローカル
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
    }
    


    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">            
            <div className="flex items-start justify-between">
                <h1 className="text-3xl font-bold">投稿を編集</h1>

                {/* 削除ボタン（admin専用）。二度押し防止 */}
                <form
                    action={deleteAction}
                    onSubmit={(e) => {
                        if (
                            !confirm("本当にこの記事を削除しますか？この操作は取り消せません。")
                        ) {
                            e.preventDefault();
                        }
                    }}
                >
                    <input type="hidden" name="postId" value={post.id} />
                    <button
                        type="submit"
                        disabled={deleting}
                        className="px-3 py-2 text-sm rounded border border-red-500 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50"
                    >
                        {deleting ? "削除中..." : "削除"}
                    </button>
                    {deleteState.error && (
                        <p className="text-red-600 text-xs mt-1">{deleteState.error}</p>
                    )}
                </form>
            </div>

            
            <form ref={formRef} action={formAction} className="space-y-6 max-w-4xl mx-auto p-6">
                {/* デバッグ出力 */}
                {state.debug != null && (
                    <pre className="text-xs bg-gray-800 text-white p-2 rounded">
                        {JSON.stringify(state.debug, null, 2)}
                    </pre>
                )}
                {state.success && (
                    <p className="text-center text-green-600 font-medium">
                        更新しました
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

                
                <input type="hidden" name="postId" value={post.id} />
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

                {/* 著者情報 */}
                <div className="flex justify-between items-center">
                    <div>作成ユーザー</div>
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
                </div>
                

                {/* スラッグ */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">スラッグ </label>
                        {/* <label className="text-xs flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={autoSlug}
                                onChange={(e) => setAutoSlug(e.target.checked)}
                            />
                            自動生成
                        </label> */}
                        {post.slug}
                    </div>
                    {/* <input
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
                    /> */}
                    <input type="hidden" name="slug" value={post.slug} />
                    {/* <p className="text-xs opacity-60 mt-1">
                        URL: /posts/yyyy/mm/{slug || "(スラッグ)"}
                    </p>
                    {err('slug') && (
                        <p className="text-red-600 text-sm mt-1">{err('slug')}</p>
                    )} */}
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
                            <textarea
                                ref={textareaRef}
                                name="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
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
                                    accept="image/*"
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
                                    <p className="text-xs opacity-60 mt-1">
                                        画像のファイル名に空白や日本語を使わないでください
                                    </p>
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
                                    checked={publishChecked}
                                    onChange={(e) => {
                                        // const dateInput = document.querySelector<HTMLInputElement>('#publishDate');
                                        // if (dateInput) dateInput.disabled = !e.target.checked;
                                        const checked = e.target.checked;
                                        setPublishChecked(checked);
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
                                value={publishDate}
                                className="border rounded-md px-2 py-1 text-sm ml-6"
                                onChange={(e) => setPublishDate(e.target.value)}
                                disabled={!publishChecked} 
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
                                {pending ? "更新中..." : "更新"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm("入力内容を破棄しますか？")) {
                                        formRef.current?.reset();
                                        setTitle("");
                                        setContent("");
                                        setTags("");
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
                        className="prose prose-pre:bg-[#0b0f14] prose-pre:border prose-pre:border-[var(--border)]
                            prose-img:rounded-lg prose-img:border prose-img:border-[var(--border)] max-w-none
                            prose-a:text-[var(--accent-cyan)] hover:prose-a:text-[var(--accent-pink)]
                            prose-hr:border-[var(--border)]
                            prose-code:bg-[color:rgba(34,211,238,0.08)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                            prose-table:border prose-table:border-[var(--border)] prose-th:border prose-td:border prose-td:px-3 prose-td:py-1.5"
                    >
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}
                            components={{
                            img: (props) => {
                                const { src, alt } = props as ComponentPropsWithoutRef<"img">;
                                if (typeof src !== "string" || src.length === 0) return null;
                                // alt の中から |w=数字 を抽出（例: "説明|w=480"）
                                const [altText, sizeSpec] = (alt ?? "").split("|", 2);
                                const widthMatch = sizeSpec?.match(/w=(\d{2,4})/);
                                const width = widthMatch ? parseInt(widthMatch[1], 10) : undefined;
                                const resolvedSrc = src.startsWith("/")
                                    ? `${process.env.APP_ORIGIN ?? "https://dev.kmdworks.com"}${src}`
                                    : src;
                                return (
                                    <div className="flex justify-center my-4">
                                        <Image
                                            src={resolvedSrc}
                                            alt={altText?.trim() ?? ""}
                                            width={width ? width : undefined}                                        
                                            className="rounded-lg border border-[var(--border)] h-auto"
                                        />
                                        
                                    </div>
                                );
                            },
                            a: (props) => {
                                const { href, children, ...rest } = props as ComponentPropsWithoutRef<"a">;
                                const h = typeof href === "string" ? href : "";
                                const isExternal =
                                /^https?:\/\//i.test(h) || h.startsWith("//");
                                if (isExternal) {
                                    return (
                                        <a
                                            href={h}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            {...rest}
                                            >
                                            {children}
                                        </a>
                                    );
                                    }
                                return (
                                    <Link href={h || "#"} {...rest}>
                                        {children}
                                    </Link>
                                );
                            },
                            }}
                        >
                            {content || "（プレビューする内容がありません）"}
                        </ReactMarkdown>
                    </div>
                )}

            </form>
        </div>
    );
}
