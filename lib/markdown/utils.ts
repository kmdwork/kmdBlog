import React from "react";
import type { ReactNode } from "react";

export function resolveOrigin(origin?: string, fallbackOrigin = "https://kmdworks.com") {
    if (origin) return origin;
    if (process.env.APP_ORIGIN) return process.env.APP_ORIGIN;
    if (typeof window !== "undefined" && window.location.origin) {
        return window.location.origin;
    }
    return fallbackOrigin;
}

function isBareUrl(value: string) {
    return /^(https?:\/\/|\/\/)\S+$/i.test(value.trim());
}

function toText(node: unknown): string | null {
    if (typeof node === "string") return node;
    if (Array.isArray(node) && node.every((item) => typeof item === "string")) {
        return node.join("");
    }
    return null;
}

export function extractSingleBareUrl(children: ReactNode): string | null {
    const list = Array.isArray(children) ? children : [children];
    const filtered = list.filter((child) => child !== "\n" && child !== null && child !== undefined);

    if (filtered.length !== 1) return null;

    const only = filtered[0];
    if (typeof only === "string" && isBareUrl(only)) return only.trim();

    if (React.isValidElement(only)) {
        const props = only.props as { href?: unknown; children?: unknown };
        const href = typeof props.href === "string" ? props.href.trim() : null;
        const text = toText(props.children)?.trim() ?? null;
        if (!href || !text) return null;
        if (href === text && isBareUrl(href)) return href;
    }

    return null;
}

export function extractMarkdownDescription(markdown: string, fallback: string) {
    const plain = markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`[^`]*`/g, " ")
        .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/[*_>~-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!plain) return fallback;
    return plain.slice(0, 140);
}

export function extractTextContent(node: ReactNode): string {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (node === null || node === undefined || typeof node === "boolean") return "";

    if (Array.isArray(node)) {
        return node.map((item) => extractTextContent(item)).join("");
    }

    if (React.isValidElement(node)) {
        const props = node.props as { children?: ReactNode };
        return extractTextContent(props.children);
    }

    return "";
}

export function slugifyHeadingText(text: string) {
    return text.trim().replace(/\s+/g, "-");
}

export function createHeadingId(text: string, index: number) {
    return `${slugifyHeadingText(text)}-${index}`;
}
