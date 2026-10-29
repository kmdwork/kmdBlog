import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  put: vi.fn(),
  get: vi.fn(),
  getCloudflareContext: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mocks.getCloudflareContext,
}));

import { getR2Image, putR2Image, r2ImageKeyFromSlug } from "@/lib/r2";

describe("R2 image storage", () => {
  beforeEach(() => {
    mocks.getCloudflareContext.mockReturnValue({
      env: { R2_IMAGES: { put: mocks.put, get: mocks.get } },
    });
    mocks.put.mockResolvedValue({ etag: "etag", size: 4 });
  });

  it("builds an immutable UUID key without using the original filename", () => {
    expect(r2ImageKeyFromSlug(
      "my-post",
      "webp",
      new Date("2026-08-28T00:00:00.000Z"),
      "123e4567-e89b-42d3-a456-426614174000",
    )).toBe("images/2026/08/my-post/123e4567-e89b-42d3-a456-426614174000.webp");
  });

  it("generates a different key for each upload", () => {
    const uploadedAt = new Date("2026-08-28T00:00:00.000Z");

    expect(r2ImageKeyFromSlug("my-post", "png", uploadedAt))
      .not.toBe(r2ImageKeyFromSlug("my-post", "png", uploadedAt));
  });

  it("streams a validated file with fixed metadata and no-overwrite condition", async () => {
    const file = new File([Uint8Array.from([1, 2, 3, 4])], "attacker.html", {
      type: "text/html",
    });
    const result = await putR2Image({
      slug: "my-post",
      file,
      imageType: { extension: "png", mime: "image/png" },
    });

    expect(result.key).toMatch(/^images\/\d{4}\/\d{2}\/my-post\/[0-9a-f-]+\.png$/);
    const [key, body, options] = mocks.put.mock.calls[0];
    expect(key).toBe(result.key);
    expect(body).toBeInstanceOf(ReadableStream);
    expect(options).toEqual({
      onlyIf: { etagDoesNotMatch: "*" },
      httpMetadata: {
        contentType: "image/png",
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
  });

  it("does not silently overwrite on a conditional PUT collision", async () => {
    mocks.put.mockResolvedValue(null);
    await expect(putR2Image({
      slug: "my-post",
      file: new File(["data"], "photo.png"),
      imageType: { extension: "png", mime: "image/png" },
    })).rejects.toThrow("collision");
  });

  it("passes If-None-Match to R2 and identifies a bodyless result", async () => {
    const object = { httpEtag: '"etag"', size: 4, uploaded: new Date() };
    mocks.get.mockResolvedValue(object);
    const headers = new Headers({ "if-none-match": '"etag"' });

    await expect(getR2Image("images/photo.png", headers)).resolves.toEqual({
      status: "not-modified",
      object,
    });
    expect(mocks.get).toHaveBeenCalledWith("images/photo.png", { onlyIf: headers });
  });
});
