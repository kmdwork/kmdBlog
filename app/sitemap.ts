import type { MetadataRoute } from "next";
import { and, desc, isNotNull, lte } from "drizzle-orm";
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
            url: `${origin}/posts`,
            changeFrequency: "daily",
            priority: 0.9,
        },
    ];

    const postRoutes: MetadataRoute.Sitemap = postRows.map((row) => ({
        url: `${origin}/posts/${row.slug}`,
        lastModified: row.updatedAt ?? row.publishedAt ?? undefined,
        changeFrequency: "weekly",
        priority: 0.7,
    }));

    return [...staticRoutes, ...postRoutes];
}
