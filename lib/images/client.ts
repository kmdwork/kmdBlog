import {
  IMAGE_COMPRESSION_THRESHOLD_BYTES,
  IMAGE_MAX_DIMENSION,
  IMAGE_WEBP_QUALITY,
  MAX_IMAGE_BYTES,
} from "./policy";

const CLIENT_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function prepareImageForUpload(file: File): Promise<File> {
  if (!CLIENT_ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("JPEG、PNG、WebP形式の画像を選択してください。");
  }
  if (file.size === 0) {
    throw new Error("空の画像ファイルはアップロードできません。");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("画像は5 MiB以下にしてください。");
  }
  if (file.size <= IMAGE_COMPRESSION_THRESHOLD_BYTES) {
    return file;
  }

  return compressToWebp(file);
}

function compressToWebp(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      callback();
    };

    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error("画像処理がタイムアウトしました。")));
    }, 30_000);

    image.onerror = () => {
      finish(() => reject(new Error("画像を読み込めませんでした。")));
    };

    image.onload = () => {
      try {
        let width = image.naturalWidth;
        let height = image.naturalHeight;
        if (width <= 0 || height <= 0) {
          finish(() => reject(new Error("画像サイズが不正です。")));
          return;
        }

        const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          finish(() => reject(new Error("画像を処理できませんでした。")));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              finish(() => reject(new Error("画像の圧縮に失敗しました。")));
              return;
            }
            if (blob.size > MAX_IMAGE_BYTES) {
              finish(() => reject(new Error("圧縮後の画像が5 MiBを超えています。")));
              return;
            }

            finish(() => resolve(new File([blob], "upload.webp", {
              type: "image/webp",
              lastModified: Date.now(),
            })));
          },
          "image/webp",
          IMAGE_WEBP_QUALITY,
        );
      } catch {
        finish(() => reject(new Error("画像の圧縮に失敗しました。")));
      }
    };

    image.src = objectUrl;
  });
}
