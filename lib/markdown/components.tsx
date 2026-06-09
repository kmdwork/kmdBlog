import React from "react";
import Image from "next/image";
import Link from "next/link";
import { isValidElement } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { CopyCodeButton } from "./CopyCodeButton";
import {
    createHeadingId,
    extractSingleBareUrl,
    extractTextContent,
    resolveOrigin,
} from "./utils";
import type { MarkdownComponentOptions } from "./types";

function LinkCard({ url }: { url: string }) {
    let host = "";
    try {
        host = new URL(url).host;
    } catch {}

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="my-4 block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] hover:opacity-95 transition"
        >
            <div className="p-4">
                <div className="text-xs opacity-70">{host}</div>
                <div className="mt-1 break-all font-semibold">{url}</div>
            </div>
        </a>
    );
}

function extractLanguage(className?: string) {
    if (!className) return null;
    const match = className.match(/language-([\w-]+)/);
    return match?.[1] ?? null;
}

function getCodeLanguageFromPreChildren(children: ReactNode) {
    if (!isValidElement(children)) return null;
    const props = children.props as { className?: string };
    return extractLanguage(props.className);
}

export function createMarkdownComponents(options: MarkdownComponentOptions) {
    const baseOrigin = resolveOrigin(options.origin, options.fallbackOrigin);
    let headingIndex = 0;

    function renderHeading(
        tag: "h1" | "h2" | "h3",
        props: ComponentPropsWithoutRef<"h1"> | ComponentPropsWithoutRef<"h2"> | ComponentPropsWithoutRef<"h3">
    ) {
        const { children, ...rest } = props;
        if (tag === "h2" || tag === "h3") {
            const text = extractTextContent(children).trim();
            const id = createHeadingId(text, headingIndex);
            headingIndex += 1;
            const className = [rest.className, "scroll-mt-[60px]"].filter(Boolean).join(" ");
            return React.createElement(tag, { ...rest, id, className }, children);
        }

        return React.createElement(tag, rest, children);
    }

    return {
        img: (props: ComponentPropsWithoutRef<"img">) => {
            const { src, alt } = props;
            if (typeof src !== "string" || src.length === 0) return null;

            const [altText, sizeSpec] = (alt ?? "").split("|", 2);
            const widthMatch = sizeSpec?.match(/w=(\d{2,4})/);
            const width = widthMatch ? parseInt(widthMatch[1], 10) : undefined;
            const resolvedSrc = src.startsWith("/") ? `${baseOrigin}${src}` : src;

            return (
                <div className="flex justify-center my-4">
                    <Image
                        src={resolvedSrc}
                        alt={altText?.trim() ?? ""}
                        width={width ? width : undefined}
                        className="rounded-lg border border-[var(--border)] h-auto"
                    />
                </div>
            );
        },
        a: (props: ComponentPropsWithoutRef<"a">) => {
            const { href, children, ...rest } = props;
            const value = typeof href === "string" ? href : "";
            const isExternal = /^https?:\/\//i.test(value) || value.startsWith("//");

            if (isExternal) {
                return (
                    <a href={value} target="_blank" rel="noopener noreferrer" {...rest}>
                        {children}
                    </a>
                );
            }

            return (
                <Link href={value || "#"} {...rest}>
                    {children}
                </Link>
            );
        },
        p: ({ children, ...rest }: ComponentPropsWithoutRef<"p">) => {
            if (options.enableLinkCard) {
                const url = extractSingleBareUrl(children);
                if (url) return <LinkCard url={url} />;
            }

            return <p {...rest}>{children}</p>;
        },
        h1: (props: ComponentPropsWithoutRef<"h1">) => renderHeading("h1", props),
        h2: (props: ComponentPropsWithoutRef<"h2">) => renderHeading("h2", props),
        h3: (props: ComponentPropsWithoutRef<"h3">) => renderHeading("h3", props),
        code: ({ className, children, ...rest }: ComponentPropsWithoutRef<"code">) => {
            const language = extractLanguage(className);

            if (!language) {
                return (
                    <code className={className} {...rest}>
                        {children}
                    </code>
                );
            }

            return (
                <code className={className} {...rest}>
                    {children}
                </code>
            );
        },
        pre: ({ children, ...rest }: ComponentPropsWithoutRef<"pre">) => {
            const language = getCodeLanguageFromPreChildren(children);
            const codeText = extractTextContent(children).replace(/\n$/, "");

            return (
                <div className="my-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[#0b0f14]">
                    {language ? (
                        <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
                            <div className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-cyan)]">
                                {language}
                            </div>
                            <CopyCodeButton text={codeText} />
                        </div>
                    ) : codeText ? (
                        <div className="flex items-center justify-end border-b border-[var(--border)] px-3 py-2">
                            <CopyCodeButton text={codeText} />
                        </div>
                    ) : null}
                    <pre {...rest} className="m-0 overflow-x-auto p-4">
                        {children}
                    </pre>
                </div>
            );
        },
    };
}
