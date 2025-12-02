// app/components/layouts/PublicHeader.tsx

import ThemeToggle from "@/components/ThemeToggle";

export default function PublicHeader() {
    return (
        <header className="border-b border-app bg-card/80 backdrop-blur-sm sticky top-0 z-[100]">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                {/* タイトル：スマホは一段小さく */}
                <h1 className="text-2xl sm:text-3xl font-black whitespace-nowrap">
                <span className="text-[var(--accent-cyan)]">&gt;_</span>
                <span className="text-[var(--accent-pink)]">KMD</span>
                <span className="text-[var(--accent-yellow)]">Works</span>
                </h1>

                <div className="flex items-center gap-3 sm:gap-6 text-sm">
                {/* PC: 横並び / SP: 非表示 */}
                <div className="hidden sm:flex items-center gap-6">
                    {['INIT','WORK','BLOG','LINK'].map((item,i)=>(
                    <a
                        key={item}
                        href={item==='BLOG'?'/blog':'#'}
                        className="text-[var(--accent-cyan)] hover:text-[var(--accent-pink)] transition whitespace-nowrap"
                    >
                        [{i.toString().padStart(2,'0')}] {item}
                    </a>
                    ))}
                </div>

                {/* SP: CSSだけのドロップダウン（<details>） / PC: 非表示 */}
                <details className="relative sm:hidden">
                    <summary className="list-none cursor-pointer text-[var(--accent-cyan)] hover:text-[var(--accent-pink)]">
                    [MENU]
                    </summary>
                    <div className="absolute right-0 mt-2 w-44 bg-card border border-[var(--border)] rounded-lg shadow-lg p-2">
                    <ul className="flex flex-col">
                        {['INIT','WORK','BLOG','LINK'].map((item,i)=>(
                        <li key={item}>
                            <a
                            href={item==='BLOG'?'/blog':'#'}
                            className="block px-2 py-2 rounded hover:bg-[var(--bg)]"
                            >
                            [{i.toString().padStart(2,'0')}] {item}
                            </a>
                        </li>
                        ))}
                    </ul>
                    </div>
                </details>

                {/* テーマトグルは常に表示 */}
                <ThemeToggle />
                </div>
            </nav>
        </header>

    )
}

