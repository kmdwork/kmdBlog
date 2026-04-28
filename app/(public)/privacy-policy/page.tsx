import Footer from "@/components/layouts/Footer";
import PublicHeader from "@/components/layouts/PublicHeader";

export const metadata = {
    title: "プライバシーポリシー",
};

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-app text-app font-mono">
            <PublicHeader />

            <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                <h1 className="text-3xl sm:text-4xl font-black leading-tight">
                    プライバシーポリシー
                </h1>
                <div className="h-0.5 w-28 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-pink)] to-[var(--accent-yellow)] mt-4 mb-8" />

                <article className="rounded-xl border border-[var(--border)] bg-card p-6 sm:p-8 leading-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                    <div className="space-y-8 text-sm sm:text-base opacity-90">
                        <section className="space-y-4 rounded-lg border border-[var(--border)]/70 bg-app/40 p-4 sm:p-5">
                            <p>
                                本サイトでは、ユーザーの個人情報の保護を重要なものと認識し、以下の方針に基づき適切な取り扱いを行います。
                            </p>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">1. 取得する情報</h2>
                            <p>本サイトでは、以下の情報を取得する場合があります。</p>
                            <ul className="list-disc pl-6 space-y-2 marker:text-[var(--accent-pink)]">
                                <li>IPアドレス</li>
                                <li>Cookie</li>
                                <li>アクセスログ</li>
                                <li>ログイン機能を利用する場合の認証情報（Googleアカウント情報など）</li>
                            </ul>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">2. 情報の利用目的</h2>
                            <p>取得した情報は、以下の目的で利用します。</p>
                            <ul className="list-disc pl-6 space-y-2 marker:text-[var(--accent-pink)]">
                                <li>本サイトのサービス提供および改善</li>
                                <li>不正利用の防止</li>
                                <li>アクセス状況の分析</li>
                                <li>セキュリティの維持</li>
                            </ul>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">3. アクセス解析ツールについて</h2>
                            <p>
                                本サイトでは、アクセス解析のために外部サービスを利用する場合があります。
                                <br />
                                これらのサービスは、トラフィックデータ収集のためにCookieを使用する場合があります。
                            </p>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">4. Cookieについて</h2>
                            <p>
                                Cookieとは、ユーザーのブラウザに保存される小さなデータファイルです。
                                <br />
                                本サイトでは、利便性向上およびアクセス解析のためにCookieを使用することがあります。
                            </p>
                            <p>ユーザーはブラウザの設定によりCookieの受け取りを拒否することが可能です。</p>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">5. 第三者サービス</h2>
                            <p>本サイトでは、以下の外部サービスを利用する場合があります。</p>
                            <ul className="list-disc pl-6 space-y-2 marker:text-[var(--accent-pink)]">
                                <li>Cloudflare（サイトの配信およびセキュリティ）</li>
                                <li>Google（認証機能など）</li>
                            </ul>
                            <p>
                                これらのサービスにおける情報の取り扱いについては、それぞれのプライバシーポリシーをご確認ください。
                            </p>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">6. 個人情報の第三者提供</h2>
                            <p>
                                運営者は、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
                            </p>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">7. セキュリティ</h2>
                            <p>
                                本サイトでは、個人情報の漏えい、改ざん、紛失を防止するため、合理的な安全対策を講じます。
                            </p>
                        </section>


                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">8. プライバシーポリシーの変更</h2>
                            <p>
                                本ポリシーは、必要に応じて変更されることがあります。
                                <br />
                                変更後の内容は、本サイトに掲載した時点で効力を生じるものとします。
                            </p>
                        </section>

                        <hr className="border-[var(--border)]/80" />

                        <section className="space-y-4">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--accent-cyan)]">9. お問い合わせ</h2>
                            <p>
                                本ポリシーに関するお問い合わせは、本サイトの管理者までご連絡ください。
                                <br />
                                E-mail：kmdwork10989296@gmail.com
                            </p>
                        </section>
                    </div>
                </article>
            </section>

            <Footer />
        </main>
    );
}
