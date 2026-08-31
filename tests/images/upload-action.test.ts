import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_IMAGE_BYTES } from "@/lib/images/policy";

const mocks = vi.hoisted(() => ({
  getActiveContentEditor: vi.fn(),
  putR2Image: vi.fn(),
}));

vi.mock("@/lib/auth/contentEditor", () => ({
  getActiveContentEditor: mocks.getActiveContentEditor,
}));

vi.mock("@/lib/r2", () => ({
  putR2Image: mocks.putR2Image,
}));

import { uploadImageAction } from "@/lib/actions/uploadImage";

function formWith(file: File, slug = "valid-post") {
  const form = new FormData();
  form.set("slug", slug);
  form.set("image", file);
  return form;
}

const pngFile = () => new File([
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
], "misleading.svg", { type: "image/svg+xml" });

describe("uploadImageAction", () => {
  beforeEach(() => {
    mocks.getActiveContentEditor.mockResolvedValue({ id: 7, role: "editor" });
    mocks.putR2Image.mockResolvedValue({
      publicUrl: "/media/images/2026/08/valid-post/id.png",
    });
  });

  it("fails closed before touching R2 when authorization fails", async () => {
    mocks.getActiveContentEditor.mockResolvedValue(null);
    const result = await uploadImageAction({ ok: false }, formWith(pngFile()));
    expect(result.ok).toBe(false);
    expect(mocks.putR2Image).not.toHaveBeenCalled();
  });

  it("rejects invalid slugs, empty files, and oversized files", async () => {
    const invalidSlug = await uploadImageAction({ ok: false }, formWith(pngFile(), "../bad"));
    const empty = await uploadImageAction(
      { ok: false },
      formWith(new File([], "empty.png", { type: "image/png" })),
    );
    const oversized = await uploadImageAction(
      { ok: false },
      formWith(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.png", { type: "image/png" })),
    );

    expect(invalidSlug.ok).toBe(false);
    expect(empty.ok).toBe(false);
    expect(oversized.ok).toBe(false);
    expect(mocks.putR2Image).not.toHaveBeenCalled();
  });

  it("rejects HTML content declared as an image", async () => {
    const file = new File(["<html>not an image</html>"], "photo.png", { type: "image/png" });
    const result = await uploadImageAction({ ok: false }, formWith(file));
    expect(result.ok).toBe(false);
    expect(mocks.putR2Image).not.toHaveBeenCalled();
  });

  it("stores a valid image using its detected type", async () => {
    const file = pngFile();
    const result = await uploadImageAction({ ok: false }, formWith(file));

    expect(result).toEqual({
      ok: true,
      markdown: "![](/media/images/2026/08/valid-post/id.png)",
    });
    expect(mocks.putR2Image).toHaveBeenCalledWith({
      slug: "valid-post",
      file,
      imageType: { extension: "png", mime: "image/png" },
    });
  });

  it("returns a generic error when R2 storage fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.putR2Image.mockRejectedValue(new Error("sensitive storage detail"));
    const result = await uploadImageAction({ ok: false }, formWith(pngFile()));
    expect(result).toEqual({ ok: false, error: "画像を保存できませんでした" });
  });
});
