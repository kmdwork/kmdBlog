import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { cache } from "react";


// SSR / Route Handlers など通常のリクエスト
export const getDb = cache(() => {
    const { env } = getCloudflareContext();
    // @ts-expect-error: D1 binding is injected by Wrangler at runtime
    return drizzle(env.DB, { schema }); // ← wrangler の D1 バインディング名 "DB"
});

// ISR / SSG（静的ルート）で必要な場合
export const getDbAsync = cache(async () => {
    const { env } = await getCloudflareContext({ async: true });
    // @ts-expect-error: D1 binding is injected by Wrangler at runtime
    return drizzle(env.DB, { schema });
});
