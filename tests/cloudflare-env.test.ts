import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCloudflareContext: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mocks.getCloudflareContext,
}));

import {
  getCloudflareEnv,
  getCloudflareEnvAsync,
} from "@/lib/cloudflare-env";

describe("OpenNext Cloudflare bindings adapter", () => {
  beforeEach(() => {
    mocks.getCloudflareContext.mockReset();
  });

  it("returns request bindings synchronously", () => {
    const env = { DB: {}, R2_POSTS: {}, R2_IMAGES: {} };
    mocks.getCloudflareContext.mockReturnValue({ env });

    expect(getCloudflareEnv()).toBe(env);
    expect(mocks.getCloudflareContext).toHaveBeenCalledWith();
  });

  it("uses async context for static generation", async () => {
    const env = { DB: {}, R2_POSTS: {}, R2_IMAGES: {} };
    mocks.getCloudflareContext.mockResolvedValue({ env });

    await expect(getCloudflareEnvAsync()).resolves.toBe(env);
    expect(mocks.getCloudflareContext).toHaveBeenCalledWith({ async: true });
  });
});
