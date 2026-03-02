import { posts, postsTags, tags } from "@/db/schema";
import { getDb } from "./db";
import { and, desc, eq, inArray, isNotNull, like, lte, or, sql } from "drizzle-orm";
import { getR2Text } from "./r2";
import { error } from "console";
import { getUsersByIds } from "./users";
// import { logError } from "./logger";

// フロントで扱いやすい形（レンダリング用）
export type UiPost = {
    title: string
    slug: string
    authorId: number
    publishedAt: string
    markdown: string
    tags: string
}
export type HomePost = {
    title: string
    slug: string
    publishedAt: string
}

// https://qiita.com/hikagami/items/254e021ad07d89fa6ae0　参考

// 閲覧者用 投稿取得
export async function getPost(slug: string): Promise<UiPost | null>  {
    const now = new Date();
    try {
        const db = getDb();
        const [row] = await db
            .select({
                id: posts.id,
                title: posts.title,
                slug: posts.slug,
                r2Key: posts.r2Key,
                authorId: posts.authorId,
                publishedAt: posts.publishedAt,
            })
            .from(posts)
            .where(
                and(
                    eq(posts.slug, slug),
                    lte(posts.publishedAt, now),
                    isNotNull(posts.publishedAt)
                )
            )
            .limit(1);
            if (!row) return null;
            let date: string | null = null;
            if (!row.publishedAt) {
                return null;
            } 
            date = row.publishedAt.toString()
    
            // R2
            // let md: string | null = null;
            const md: string | null = await getR2Text(row.r2Key);
            if(!md) {
                throw error;
            }

            // タグ一覧を取得
            const tagRows = await db
                .select({
                    tagName: tags.name,
                })
                .from(postsTags)
                .innerJoin(tags, eq(postsTags.tagId, tags.id))
                .where(eq(postsTags.postId, row.id));
            // 配列として扱いたい場合    
            const tagList = (tagRows ?? [])
                .map(r => r.tagName.trim())
                .filter(Boolean);
            const tagString = tagList.length > 0
                ? Array.from(new Set(tagList)).join(", ")
                : "";
        
            return {
                title: row.title,
                slug: row.slug,
                authorId: row.authorId,
                publishedAt: date,
                markdown: md,
                tags: tagString,
            }
    } catch (err) {
        // logError(err, { slug });
        throw err;
    }
}

// マネジメント 投稿取得
export async function getManagementPost(slug: string)  {
    try {
        const db = getDb();
        const [row] = await db
            .select({
                id: posts.id,
                title: posts.title,
                slug: posts.slug,
                r2Key: posts.r2Key,
                authorId: posts.authorId,
                publishedAt: posts.publishedAt,
            })
            .from(posts)
            .where(
                eq(posts.slug, slug),
            )
            .limit(1);

        if (!row) return null;
        let date: string | null = null;

        date = row.publishedAt ? row.publishedAt.toString() : null;
    
        // R2
        // let md: string | null = null;
        const md: string | null = await getR2Text(row.r2Key);
        if(!md) {
            throw error;
        }


        // タグ一覧を取得
        const tagRows = await db
            .select({
                tagName: tags.name,
            })
            .from(postsTags)
            .innerJoin(tags, eq(postsTags.tagId, tags.id))
            .where(eq(postsTags.postId, row.id));
        // 配列として扱いたい場合    
        const tagList = (tagRows ?? [])
            .map(r => r.tagName.trim())
            .filter(Boolean);
        const tagString = tagList.length > 0
            ? Array.from(new Set(tagList)).join(", ")
            : "";
        
        return {
            id: row.id,
            title: row.title,
            slug: row.slug,
            authorId: row.authorId,
            publishedAt: date,
            markdown: md,
            tags: tagString,
        }
    } catch (err) {
        // logError(err, { slug });
        throw err;
    }
}

// ホーム画面posts取得 3件
export async function getHomePost():Promise<HomePost[] | null> {
    try {
        const db = getDb();
        const now = new Date();
        const rows = await db
            .select({
                title: posts.title,
                slug: posts.slug,
                publishedAt: posts.publishedAt,
            })
            .from(posts)
            .where(lte(posts.publishedAt, now))
            .orderBy(desc(posts.publishedAt))
            .limit(3)
            
        if (!rows.length) return null;
        const uiPosts = rows.map((row) => ({
            title: row.title,
            slug: row.slug,
            publishedAt: row.publishedAt
                ? row.publishedAt.toISOString().split('T')[0]
                : '未定',
        }))

        return uiPosts;

    } catch (err) {
        console.error('getHomePost error:', err);
        throw err;
    }

}

// 閲覧者用一覧投稿取得
export async function getAllPosts(page: number, pageSize = 9, search: string, author: string) {
    try {
        const db = getDb();
        const now = new Date();
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const offset = (safePage - 1) * pageSize;
        const q = (search ?? "").trim();
        // authorパラメータを number|null に正規化
        const authorId =
            author && author !== "all" && author.trim() !== ""
                ? Number(author)
                : null;
        const authorFilter =
            authorId != null && Number.isFinite(authorId)
                ? eq(posts.authorId, authorId)
                : null;

        const rows = (!q) ? 
        await db 
            .select({
                id: posts.id,
                title: posts.title,
                slug: posts.slug,
                publishedAt: posts.publishedAt,
                updatedAt: posts.updatedAt,
                authorId: posts.authorId,
            })
            .from(posts)
            .where(
                and(
                    lte(posts.publishedAt, now),
                    isNotNull(posts.publishedAt),
                    authorFilter ?? undefined
                )
            )
            .orderBy(desc(posts.publishedAt))
            .limit(pageSize)
            .offset(offset)

        :
        await db 
            .select({
                id: posts.id,
                title: posts.title,
                slug: posts.slug,
                publishedAt: posts.publishedAt,
                updatedAt: posts.updatedAt,
                authorId: posts.authorId,
            })
            .from(posts)
            .leftJoin(postsTags, eq(posts.id, postsTags.postId))
            .leftJoin(tags, eq(postsTags.tagId, tags.id))
            .where(
                and(
                    lte(posts.publishedAt, now),
                    isNotNull(posts.publishedAt),
                    authorFilter ?? undefined,
                    or(
                        like(posts.title, `%${q}%`),
                        like(posts.slug, `%${q}%`),
                        like(tags.name, `%${q}%`)
                    )
                )
            )
            .orderBy(desc(posts.publishedAt))
            .limit(pageSize)
            .offset(offset)
        ;

        // タグの取得
        const postIds = rows.map(r => r.id);
        let tagMap = new Map<number, string[]>();

        if(postIds.length > 0) {
            const tagRows = await db
                .select({
                    postId: postsTags.postId,
                    tagName: tags.name,
                })
                .from(postsTags)
                .innerJoin(tags, eq(postsTags.tagId, tags.id))
                .where(inArray(postsTags.postId, postIds))

            tagMap = tagRows.reduce((m, r) => {
                const arr = m.get(r.postId) ?? []
                arr.push(r.tagName)
                m.set(r.postId, arr)
                return m
            }, new Map<number, string[]>())
        }

        // 著者情報を一括取得
        const authorIds = [...new Set(rows.map(r => r.authorId))];
        const authorsMap = await getUsersByIds(authorIds);


        // rows整形
        const items = rows.map(r => {
            const author = authorsMap.get(r.authorId);
            return {
                title: r.title,
                slug: r.slug,
                // 画面用に日付を YYYY-MM-DD に
                publishedAt: r.publishedAt
                    ? r.publishedAt.toISOString().slice(0, 10)
                    : '未定',
                updatedAt: r.updatedAt
                    ? r.updatedAt.toISOString().slice(0, 10)
                    : '未更新',
                tags: tagMap.get(r.id) ?? [],
                author: author ? {
                        id: author.id,
                        displayName: author.displayName,
                        pictureUrl: author.pictureUrl,
                        role: author.role,
                    } : null,
            }
        })

        // 総数
        const [{ total }] = (!q) ?
        await db
            .select({ total: sql<number>`count(*)` })
            .from(posts)
            .where(
                and(
                    lte(posts.publishedAt, now),
                    isNotNull(posts.publishedAt),
                    authorFilter ?? undefined
                )
            )
        :
        await db
            .select({ 
                total: sql<number>`count(distinct ${posts.id})` 
            })
            .from(posts)
            .leftJoin(postsTags, eq(posts.id, postsTags.postId))
            .leftJoin(tags, eq(postsTags.tagId, tags.id))
            .where(
                and(
                    lte(posts.publishedAt, now),
                    isNotNull(posts.publishedAt),
                    authorFilter ?? undefined,
                    or(
                        like(posts.title, `%${q}%`),
                        like(posts.slug, `%${q}%`),
                        like(tags.name, `%${q}%`)
                    )
                )
            )
        ;

        const hasPrev = safePage > 1;
        const hasNext = offset + items.length < total;
        return { items, page: safePage, pageSize, total, hasPrev, hasNext };
        
    } catch (err) {
        console.error('getAllPosts error:', err);
        throw err;
    }
}


// マネジメント 投稿一覧取得
export async function getManagementAllPosts(page: number, pageSize = 9, search: string, author: string) {
    try {
        const db = getDb();
        // const now = new Date();
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const offset = (safePage - 1) * pageSize;
        const q = (search ?? "").trim();
        // authorパラメータを number|null に正規化
        const authorId =
            author && author !== "all" && author.trim() !== ""
                ? Number(author)
                : null;
        const authorFilter =
            authorId != null && Number.isFinite(authorId)
                ? eq(posts.authorId, authorId)
                : null;


        const rows = (!q) ? 
            await db 
                .select({
                    id: posts.id,
                    title: posts.title,
                    slug: posts.slug,
                    publishedAt: posts.publishedAt,
                    updatedAt: posts.updatedAt,
                    createdAt: posts.createdAt,
                    authorId: posts.authorId,
                })
                .from(posts)
                .orderBy(desc(posts.createdAt))
                .limit(pageSize)
                .offset(offset)
                .where(
                    authorFilter ?? undefined
                )
            
            :
            await db
                .selectDistinct({
                    id: posts.id,
                    title: posts.title,
                    slug: posts.slug,
                    publishedAt: posts.publishedAt,
                    updatedAt: posts.updatedAt,
                    createdAt: posts.createdAt,
                    authorId: posts.authorId,
                })
                .from(posts)
                .leftJoin(postsTags, eq(posts.id, postsTags.postId))
                .leftJoin(tags, eq(postsTags.tagId, tags.id))
                .where(
                    and(
                        or(
                            like(posts.title, `%${search}%`),
                            like(posts.slug, `%${search}%`),
                            like(tags.name, `%${search}%`)
                        ),
                        authorFilter ?? undefined
                    )
                )
                .orderBy(desc(posts.createdAt))
                .limit(pageSize)
                .offset(offset);
            ;

        // タグの取得
        const postIds = rows.map(r => r.id);
        let tagMap = new Map<number, string[]>();

        if(postIds.length > 0) {
            const tagRows = await db
                .select({
                    postId: postsTags.postId,
                    tagName: tags.name,
                })
                .from(postsTags)
                .innerJoin(tags, eq(postsTags.tagId, tags.id))
                .where(inArray(postsTags.postId, postIds))

            tagMap = tagRows.reduce((m, r) => {
                const arr = m.get(r.postId) ?? []
                arr.push(r.tagName)
                m.set(r.postId, arr)
                return m
            }, new Map<number, string[]>())
        }

        // 著者情報を一括取得
        const authorIds = [...new Set(rows.map(r => r.authorId))];
        const authorsMap = await getUsersByIds(authorIds);

        // rows整形
        const items = rows.map(r => {
            const author = authorsMap.get(r.authorId);
            return {
                title: r.title,
                slug: r.slug,
                // 画面用に日付を YYYY-MM-DD に
                publishedAt: r.publishedAt
                    ? r.publishedAt.toISOString().slice(0, 10)
                    : '未定',
                updatedAt: r.updatedAt
                    ? r.updatedAt.toISOString().slice(0, 10)
                    : '未更新',
                tags: tagMap.get(r.id) ?? [],
                author: author ? {
                    id: author.id,
                    displayName: author.displayName,
                    pictureUrl: author.pictureUrl,
                    role: author.role,
                } : null,
            }
        })

        // 総数
        const [{ total }] = (!q) ? 
            await db
                .select({ total: sql<number>`count(*)` })
                .from(posts)
                .where(
                    authorFilter ?? undefined
                )
            :
            await db
                .select({ 
                    total: sql<number>`count(distinct ${posts.id})` 
                })
                .from(posts)
                .leftJoin(postsTags, eq(posts.id, postsTags.postId))
                .leftJoin(tags, eq(postsTags.tagId, tags.id))
                .where(
                    and(
                        or(
                            like(posts.title, `%${search}%`),
                            like(posts.slug, `%${search}%`),
                            like(tags.name, `%${search}%`)
                        ),
                        authorFilter ?? undefined
                    )
                )
            ;

        const hasPrev = safePage > 1;
        const hasNext = offset + items.length < total;
        return { items, page: safePage, pageSize, total, hasPrev, hasNext };
        
    } catch (err) {
        console.error('getAllPosts error:', err);
        throw err;
    }
}


// 登録時のslug作成
export async function checkSlug(slug: string):Promise<boolean> {
    try {
        const db = getDb();
        const existing = await db
          .select({ id: posts.id })
          .from(posts)
          .where(eq(posts.slug, slug))
          .limit(1);
    
        if (existing.length > 0) {
            return false;
        }
        return true;        
    } catch (error) {
        console.error("checkSlug error:", error);
        return false;
    }
}
