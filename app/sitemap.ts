import type { MetadataRoute } from "next";
import { and, desc, isNotNull, lte, notLike, like } from "drizzle-orm";
import { posts } from "@/db/schema";
import { getDbAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

function normalizeOrigin(raw: string): string {
    return raw.replace(/\/+$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const origin = normalizeOrigin(process.env.APP_ORIGIN ?? "https://kmdworks.com");
    const db = await getDbAsync();
    const now = new Date();

    const postRows = await db
        .select({
            slug: posts.slug,
            publishedAt: posts.publishedAt,
            updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(
            and(
                lte(posts.publishedAt, now),
                isNotNull(posts.publishedAt),
                notLike(posts.slug, "works-case-%")
            )
        )
        .orderBy(desc(posts.publishedAt));

    const workRows = await db
        .select({
            slug: posts.slug,
            publishedAt: posts.publishedAt,
            updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(
            and(
                like(posts.slug, "works-case-%"),
                lte(posts.publishedAt, now),
                isNotNull(posts.publishedAt)
            )
        )
        .orderBy(desc(posts.publishedAt));

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: `${origin}/`,
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: `${origin}/about`,
            changeFrequency: "monthly",
            priority: 0.7,
        },
        {
            url: `${origin}/posts`,
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${origin}/works`,
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${origin}/terms`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${origin}/privacy-policy`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ];

    const postRoutes: MetadataRoute.Sitemap = postRows.map((row) => ({
        url: `${origin}/posts/${row.slug}`,
        lastModified: row.updatedAt ?? row.publishedAt ?? undefined,
        changeFrequency: "weekly",
        priority: 0.7,
    }));

    const workRoutes: MetadataRoute.Sitemap = workRows.map((row) => ({
        url: `${origin}/works/${row.slug}`,
        lastModified: row.updatedAt ?? row.publishedAt ?? undefined,
        changeFrequency: "monthly",
        priority: 0.8,
    }));

    return [...staticRoutes, ...postRoutes, ...workRoutes];
}
