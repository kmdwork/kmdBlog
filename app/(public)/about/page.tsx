import type { Metadata } from "next";
import Footer from "@/components/layouts/Footer";
import PublicHeader from "@/components/layouts/PublicHeader";

export const metadata: Metadata = {
    title: "About",
    description: "KMD WORKS の概要ページ",
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-app text-app font-mono">
            <PublicHeader />

            <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                <h1 className="text-3xl sm:text-4xl font-black leading-tight">
                    ABOUT <span className="text-[var(--accent-pink)]">ME</span>
                </h1>
                <div className="h-0.5 w-28 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-pink)] to-[var(--accent-yellow)] mt-4 mb-8" />

                <article className="rounded-xl border border-[var(--border)] bg-card p-6 sm:p-8 leading-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-4 text-sm sm:text-base opacity-90">
                            <p>
                                このサイトは、個人開発や日々の学習の中で得た知見を記録する技術ブログです。
                            </p>
                            <p>
                                Next.js と Cloudflare（Workers / D1 / R2）を中心に、軽量で運用しやすいモダンな構成をテーマに開発や実験を行っています。
                            </p>
                            <p>
                                また、ここでは実装時に考えたことや試行錯誤の過程などをできるだけそのまま残し、学習ログとしてのPOSTも公開しています。
                            </p>
                            <p>
                                同時に、自分の開発スタイルや技術的な関心をまとめるポートフォリオとしての役割も持たせています。
                            </p>
                            <p>
                                Web開発を中心としながらも、インフラ、システム設計、電子工作、その他さまざまな分野に興味があり、
                                分野を限定せず気になったことや学んだことを幅広く発信していく予定です。
                            </p>
                        </div>

                        <ul className="bg-app/40 border border-[var(--border)] rounded-xl p-6 space-y-3 text-sm sm:text-base">
                            <li><strong>Stack:</strong> Next.js 15 / TypeScript / TailwindCSS</li>
                            <li><strong>Edge:</strong> Cloudflare Workers / D1 / R2 / KV</li>
                            <li><strong>Data:</strong> Drizzle ORM / SQL / Markdown (GFM)</li>
                            <li><strong>CI/CD:</strong> GitHub Actions / Wrangler</li>
                        </ul>
                    </div>
                </article>
            </section>

            <Footer />
        </main>
    );
}
