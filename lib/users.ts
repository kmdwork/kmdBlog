import { invites, posts, users } from "@/db/schema";
import { getDb } from "./db";
import { and, desc, eq, inArray, InferSelectModel, isNotNull, lte, not, sql } from "drizzle-orm";

export type InviteRow = InferSelectModel<typeof invites>;

// export type AuthorOption = {
//   id: number;
//   displayName: string;
//   pictureUrl?: string;
// };

export async function findInviteByToken(token: string): Promise<InviteRow | null> {
  const db = getDb();
  const [row] = await db.select().from(invites).where(eq(invites.token, token));
  return row ?? null;
}


/**
 * 単一ユーザーをIDで取得
 */
export async function getUserById(userId: number) {
    try {
        const db = getDb();
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: {
                id: true,
                displayName: true,
                pictureUrl: true,
                bio: true,
                role: true,
                createdAt: true,
            }
        });
        return user ?? null;
    } catch (error) {
        console.error("getUserById error:", error);
        return null;
    }
}


/**
 * 複数ユーザーをIDの配列で一括取得
 */
export async function getUsersByIds(userIds: number[]) {
    try {
        if (userIds.length === 0) return new Map();
        
        const db = getDb();
        const userList = await db
            .select({
                id: users.id,
                displayName: users.displayName,
                pictureUrl: users.pictureUrl,
                bio: users.bio,
                role: users.role,
            })
            .from(users)
            .where(inArray(users.id, userIds));
        
        // Map形式で返す
        return new Map(userList.map(u => [u.id, u]));
    } catch (error) {
        console.error("getUsersByIds error:", error);
        return new Map();
    }
}


/**
 * 公開しているユーザーを一括取得(一般公開)
 */
export async function getManagementPostAuthors() {
    try {
        const db = getDb();
        const rows = await db
            .selectDistinct({
                id: users.id,
                displayName: users.displayName,
                pictureUrl: users.pictureUrl,
            })
            .from(posts)
            .innerJoin(users, eq(posts.authorId, users.id))
            .orderBy(sql`LOWER(${users.displayName})`);

        return rows;
    } catch (error) {
        console.error("getUserById error:", error);
        return undefined;
    }
}


/**
 * 公開・非公開関係なく投稿しているユーザーを一括取得(マネジメント)
 */
export async function getPostAuthors() {
    try {
        const db = getDb();
        const now = new Date();
      
        const rows = await db
          .selectDistinct({
            id: users.id,
            displayName: users.displayName,
            pictureUrl: users.pictureUrl,
          })
          .from(posts)
          .innerJoin(users, eq(posts.authorId, users.id))
          .where(
            and(
                isNotNull(posts.publishedAt),
                lte(posts.publishedAt, now), // 未来公開予約は除外
                // 必要なら isActive も追加可能:
                // eq(users.isActive, 1)
            )
          )
          .orderBy(sql`LOWER(${users.displayName})`);
      
        return rows;
    } catch (error) {
        console.error("getUserById error:", error);
        return undefined;
    }
}


/**
 * 全てのユーザーを一括取得
 */
export async function getAllUser() {
    try {
        const db = getDb();
        const rows = await db
            .select({
                id: users.id,
                email: users.email,
                role: users.role,
                displayName: users.displayName,
                pictureUrl: users.pictureUrl,
                bio: users.bio,
                isActive: users.isActive,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(not(eq(users.role, "admin")))   // ★ admin を除外
            .orderBy(desc(users.createdAt)); 

        return rows;
    } catch (error) {
        console.error("getUserById error:", error);
        return undefined;
    }
}
