"use client";

import { useEffect, useRef, useState } from "react";

type CopyCodeButtonProps = {
    text: string;
};

export function CopyCodeButton({ text }: CopyCodeButtonProps) {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);

            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = window.setTimeout(() => {
                setCopied(false);
            }, 1500);
        } catch (error) {
            console.error("copy failed", error);
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-6 min-w-16 items-center justify-center rounded border border-[var(--border)] px-2 text-[10px] font-semibold tracking-[0.12em] text-app/80 transition hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
            aria-label="コードをコピー"
        >
            {copied ? "copied" : "copy"}
        </button>
    );
}
