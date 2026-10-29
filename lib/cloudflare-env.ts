import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AppCloudflareEnv } from "@/lib/cloudflare-env.types";

export function getCloudflareEnv(): AppCloudflareEnv {
  return getCloudflareContext().env as unknown as AppCloudflareEnv;
}

export async function getCloudflareEnvAsync(): Promise<AppCloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env as unknown as AppCloudflareEnv;
}
