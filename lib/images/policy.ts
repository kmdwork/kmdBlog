export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_DETECTION_BYTES = 4100;
export const IMAGE_COMPRESSION_THRESHOLD_BYTES = 300 * 1024;
export const IMAGE_MAX_DIMENSION = 1600;
export const IMAGE_WEBP_QUALITY = 0.8;
export const IMAGE_INPUT_ACCEPT = "image/jpeg,image/png,image/webp";

export type AllowedImageExtension = "jpg" | "png" | "webp";
export type AllowedImageMime = "image/jpeg" | "image/png" | "image/webp";

export type AllowedImageType = {
  extension: AllowedImageExtension;
  mime: AllowedImageMime;
};

const ALLOWED_TYPES: Record<AllowedImageExtension, AllowedImageMime> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_IMAGE_KEY_PATTERN =
  /^images\/\d{4}\/\d{2}\/[a-z0-9]+(?:-[a-z0-9]+)*\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i;

export function isValidImageSlug(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 100 && SLUG_PATTERN.test(slug);
}

export function imageTypeFromExtension(
  extension: string,
): AllowedImageType | null {
  const normalized = extension.toLowerCase() === "jpeg"
    ? "jpg"
    : extension.toLowerCase();

  if (normalized !== "jpg" && normalized !== "png" && normalized !== "webp") {
    return null;
  }

  return {
    extension: normalized,
    mime: ALLOWED_TYPES[normalized],
  };
}

export function imageTypeFromKey(key: string): AllowedImageType | null {
  const match = key.match(/\.([^.\/]+)$/);
  return match ? imageTypeFromExtension(match[1]) : null;
}

export function isSafeImageKeySegments(segments: string[]): boolean {
  if (segments.length === 0) return false;

  return segments.every((segment) => {
    if (!segment || segment === "." || segment === "..") return false;
    // catch-all paramsの1要素にスラッシュが残る場合は、エンコードされた区切り文字。
    return !/[\/\\\u0000-\u001f\u007f]/.test(segment);
  });
}

export function isImmutableGeneratedImageKey(key: string): boolean {
  return UUID_IMAGE_KEY_PATTERN.test(key);
}

export function imageCacheControl(key: string): string {
  return isImmutableGeneratedImageKey(key)
    ? "public, max-age=31536000, immutable"
    : "public, max-age=86400, s-maxage=604800";
}
