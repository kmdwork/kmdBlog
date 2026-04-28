import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComponentPropsWithoutRef } from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Footer from "@/components/layouts/Footer";
import PublicHeader from "@/components/layouts/PublicHeader";
import WorksGalleryListPreview from "@/components/WorksGalleryListPreview";
import { getWork } from "@/lib/works";

type Params = {
    params: Promise<{ slug: string }>;
};

const colorMap = {
    cyan: {
        text: "text-cyan-400",
        border: "border-cyan-400",
        softBorder: "border-cyan-400/50",
        gradFrom: "from-cyan-900/30",
    },
    pink: {
        text: "text-pink-400",
        border: "border-pink-400",
        softBorder: "border-pink-400/50",
        gradFrom: "from-pink-900/30",
    },
    yellow: {
        text: "text-yellow-400",
        border: "border-yellow-400",
        softBorder: "border-yellow-400/50",
        gradFrom: "from-yellow-900/30",
    },
} as const;

function buildDescription(markdown: string): string {
    const plain = markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`[^`]*`/g, " ")
        .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/[*_>~-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!plain) return "works 詳細ページです。";
    return plain.slice(0, 140);
}

function getColorBySlug(slug: string): keyof typeof colorMap {
    const match = slug.match(/works-case-(\d+)/);
    if (!match) return "cyan";

    const n = Number(match[1]);
    if (!Number.isFinite(n) || n <= 0) return "cyan";

    const order: Array<keyof typeof colorMap> = ["cyan", "pink", "yellow"];
    return order[(n - 1) % order.length];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { slug } = await params;
    const work = await getWork(slug);
    const origin = process.env.APP_ORIGIN ?? "https://kmdworks.com";

    if (!work) {
        return {
            title: "Work が見つかりません",
            robots: {
                index: false,
                follow: false,
            },
        };
    }

    const canonical = `${origin}/works/${work.slug}`;
    const description = buildDescription(work.markdown);

    return {
        title: work.title,
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            type: "article",
            url: canonical,
            title: work.title,
            description,
            siteName: "KMD WORKS",
            locale: "ja_JP",
            publishedTime: work.publishedAt ? new Date(work.publishedAt).toISOString() : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title: work.title,
            description,
        },
    };
}

export default async function WorkDetailPage({ params }: Params) {
    const { slug } = await params;
    const work = await getWork(slug);

    if (!work) {
        notFound();
    }

    const c = colorMap[getColorBySlug(work.slug)];
    // const published = work.publishedAt ? work.publishedAt.slice(0, 10) : "未定";
    const origin = process.env.APP_ORIGIN ?? "https://kmdworks.com";
    const heroSrc = `${origin}/media/projects/${work.slug}/hero.webp`;
    const gallerySrcList = [1, 2, 3].map((n) => `${origin}/media/projects/${work.slug}/gallery-${n}.webp`);

    const isBareUrl = (s: string) => /^(https?:\/\/|\/\/)\S+$/i.test(s.trim());

    const toText = (node: unknown): string | null => {
        if (typeof node === "string") return node;
        if (Array.isArray(node) && node.every((x) => typeof x === "string")) {
            return node.join("");
        }
        return null;
    };

    const extractSingleBareUrl = (children: React.ReactNode): string | null => {
        const list = Array.isArray(children) ? children : [children];
        const filtered = list.filter((c) => c !== "\n" && c !== null && c !== undefined);

        if (filtered.length !== 1) return null;

        const only = filtered[0];

        if (typeof only === "string" && isBareUrl(only)) return only.trim();

        if (React.isValidElement(only)) {
            const props = only.props as { href?: unknown; children?: unknown };
            const href = typeof props.href === "string" ? props.href.trim() : null;
            const text = toText(props.children)?.trim() ?? null;
            if (!href || !text) return null;
            if (href === text && isBareUrl(href)) return href;
        }
        return null;
    };

    function LinkCard({ url }: { url: string }) {
        let host = "";
        try {
            host = new URL(url).host;
        } catch {}

        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="my-4 block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] hover:opacity-95 transition"
            >
                <div className="p-4">
                    <div className="text-xs opacity-70">{host}</div>
                    <div className="mt-1 break-all font-semibold">{url}</div>
                </div>
            </a>
        );
    }

    return (
        <main className="min-h-screen bg-app text-app font-mono">
            <PublicHeader />

            <article className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black leading-tight break-words">
                        <span className={c.text}>{work.title}</span>
                    </h1>
                    {/* <p className="mt-3 opacity-80">{buildDescription(work.markdown)}</p> */}
                    <time className="mt-3 block text-sm opacity-70" dateTime={work.publishedAt ?? undefined}>
                        {/* 公開日: {published} */}
                    </time>
                    <div className="h-0.5 w-28 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-pink)] to-[var(--accent-yellow)] mt-4" />
                </header>

                <section
                    className={[
                        "mb-8 overflow-hidden border-2 rounded-2xl",
                        "bg-gradient-to-br to-black/10",
                        c.border,
                        c.gradFrom,
                    ].join(" ")}
                >
                    <Image
                        src={heroSrc}
                        alt={`${work.title} hero`}
                        width={1600}
                        height={900}
                        sizes="100vw"
                        className="w-full h-auto"
                        loading="eager"
                    />
                </section>

                <section className="mb-10 prose prose-pre:bg-[#0b0f14] prose-pre:border prose-pre:border-[var(--border)] prose-img:rounded-lg prose-img:border prose-img:border-[var(--border)] max-w-none prose-a:text-[var(--accent-cyan)] hover:prose-a:text-[var(--accent-pink)] prose-hr:border-[var(--border)] prose-code:bg-[color:rgba(34,211,238,0.08)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-table:border prose-table:border-[var(--border)] prose-th:border prose-td:border prose-td:px-3 prose-td:py-1.5">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            img: (props) => {
                                const { src, alt } = props as ComponentPropsWithoutRef<"img">;
                                if (typeof src !== "string" || src.length === 0) return null;
                                const [altText, sizeSpec] = (alt ?? "").split("|", 2);
                                const widthMatch = sizeSpec?.match(/w=(\d{2,4})/);
                                const width = widthMatch ? parseInt(widthMatch[1], 10) : undefined;
                                const resolvedSrc = src.startsWith("/")
                                    ? `${process.env.APP_ORIGIN ?? "https://kmdworks.com"}${src}`
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
                                const isExternal = /^https?:\/\//i.test(h) || h.startsWith("//");

                                if (isExternal) {
                                    return (
                                        <a href={h} target="_blank" rel="noopener noreferrer" {...rest}>
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
                            p: ({ children, ...rest }) => {
                                const url = extractSingleBareUrl(children);
                                if (url) return <LinkCard url={url} />;
                                return <p {...rest}>{children}</p>;
                            },
                        }}
                    >
                        {work.markdown}
                    </ReactMarkdown>
                </section>

                <section className="mb-10">
                    <h2 className={["text-xl sm:text-2xl font-black mb-4", c.text].join(" ")}>GALLERY</h2>
                    <WorksGalleryListPreview
                        images={gallerySrcList}
                        title={work.title}
                        textClassName={c.text}
                        borderClassName={c.softBorder}
                        gradientClassName={c.gradFrom}
                    />
                </section>

                <div className="mt-10 flex items-center justify-between">
                    <Link href="/works" className="text-sm text-[var(--accent-cyan)] hover:text-[var(--accent-pink)]">
                        ← 一覧へ戻る
                    </Link>
                </div>
            </article>

            <Footer />
        </main>
    );
}
