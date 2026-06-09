import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/layouts/Footer";
import PublicHeader from "@/components/layouts/PublicHeader";
import WorksGalleryListPreview from "@/components/WorksGalleryListPreview";
import { MarkdownRenderer, extractMarkdownDescription, markdownProseClassName } from "@/lib/markdown";
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
    const description = extractMarkdownDescription(work.markdown, "works 詳細ページです。");

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

                <section className="mb-10">
                    <MarkdownRenderer markdown={work.markdown} className={markdownProseClassName} />
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
