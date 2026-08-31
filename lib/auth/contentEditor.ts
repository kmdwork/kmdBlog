import { auth } from "@/auth";
import { users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";

export type ActiveContentEditor = {
  id: number;
  role: "admin" | "editor";
};

export async function getActiveContentEditor(): Promise<ActiveContentEditor | null> {
  try {
    const session = await auth();
    const sessionUser = session?.user;
    const userId = Number(sessionUser?.id);
    const sessionRole = sessionUser?.role;

    if (
      !sessionUser ||
      sessionUser.isActive !== true ||
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      (sessionRole !== "admin" && sessionRole !== "editor")
    ) {
      return null;
    }

    const db = getDb();
    const user = await db.query.users.findFirst({
      columns: { id: true, role: true, isActive: true },
      where: eq(users.id, userId),
    });

    if (
      !user ||
      user.isActive !== true ||
      (user.role !== "admin" && user.role !== "editor")
    ) {
      return null;
    }

    return { id: user.id, role: user.role };
  } catch {
    console.error("[upload-image] authorization check failed");
    return null;
  }
}
