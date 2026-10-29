import { env } from "cloudflare:workers";
import type { AppCloudflareEnv } from "@/lib/cloudflare-env.types";

export function getCloudflareEnv(): AppCloudflareEnv {
  return env as unknown as AppCloudflareEnv;
}

export async function getCloudflareEnvAsync(): Promise<AppCloudflareEnv> {
  return getCloudflareEnv();
}
