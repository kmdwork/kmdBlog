import { describe, expect, it } from "vitest";
import {
  imageCacheControl,
  imageTypeFromKey,
  isImmutableGeneratedImageKey,
  isSafeImageKeySegments,
  isValidImageSlug,
} from "@/lib/images/policy";

describe("image policy", () => {
  it("accepts the same slug shape used by post creation", () => {
    expect(isValidImageSlug("valid-post-123")).toBe(true);
    expect(isValidImageSlug("ab")).toBe(false);
    expect(isValidImageSlug("Invalid_Slug")).toBe(false);
    expect(isValidImageSlug(`a${"b".repeat(100)}`)).toBe(false);
  });

  it("maps only JPEG, PNG, and WebP extensions", () => {
    expect(imageTypeFromKey("legacy/photo.jpeg")?.mime).toBe("image/jpeg");
    expect(imageTypeFromKey("legacy/photo.PNG")?.mime).toBe("image/png");
    expect(imageTypeFromKey("legacy/photo.webp")?.mime).toBe("image/webp");
    expect(imageTypeFromKey("legacy/photo.svg")).toBeNull();
    expect(imageTypeFromKey("legacy/photo.avif")).toBeNull();
  });

  it("rejects traversal and control characters in key segments", () => {
    expect(isSafeImageKeySegments(["images", "post", "photo.png"])).toBe(true);
    expect(isSafeImageKeySegments(["images", "..", "photo.png"])).toBe(false);
    expect(isSafeImageKeySegments(["images", "bad\\key.png"])).toBe(false);
    expect(isSafeImageKeySegments(["images/..", "photo.png"])).toBe(false);
    expect(isSafeImageKeySegments(["images", "bad\u0000key.png"])).toBe(false);
    expect(isSafeImageKeySegments(["images", ""])).toBe(false);
  });

  it("uses immutable caching only for generated UUID keys", () => {
    const generated = "images/2026/08/my-post/123e4567-e89b-42d3-a456-426614174000.webp";
    expect(isImmutableGeneratedImageKey(generated)).toBe(true);
    expect(imageCacheControl(generated)).toContain("immutable");
    expect(imageCacheControl("projects/work/hero.webp")).toBe(
      "public, max-age=86400, s-maxage=604800",
    );
  });
});
