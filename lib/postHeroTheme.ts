type PostHeroThemeInput = {
    slug: string;
    tags?: string[] | string;
};

type PostHeroTheme = {
    bgClass: string;
    textClass: string;
};

const TAG_BG_CLASS_MAP: Record<string, string> = {
    nextjs: "bg-sky-400",
    react: "bg-cyan-400",
    typescript: "bg-indigo-400",
    javascript: "bg-yellow-400",
    cloudflare: "bg-orange-400",
    drizzle: "bg-blue-400",
    d1: "bg-emerald-400",
    r2: "bg-amber-400",
    sql: "bg-lime-400",
    markdown: "bg-stone-400",
    zod: "bg-fuchsia-400",
    パッチ: "bg-red-400",    
};

const FALLBACK_BG_CLASSES = [
    "bg-white",
    "bg-zinc-400",
    "bg-neutral-400",
    "bg-slate-400",
    "bg-stone-400",
    "bg-gray-400",
];

function normalizeTags(tags?: string[] | string): string[] {
    const rawList = Array.isArray(tags)
        ? tags
        : typeof tags === "string"
            ? tags.split(",")
            : [];

    return rawList
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
}

function hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function getPostHeroTheme(input: PostHeroThemeInput): PostHeroTheme {
    const normalizedTags = normalizeTags(input.tags);

    if(normalizedTags.length > 0) {
        for (const tag of normalizedTags) {
            const mapped = TAG_BG_CLASS_MAP[tag];
            if (mapped) {
                return {
                    bgClass: mapped,
                    textClass: "text-black",
                };
            }
        }
    
        const fallbackIndex = hashString(input.slug) % FALLBACK_BG_CLASSES.length;
        return {
            bgClass: FALLBACK_BG_CLASSES[fallbackIndex],
            textClass: "text-black",
        };
    } else {
        return {
            bgClass: "bg-white",
            textClass: "text-black",
        };
    }
}
