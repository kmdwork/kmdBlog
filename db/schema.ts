import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";


/* =========================
 * users
 * ========================= */
export const users = sqliteTable(
    "users",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        email: text("email").notNull().unique(),
        emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
        displayName: text("display_name").notNull(),
        pictureUrl: text("picture_url"),
        bio: text("bio"),
        googleSub: text("google_sub").unique(),

        // 列挙制約で型安全に
        role: text("role", {
        enum: ["admin", "editor", "author", "reader"],
        })
            .notNull()
            .default("reader"),
        isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(unixepoch() * 1000)`)
            // アプリ側での更新に加え保険
            .$onUpdate(() => sql`(unixepoch() * 1000)`),
    },
    (t) => [
        index("idx_users_active").on(t.isActive),
    ]
);


/* =========================
 * invites（招待トークン）
 * ========================= */
export const invites = sqliteTable(
    "invites",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        token: text("token").notNull().unique(),
        email: text("email").notNull(),
        role: text("role", {
            enum: ["admin", "editor", "author", "reader"],
        }).notNull(),
        expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
        usedAt: integer("used_at", { mode: "timestamp_ms" }),
        createdByUserId: integer("created_by_user_id").references(() => users.id, {
            onDelete: "set null",
            onUpdate: "cascade",
        }),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
    },
    (t) => [
        index("idx_invites_email").on(t.email),
        index("idx_invites_expires").on(t.expiresAt),
    ]
);


/* =========================
 * posts（本文はR2）
 * ========================= */
export const posts = sqliteTable(
    "posts",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        title: text("title").notNull(),
        slug: text("slug").notNull().unique(),
        authorId: integer("author_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        publishedAt: integer("published_at", { mode: "timestamp_ms" }),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(unixepoch() * 1000)`)
            .$onUpdate(() => sql`(unixepoch() * 1000)`),
        // R2メタ
        r2Key: text("r2_key").notNull(),
        checksum: text("checksum"),
        sizeBytes: integer("size_bytes"),
        contentType: text("content_type"),
    },
    (t) => [
        index("idx_posts_published_at").on(t.publishedAt),
        // もし“1記事=1キーを厳守”したいなら有効化（検索高速化ではなく制約目的）
        // index("idx_posts_r2_key").on(t.r2Key),
        index("idx_posts_author").on(t.authorId),
    ]
);


/* =========================
 * tags
 * ========================= */
export const tags = sqliteTable(
    "tags",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        name: text("name").notNull()
    },
    (t) => [
        uniqueIndex("u_tags_name").on(t.name),
    ]
);


/* =========================
 * posts_tags（N:N）
 * ========================= */
export const postsTags = sqliteTable(
    "posts_tags",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        postId: integer("post_id")
        .notNull()
        .references(() => posts.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
        tagId: integer("tag_id")
        .notNull()
        .references(() => tags.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
    },
    (t) => [
        // 重複ペア禁止 & 左端一致で postId 検索にも効く
        uniqueIndex("u_posts_tags_postid_tagid").on(t.postId, t.tagId),
        // 逆引きのために tagId 単体インデックスは残す
        index("idx_posts_tags_tag_id").on(t.tagId),
    ]
);