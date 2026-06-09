import Link from "next/link";
import type { TocItem } from "@/lib/markdown/toc";

type TableOfContentsProps = {
    items: TocItem[];
};

export default function TableOfContents({ items }: TableOfContentsProps) {
    if (items.length === 0) return null;

    return (
        <nav
            aria-label="目次"
            className="mb-8 rounded-xl border border-[var(--border)] bg-card/50 p-4 sm:p-5"
        >
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[var(--accent-cyan)]">
                TOC
            </p>
            <ul className="space-y-2 text-sm">
                {items.map((item) => (
                    <li
                        key={item.id}
                        className={item.level === 3 ? "pl-4 opacity-85" : ""}
                    >
                        <Link
                            href={`#${item.id}`}
                            className="inline-flex items-start gap-2 hover:text-[var(--accent-pink)]"
                        >
                            <span aria-hidden="true">・</span>
                            {item.text}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
