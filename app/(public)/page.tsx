// app/page.tsx
import HomePagePosts from "@/components/HomePagePosts"
import ComingSoon from "@/components/layouts/ComingSoon"
import Footer from "@/components/layouts/Footer"
import PublicHeader from "@/components/layouts/PublicHeader"
// import { getHomePost } from "@/lib/posts"
// import { getHomePost } from "@/lib/posts"
import Link from "next/link"
import { Suspense } from "react"

export const experimental_ppr = true;

const colorMap = {
  cyan:  { border: "border-cyan-400",  text: "text-cyan-400",  chipBg: "bg-cyan-400/20",  chipBorder: "border-cyan-400/50",  gradFrom: "from-cyan-900/20" },
  pink:  { border: "border-pink-400",  text: "text-pink-400",  chipBg: "bg-pink-400/20",  chipBorder: "border-pink-400/50",  gradFrom: "from-pink-900/20" },
  yellow:{ border: "border-yellow-400",text: "text-yellow-400",chipBg: "bg-yellow-400/20",chipBorder: "border-yellow-400/50",gradFrom: "from-yellow-900/20" }
} as const

const projects = [
  { title: 'NEO_SYSTEM',  color: 'cyan' as const,   tags: ['NEXT.JS','WEBGL'], href: '#' },
  { title: 'FLUX_ENGINE', color: 'pink' as const,   tags: ['CLOUDFLARE','D1'], href: '#' },
  { title: 'VOID_CORE',   color: 'yellow' as const, tags: ['R2','EDGE'], href: '#' },
]


export default function HomePage() {

  return (
    <main className="min-h-screen bg-app text-app font-mono">
      {/* Header */}
      <PublicHeader />

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="fixed inset-0 pointer-events-none mix-blend-overlay opacity-40 bg-gradient-to-b from-transparent via-[color:rgba(34,211,238,0.05)] to-transparent animate-pulse" />
        <div className="grid md:grid-cols-2 gap-12 items-center relative z-10 max-w-full overflow-x-hidden px-4">
          <div>
            <p className="mb-4 text-[var(--accent-cyan)]">$ whoami</p>
            <h2 className="text-6xl md:text-7xl font-black mb-6 leading-none">
              <span className="text-[var(--accent-pink)]">KMD</span><br/>
              <span className="text-[var(--accent-yellow)]">WORKS</span>
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-pink)] to-[var(--accent-yellow)] mb-6" />
            <p className="text-lg opacity-80 leading-relaxed">
              &gt; Building the future of web<br/>
              &gt; One line of code at a time<br/>
              &gt; Status: [ONLINE]
            </p>
            <div className="mt-8 flex gap-3 flex-wrap">
              <Link className="px-6 py-3 font-bold uppercase border-2 rounded border-[var(--accent-cyan)] text-black bg-[var(--accent-cyan)] hover:bg-[var(--accent-pink)] hover:border-[var(--accent-pink)] transition min-w-[140px] text-center" href="#contact">[INIT_CONTACT]</Link>
              <Link className="px-6 py-3 font-bold uppercase border rounded border-app text-[var(--accent-cyan)] hover:text-[var(--accent-pink)] min-w-[140px] text-center" href="#projects">[VIEW_WORK]</Link>
            </div>
          </div>
          <div className="relative">
            <div className="border-2 border-[var(--accent-cyan)] p-4 bg-card/70 rounded-xl w-full max-w-sm mx-auto">
              <div className="border border-[var(--accent-pink)] p-6 sm:p-8 bg-gradient-to-br from-[color:rgba(34,211,238,0.15)] to-[color:rgba(236,72,153,0.15)] rounded-lg">
                <div className="space-y-2 text-sm">
                  <p className="text-[var(--accent-cyan)]">&gt; npm run dev</p>
                  <p className="opacity-60">Loading modules...</p>
                  <p className="text-green-400">✓ Ready in 420ms</p>
                  <p className="text-[var(--accent-pink)]">&gt; Server: kmdworks.com</p>
                  <p className="text-[var(--accent-yellow)]">&gt; Status: READY</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <ComingSoon enabled label="Coming soon …">
        <section id="projects" className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="border-2 border-[var(--accent-cyan)] p-8 bg-card/70 rounded-2xl">
            <h3 className="text-2xl sm:text-4xl font-black mb-8 leading-tight break-words">
              <span className="text-[var(--accent-cyan)]">[</span>
              <span className="text-[var(--accent-pink)]">SELECTED</span>
              <span className="text-[var(--accent-yellow)]">_PROJECTS</span>
              <span className="text-[var(--accent-cyan)]">]</span>
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
              {projects.map((p, i) => {
                const c = colorMap[p.color]
                return (
                  <Link key={p.title} href={p.href} className={[
                      "border-2 rounded-xl p-6 transition-all group cursor-pointer",
                      "bg-gradient-to-br to-black/0 hover:scale-[1.02]",
                      c.gradFrom, c.border
                    ].join(" ")}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={["text-sm", c.text].join(" ")}>[{i.toString().padStart(2,'0')}]</span>
                      <div className={["w-3 h-3 animate-pulse", c.text].join(" ")} />
                    </div>
                    <div className={["h-48 mb-4 border rounded bg-gradient-to-br to-black/0 group-hover:brightness-110", c.chipBorder, c.gradFrom].join(" ")} />
                    <h4 className={["text-xl font-black mb-2", c.text].join(" ")}>{p.title}</h4>
                    <p className="opacity-70 text-sm mb-4">$ Advanced digital system with cutting-edge architecture</p>
                    <div className="flex gap-2">
                      {p.tags.map(t => (
                        <span key={t} className={["text-xs px-2 py-1 border rounded", c.chipBg, c.text, c.chipBorder].join(" ")}>{t}</span>
                      ))}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </ComingSoon>

      {/* Posts */}
      {/* 動的島：ここだけリクエスト時にSSRされる */}
      <Suspense fallback={<HomePagePosts />}>
        <HomePagePosts />
      </Suspense>

      {/* About */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-20">
        <h3 className="text-3xl font-black mb-6">ABOUT <span className="text-[var(--accent-pink)]">ME</span></h3>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <p className="opacity-80 leading-relaxed">
            エッジで動くWebが好きなフルスタック寄りの開発者。Next.js × Cloudflare（Workers / D1 / R2）で、
            軽量かつ運用しやすいモダン構成を設計・実装します。学習ブログとしての透明性と、ポートフォリオとしての表現を両立させるのがテーマ。
          </p>
          <ul className="bg-card border border-[var(--border)] rounded-xl p-6 space-y-3">
            <li><strong>Stack:</strong> Next.js 15 / TypeScript / TailwindCSS</li>
            <li><strong>Edge:</strong> Cloudflare Workers / D1 / R2 / KV</li>
            <li><strong>Data:</strong> Drizzle ORM / SQL / Markdown (GFM)</li>
            <li><strong>CI/CD:</strong> GitHub Actions / Wrangler</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-card border border-[var(--border)] rounded-2xl p-10 text-center">
          <h3 className="text-3xl font-black mb-4">
            LET&apos;S <span className="text-[var(--accent-yellow)]">BUILD</span> SOMETHING
          </h3>
          <p className="opacity-80 mb-10">
            [...現在 調整中...]
            相談、共同制作、コードレビューなど、お気軽にどうぞ。
            X / Zenn / YouTube などで、開発ログや記事、動画を発信していきます。
          </p>

          {/* メールボタン */}
          <Link
            href="mailto:you@example.com"
            className="
              inline-block px-6 py-3 mb-8 font-bold uppercase border-2 rounded
              border-[var(--accent-cyan)]
              text-black bg-[var(--accent-cyan)]
              hover:bg-[var(--accent-pink)]
              hover:border-[var(--accent-pink)]
              transition
            "
          >
            SEND EMAIL
          </Link>

          {/* SNSリンク */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* X */}
            <Link
              href="https://x.com/kmd483471399025"
              className="
                group block
                bg-card border border-[var(--border)] rounded-2xl
                p-6 h-full
                hover:border-[var(--accent-cyan)]
                hover:-translate-y-1 hover:shadow-xl
                transition
              "
            >
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase opacity-70">
                {/* <span className="px-2 py-0.5 rounded-full border border-[var(--border)] bg-black text-white">
                  X
                </span> */}
                <span>Micro Blog</span>
              </div>
              <h4 className="mt-4 text-xl font-bold">
                X（旧Twitter）
              </h4>
              <p className="mt-2 text-sm opacity-80">
                開発ログやちょっとした気づきをライトに投稿していきます。
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-cyan)] group-hover:text-[var(--accent-pink)]">
                Follow on X
                <span className="text-base group-hover:translate-x-0.5 transition-transform">↗</span>
              </span>
            </Link>

            {/* Zenn */}
            <Link
              href="https://zenn.dev/riku0120"
              className="
                group block
                bg-card border border-[var(--border)] rounded-2xl
                p-6 h-full
                hover:border-[var(--accent-cyan)]
                hover:-translate-y-1 hover:shadow-xl
                transition
              "
            >
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase opacity-70">
                {/* <span className="px-2 py-0.5 rounded-full border border-[var(--border)] bg-blue-500 text-white">
                  Zenn
                </span> */}
                <span>Article</span>
              </div>
              <h4 className="mt-4 text-xl font-bold">
                Zenn
              </h4>
              <p className="mt-2 text-sm opacity-80">
                設計メモや実装ノウハウを、記事としてじっくりまとめていきます。
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-cyan)] group-hover:text-[var(--accent-pink)]">
                Read on Zenn
                <span className="text-base group-hover:translate-x-0.5 transition-transform">↗</span>
              </span>
            </Link>

            {/* YouTube */}
            <Link
              href="https://www.youtube.com/@your_channel"
              className="
                group block
                bg-card border border-[var(--border)] rounded-2xl
                p-6 h-full
                hover:border-[var(--accent-cyan)]
                hover:-translate-y-1 hover:shadow-xl
                transition
              "
            >
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase opacity-70">
                {/* <span className="px-2 py-0.5 rounded-full border border-[var(--border)] bg-red-600 text-white">
                  ▶
                </span> */}
                <span>Video</span>
              </div>
              <h4 className="mt-4 text-xl font-bold">
                YouTube
              </h4>
              <p className="mt-2 text-sm opacity-80">
                コード解説や開発配信など、動画でゆるく発信していく予定です。
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-cyan)] group-hover:text-[var(--accent-pink)]">
                Watch on YouTube
                <span className="text-base group-hover:translate-x-0.5 transition-transform">↗</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  )
}
