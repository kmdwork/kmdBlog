// lib/actions/uploadImage.ts
"use server";

// import { auth } from "@/auth";
// import { canCreate } from "@/lib/auth/permissions";
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
  // 認証チェック
//   const session = await auth();
//   const role = (session?.user as any)?.role;
//   if (!session?.user || !canCreate(role)) {
//     return { ok: false, error: "権限がありません" };
//   }

    const slug = String(formData.get("slug") ?? "").trim();
    const file = formData.get("image");

    if (!slug) {
        return { ok: false, error: "slug がありません" };
    }
    if (!(file instanceof File) || file.size === 0) {
        return { ok: false, error: "画像ファイルがありません" };
    }

    // R2に保存
    const { publicUrl } = await putR2Image({ slug, file });

    // Markdownで使える表記を返す
    const mdSnippet = `![](${publicUrl})`;

    return { 
        ok: true, 
        markdown: mdSnippet 
    };
}