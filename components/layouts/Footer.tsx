
import Link from "next/link";

export default function Footer() {
    return (
      <footer className="border-t border-[var(--border)] bg-card/70 py-8 mt-10">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <p className="text-[var(--accent-cyan)]">&gt; SYSTEM.STATUS: <span className="text-green-400 animate-pulse">[ONLINE]</span></p>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs sm:text-sm">
                    <Link href="/terms" className="opacity-70 hover:opacity-100 hover:text-[var(--accent-cyan)] transition">
                        利用規約
                    </Link>
                    <span className="opacity-40">|</span>
                    <Link href="/privacy-policy" className="opacity-70 hover:opacity-100 hover:text-[var(--accent-cyan)] transition">
                        プライバシーポリシー
                    </Link>
                </div>
                <p className="opacity-60 text-sm mt-2">© 2025 - ALL RIGHTS RESERVED</p>
            </div>
      </footer>
    )
}
