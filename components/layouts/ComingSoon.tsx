type Props = {
  enabled?: boolean;
  label?: string;
  children: React.ReactNode;
};

export default function ComingSoon({
        enabled = true,
        label = "Coming soon …",
        children,
    }: Props) {
    if (!enabled) return <>{children}</>;
    return (
        <div className="relative inline-block w-full">
            {/* 下の実コンテンツ */}
            <div aria-hidden className="pointer-events-none select-none">
                {children}
            </div>

            {/* オーバーレイ */}
            <div
                className="
                absolute inset-0 z-10
                flex items-center justify-center
                bg-black/40
                backdrop-blur-[2px]
                rounded-2xl
                "
            >
                {/* グラデ＋縁取り */}
                <div
                className="
                    px-10 py-5
                    rounded-full
                    border border-white/30
                    bg-gradient-to-r
                    from-[var(--accent-cyan)]/25
                    via-[var(--accent-pink)]/15
                    to-[var(--accent-yellow)]/25
                    shadow-[0_0_40px_-8px_rgba(255,255,255,0.4)]
                "
                >
                <span
                    className="
                    text-2xl sm:text-3xl font-extrabold tracking-[0.08em]
                    bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-pink)] to-[var(--accent-yellow)]
                    bg-clip-text text-transparent
                    drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]
                    "
                >
                    {label}
                </span>
                </div>
            </div>
        </div>
    )
}
