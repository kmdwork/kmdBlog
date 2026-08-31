// lib/actions/uploadImage.ts
"use server";

import { getActiveContentEditor } from "@/lib/auth/contentEditor";
import { MAX_IMAGE_BYTES, isValidImageSlug } from "@/lib/images/policy";
import { detectAllowedImageType } from "@/lib/images/validate.server";
import { putR2Image } from "@/lib/r2";

export type UploadImageResult = {
  ok: boolean;
  error?: string;
  markdown?: string; // `![](url)` を返す
};

export async function uploadImageAction(
  _prevState: UploadImageResult,
  formData: FormData
): Promise<UploadImageResult> {
    // Server Action は公開エンドポイントとして扱い、毎回Action内で認証・認可する。
    const editor = await getActiveContentEditor();
    if (!editor) {
        return { ok: false, error: "画像をアップロードする権限がありません" };
    }

    const slug = String(formData.get("slug") ?? "").trim();
    const file = formData.get("image");

    if (!isValidImageSlug(slug)) {
        return { ok: false, error: "slug の形式が不正です" };
    }
    if (!(file instanceof File) || file.size === 0) {
        return { ok: false, error: "画像ファイルがありません" };
    }
    if (file.size > MAX_IMAGE_BYTES) {
        return { ok: false, error: "画像は5 MiB以下にしてください" };
    }

    let imageType;
    try {
        imageType = await detectAllowedImageType(file);
    } catch {
        return { ok: false, error: "画像ファイルを検証できませんでした" };
    }
    if (!imageType) {
        return { ok: false, error: "JPEG、PNG、WebP形式の画像のみアップロードできます" };
    }

    try {
        const { publicUrl } = await putR2Image({ slug, file, imageType });
        return {
            ok: true,
            markdown: `![](${publicUrl})`,
        };
    } catch {
        console.error("[upload-image] R2 upload failed", { userId: editor.id });
        return { ok: false, error: "画像を保存できませんでした" };
    }
}
