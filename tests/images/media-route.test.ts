import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getR2Image: vi.fn(),
}));

vi.mock("@/lib/r2", () => ({
  getR2Image: mocks.getR2Image,
}));

import { GET } from "@/app/media/[...key]/route";

const uploaded = new Date("2026-08-28T00:00:00.000Z");

function context(...key: string[]) {
  return { params: Promise.resolve({ key }) };
}

describe("GET /media/[...key]", () => {
  beforeEach(() => {
    mocks.getR2Image.mockResolvedValue({
      status: "ok",
      object: {
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(Uint8Array.from([1, 2, 3]));
            controller.close();
          },
        }),
        httpEtag: '"etag"',
        size: 3,
        uploaded,
      },
    });
  });

  it.each([
    ["images", "..", "secret.png"],
    ["images", "bad\\key.png"],
    ["images", "active.svg"],
    ["images", "photo.avif"],
  ])("returns 404 without reading R2 for unsafe or unsupported keys", async (...segments) => {
    const response = await GET(
      new NextRequest(`https://example.com/media/${segments.join("/")}`),
      context(...segments),
    );
    expect(response.status).toBe(404);
    expect(mocks.getR2Image).not.toHaveBeenCalled();
  });

  it("forces safe response headers instead of trusting R2 metadata", async () => {
    const key = ["images", "2026", "08", "post", "123e4567-e89b-42d3-a456-426614174000.png"];
    const response = await GET(
      new NextRequest(`https://example.com/media/${key.join("/")}`),
      context(...key),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toBe("default-src 'none'; sandbox");
    expect(response.headers.get("cross-origin-resource-policy")).toBe("same-origin");
    expect(response.headers.get("cache-control")).toContain("immutable");
    expect(response.headers.get("etag")).toBe('"etag"');
  });

  it("returns a bodyless 304 for a matching ETag", async () => {
    mocks.getR2Image.mockResolvedValue({
      status: "not-modified",
      object: { httpEtag: '"etag"', size: 3, uploaded },
    });
    const response = await GET(
      new NextRequest("https://example.com/media/projects/work/hero.webp", {
        headers: { "if-none-match": '"etag"' },
      }),
      context("projects", "work", "hero.webp"),
    );

    expect(response.status).toBe(304);
    expect(response.body).toBeNull();
    expect(response.headers.get("content-length")).toBeNull();
    expect(mocks.getR2Image).toHaveBeenCalledWith(
      "projects/work/hero.webp",
      expect.any(Headers),
    );
  });
});
