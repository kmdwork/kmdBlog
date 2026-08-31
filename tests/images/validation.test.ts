import { describe, expect, it } from "vitest";
import { detectAllowedImageType } from "@/lib/images/validate.server";

function binaryFile(bytes: number[], name: string, type = "application/octet-stream") {
  return new File([Uint8Array.from(bytes).buffer], name, { type });
}

function pngFile(name: string, type: string) {
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  return new File([bytes], name, { type });
}

describe("detectAllowedImageType", () => {
  it.each([
    {
      label: "JPEG",
      file: binaryFile([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1], "fake.txt", "text/plain"),
      expected: { extension: "jpg", mime: "image/jpeg" },
    },
    {
      label: "PNG",
      file: pngFile("fake.svg", "image/svg+xml"),
      expected: { extension: "png", mime: "image/png" },
    },
    {
      label: "WebP",
      file: binaryFile([0x52, 0x49, 0x46, 0x46, 0x1a, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20], "fake.jpg", "image/jpeg"),
      expected: { extension: "webp", mime: "image/webp" },
    },
  ])("detects $label from bytes rather than metadata", async ({ file, expected }) => {
    await expect(detectAllowedImageType(file)).resolves.toEqual(expected);
  });

  it.each([
    new File(["<html><script>alert(1)</script></html>"], "image.png", { type: "image/png" }),
    new File(["<svg xmlns='http://www.w3.org/2000/svg'></svg>"], "image.png", { type: "image/png" }),
    binaryFile([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], "image.png", "image/png"),
    binaryFile([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66, 0, 0, 0, 0, 0x61, 0x76, 0x69, 0x66], "image.png", "image/png"),
  ])("rejects active or unsupported content even when declared as PNG", async (file) => {
    await expect(detectAllowedImageType(file)).resolves.toBeNull();
  });
});
