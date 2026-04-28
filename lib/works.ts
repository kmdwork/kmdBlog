import { posts, postsTags, tags } from "@/db/schema";
import { getDb } from "./db";
import { and, desc, eq, inArray, like } from "drizzle-orm";
import { getR2Text } from "./r2";

export type WorkListItem = {
    title: string;
    slug: string;
    publishedAt: string;
    tags: string[];
};

export type UiWork = {
    title: string;
    slug: string;
    authorId: number;
    publishedAt: string | null;
    markdown: string;
};

export async function getAllWorks(): Promise<WorkListItem[]> {
    const db = getDb();

    const rows = await db
        .select({
            id: posts.id,
            title: posts.title,
            slug: posts.slug,
            publishedAt: posts.publishedAt,
        })
        .from(posts)
        .where(like(posts.slug, "works-case-%"))
        .orderBy(desc(posts.publishedAt), desc(posts.id));

    if (!rows.length) return [];

    const postIds = rows.map((row) => row.id);
    let tagMap = new Map<number, string[]>();

    if (postIds.length > 0) {
        const tagRows = await db
            .select({
                postId: postsTags.postId,
                tagName: tags.name,
            })
            .from(postsTags)
            .innerJoin(tags, eq(postsTags.tagId, tags.id))
            .where(inArray(postsTags.postId, postIds));

        tagMap = tagRows.reduce((m, row) => {
            const arr = m.get(row.postId) ?? [];
            arr.push(row.tagName);
            m.set(row.postId, arr);
            return m;
        }, new Map<number, string[]>());
    }

    return rows.map((row) => ({
        title: row.title,
        slug: row.slug,
        publishedAt: row.publishedAt
            ? row.publishedAt.toISOString().slice(0, 10)
            : "未定",
        tags: tagMap.get(row.id) ?? [],
    }));
}

export async function getWork(slug: string): Promise<UiWork | null> {
    const db = getDb();

    const [row] = await db
        .select({
            title: posts.title,
            slug: posts.slug,
            authorId: posts.authorId,
            publishedAt: posts.publishedAt,
            r2Key: posts.r2Key,
        })
        .from(posts)
        .where(
            and(
                eq(posts.slug, slug),
                like(posts.slug, "works-case-%")
            )
        )
        .limit(1);

    if (!row) return null;

    const markdown = await getR2Text(row.r2Key);
    if (!markdown) return null;

    return {
        title: row.title,
        slug: row.slug,
        authorId: row.authorId,
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
        markdown,
    };
}
