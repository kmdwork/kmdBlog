import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layouts/Footer";
import PublicHeader from "@/components/layouts/PublicHeader";
import { getAllWorks } from "@/lib/works";

export const metadata: Metadata = {
    title: "Works",
    description: "KMD WORKS のプロジェクト一覧",
};

const colorMap = {
    cyan: {
        border: "border-cyan-400",
        text: "text-cyan-400",
        chipBg: "bg-cyan-400/20",
        chipBorder: "border-cyan-400/50",
        gradFrom: "from-cyan-900/20",
    },
    pink: {
        border: "border-pink-400",
        text: "text-pink-400",
        chipBg: "bg-pink-400/20",
        chipBorder: "border-pink-400/50",
        gradFrom: "from-pink-900/20",
    },
    yellow: {
        border: "border-yellow-400",
        text: "text-yellow-400",
        chipBg: "bg-yellow-400/20",
        chipBorder: "border-yellow-400/50",
        gradFrom: "from-yellow-900/20",
    },
} as const;

const colorCycle = ["cyan", "pink", "yellow"] as const;

export default async function WorksPage() {
    const works = await getAllWorks();
    const origin = process.env.APP_ORIGIN ?? "https://kmdworks.com";

    return (
        <main className="min-h-screen bg-app text-app font-mono">
            <PublicHeader />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                <h1 className="text-3xl sm:text-4xl font-black leading-tight">
                    WORKS <span className="text-[var(--accent-pink)]">LIST</span>
                </h1>
                <p className="mt-4 max-w-2xl text-sm sm:text-base opacity-80 leading-relaxed">
                    ここでは、今まで行ってきたプロジェクトについて紹介しています。
                </p>
                <div className="h-0.5 w-28 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-pink)] to-[var(--accent-yellow)] mt-4 mb-8" />

                <div className="border-2 border-[var(--accent-cyan)] p-6 sm:p-8 bg-card/70 rounded-2xl">
                    <div className="grid md:grid-cols-3 gap-6">
                        {works.map((work, i) => {
                            const color = colorCycle[i % colorCycle.length];
                            const c = colorMap[color];
                            const heroSrc = `${origin}/media/projects/${work.slug}/hero.webp`;

                            return (
                                <Link
                                    key={work.slug}
                                    href={`/works/${work.slug}`}
                                    className={[
                                        "border-2 rounded-xl p-6 transition-all group cursor-pointer",
                                        "bg-gradient-to-br to-black/0 hover:scale-[1.02]",
                                        c.gradFrom,
                                        c.border,
                                    ].join(" ")}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={["text-sm", c.text].join(" ")}>[{i.toString().padStart(2, "0")}]</span>
                                        <div className={["w-3 h-3 animate-pulse", c.text].join(" ")} />
                                    </div>
                                    <div
                                        className={[
                                            "relative h-48 mb-4 overflow-hidden border rounded bg-gradient-to-br to-black/0 group-hover:brightness-110",
                                            c.chipBorder,
                                            c.gradFrom,
                                        ].join(" ")}
                                    >
                                        <Image
                                            src={heroSrc}
                                            alt={`${work.title} hero`}
                                            fill
                                            sizes="(min-width: 768px) 33vw, 100vw"
                                            className="object-fill"
                                        />
                                    </div>
                                    <h2 className={["text-xl font-black mb-2", c.text].join(" ")}>{work.title}</h2>
                                    {work.tags.length > 0 ? (
                                        <div className="flex gap-2">
                                            <span className={["text-xs px-2 py-1 border rounded", c.chipBg, c.text, c.chipBorder].join(" ")}>
                                                {work.tags.join(" + ")}
                                            </span>
                                        </div>
                                    ) : null}
                                </Link>
                            );
                        })}
                    </div>
                    {works.length === 0 ? (
                        <p className="text-sm opacity-70">works-case-* の投稿がまだありません。</p>
                    ) : null}
                </div>
            </section>

            <Footer />
        </main>
    );
}
