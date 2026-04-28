"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type WorksGalleryListPreviewProps = {
    images: string[];
    title: string;
    textClassName: string;
    borderClassName: string;
    gradientClassName: string;
};

export default function WorksGalleryListPreview({
    images,
    title,
    textClassName,
    borderClassName,
    gradientClassName,
}: WorksGalleryListPreviewProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    useEffect(() => {
        if (activeIndex === null) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setActiveIndex(null);
            }
            if (event.key === "ArrowRight") {
                setActiveIndex((current) => {
                    if (current === null) return current;
                    return (current + 1) % images.length;
                });
            }
            if (event.key === "ArrowLeft") {
                setActiveIndex((current) => {
                    if (current === null) return current;
                    return (current - 1 + images.length) % images.length;
                });
            }
        };

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [activeIndex, images.length]);

    if (images.length === 0) return null;

    const previewIndex = activeIndex ?? 0;
    const activeSrc = activeIndex !== null ? images[previewIndex] : null;

    return (
        <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((src, idx) => (
                    <button
                        key={src}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className={[
                            "group relative overflow-hidden aspect-[4/3] border rounded-xl bg-gradient-to-br to-black/10",
                            "text-left transition hover:scale-[1.01]",
                            borderClassName,
                            gradientClassName,
                        ].join(" ")}
                        aria-label={`${title} gallery ${idx + 1} を拡大表示`}
                    >
                        <Image
                            src={src}
                            alt={`${title} gallery ${idx + 1}`}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                    </button>
                ))}
            </div>

            {activeSrc ? (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm px-4 py-6 sm:p-8"
                    onClick={() => setActiveIndex(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${title} image preview`}
                >
                    <div className="mx-auto flex h-full max-w-6xl items-center justify-center">
                        <div
                            className="relative w-full"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => setActiveIndex(null)}
                                className={[
                                    "absolute right-0 top-[-3rem] rounded border px-3 py-1 text-sm font-bold",
                                    "bg-black/70 hover:bg-black",
                                    textClassName,
                                    borderClassName,
                                ].join(" ")}
                            >
                                CLOSE
                            </button>

                            <div
                                className={[
                                    "relative overflow-hidden rounded-2xl border bg-gradient-to-br to-black/20",
                                    "h-[60vh] sm:h-[72vh]",
                                    borderClassName,
                                    gradientClassName,
                                ].join(" ")}
                            >
                                <Image
                                    src={activeSrc}
                                    alt={`${title} preview`}
                                    fill
                                    sizes="100vw"
                                    className="object-contain"
                                    priority
                                />
                            </div>

                            {images.length > 1 ? (
                                <div className="mt-4 flex items-center justify-between gap-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveIndex((current) =>
                                                current === null ? 0 : (current - 1 + images.length) % images.length
                                            )
                                        }
                                        className={[
                                            "rounded border px-4 py-2 text-sm font-bold",
                                            "bg-black/70 hover:bg-black",
                                            textClassName,
                                            borderClassName,
                                        ].join(" ")}
                                    >
                                        PREV
                                    </button>
                                    <p className={["text-sm opacity-80", textClassName].join(" ")}>
                                        {previewIndex + 1} / {images.length}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveIndex((current) =>
                                                current === null ? 0 : (current + 1) % images.length
                                            )
                                        }
                                        className={[
                                            "rounded border px-4 py-2 text-sm font-bold",
                                            "bg-black/70 hover:bg-black",
                                            textClassName,
                                            borderClassName,
                                        ].join(" ")}
                                    >
                                        NEXT
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
