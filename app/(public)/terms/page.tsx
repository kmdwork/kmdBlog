import Footer from "@/components/layouts/Footer";
import PublicHeader from "@/components/layouts/PublicHeader";

export const metadata = {
    title: "利用規約",
};

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-app text-app font-mono">
            <PublicHeader />

            <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                <h1 className="text-3xl sm:text-4xl font-black leading-tight">
                    利用規約
                </h1>
                <div className="h-0.5 w-28 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-pink)] to-[var(--accent-yellow)] mt-4 mb-8" />

                <article className="rounded-xl border border-[var(--border)] bg-card p-6 sm:p-8 leading-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                    <div className="space-y-8 text-sm sm:text-base opacity-90">
                        <section className="space-y-4 rounded-lg border border-[var(--border)]/70 bg-app/40 p-4 sm:p-5">
                            <p>
                                この利用規約（以下、「本規約」といいます）は、本サイトの運営者（以下、「運営者」といいます）が提供するウェブサイト（以下、「本サイト」といいます）の利用条件を定めるものです。
                            </p>
                            <p>
                                本サイトを利用するすべての利用者（以下、「ユーザー」といいます）は、本規約に同意したものとみなされます。
                            </p>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">第1条（適用）</h2>
                            <p>
                                本規約は、ユーザーと運営者との間の本サイトの利用に関する一切の関係に適用されます。
                            </p>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">第2条（禁止事項）</h2>
                            <p>ユーザーは、本サイトの利用にあたり、以下の行為をしてはなりません。</p>
                            <ul className="list-disc pl-6 space-y-2 marker:text-[var(--accent-pink)]">
                                <li>法令または公序良俗に違反する行為</li>
                                <li>本サイトの運営を妨害する行為</li>
                                <li>不正アクセスまたはこれを試みる行為</li>
                                <li>他のユーザーまたは第三者に不利益・損害を与える行為</li>
                                <li>本サイトの内容を無断で転載・複製する行為</li>
                                <li>その他、運営者が不適切と判断する行為</li>
                            </ul>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">第3条（著作権）</h2>
                            <p>
                                本サイトに掲載されている文章、コード、画像、その他コンテンツの著作権は運営者または正当な権利を有する第三者に帰属します。
                            </p>
                            <p>
                                引用を行う場合は、出典として本サイトへのリンクを明示してください。
                                <br />
                                全文転載や無断転載は禁止します。
                            </p>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">第4条（免責事項）</h2>
                            <p>
                                本サイトに掲載されている情報は、可能な限り正確な情報を提供するよう努めていますが、その正確性や安全性を保証するものではありません。
                            </p>
                            <p>
                                本サイトの情報を利用したことにより生じた損害等について、運営者は一切の責任を負いません。
                            </p>
                            <p>
                                また、本サイトからリンクやバナーなどによって移動した外部サイトで提供される情報・サービス等についても、運営者は責任を負いません。
                            </p>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">第5条（サービス内容の変更）</h2>
                            <p>
                                運営者は、ユーザーへの事前通知なく、本サイトの内容を変更または提供を中止することがあります。
                            </p>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">第6条（利用規約の変更）</h2>
                            <p>
                                運営者は、必要と判断した場合には、ユーザーへの通知なく本規約を変更することがあります。
                                <br />
                                変更後の利用規約は、本サイトに掲載した時点で効力を生じるものとします。
                            </p>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">第7条（準拠法）</h2>
                            <p>本規約の解釈にあたっては、日本法を準拠法とします。</p>
                        </section>
                    </div>
                </article>
            </section>

            <Footer />
        </main>
    );
}
