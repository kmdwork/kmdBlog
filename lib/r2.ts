import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
    imageCacheControl,
    type AllowedImageType,
} from "@/lib/images/policy";


// ----------投稿取得----------
export async function getR2Text (r2Key: string):Promise<string | null> {
    const { env } = getCloudflareContext<{
        env: { R2_POSTS: R2Bucket };
    }>();
    
    // @ts-expect-error: R2_POSTS binding is injected by Wrangler at runtime
    const obj = await env.R2_POSTS.get(r2Key);
    if(!obj) return null;
    return obj.text();
}

// ----------画像取得----------
export type R2ImageResult =
    | { status: "ok"; object: R2ObjectBody }
    | { status: "not-modified"; object: R2Object };

function hasR2Body(object: R2Object): object is R2ObjectBody {
    return "body" in object;
}

export async function getR2Image(
    key: string,
    conditionalHeaders?: Headers,
): Promise<R2ImageResult | null> {
    const { env } = getCloudflareContext();
    const bucket = (env as unknown as { R2_IMAGES: R2Bucket }).R2_IMAGES;
    const obj = conditionalHeaders
        ? await bucket.get(key, {
            onlyIf: conditionalHeaders,
        })
        : await bucket.get(key);
    if (!obj) return null;

    // R2のconditional getにより、条件不一致時はbodyを持たないR2Objectが返る。
    if (!hasR2Body(obj)) {
        return { status: "not-modified", object: obj };
    }

    return { status: "ok", object: obj };
}



// ----------投稿の登録----------
// slug発行
export function r2PostsKeyFromSlug(filename: string ,d = new Date()) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `posts/${y}/${m}/${filename}.md`;
}

// r2.md 登録 & 更新
export async function putR2Markdown(key: string, content: string) {
    const { env } = getCloudflareContext<{
        env: { R2_POSTS: R2Bucket };
    }>();
    // @ts-expect-error: binding is injected by Wrangler
    const bucket: R2Bucket = env.R2_POSTS;
    const res = await bucket.put(key, content, {
        httpMetadata: { contentType: "text/markdown; charset=utf-8", cacheControl: "no-cache" },
    });
    return {key, etag: res?.etag as string | undefined, size: res?.size ?? content.length};
}



// ----------画像の登録----------
// 画像キーを作る
export function r2ImageKeyFromSlug(
    slug: string,
    extension: AllowedImageType["extension"],
    d = new Date(),
    id = crypto.randomUUID(),
) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `images/${y}/${m}/${slug}/${id}.${extension}`;
}

// 画像アップロード
export async function putR2Image(params: {
    slug: string;
    file: File;
    imageType: AllowedImageType;
}) {
    const { slug, file, imageType } = params;

    const { env } = getCloudflareContext<{
        env: { R2_IMAGES: R2Bucket };
    }>();
    // @ts-expect-error: binding is injected by Wrangler
    const bucket: R2Bucket = env.R2_IMAGES;

    const key = r2ImageKeyFromSlug(slug, imageType.extension);

    // 検証済みの型だけを固定メタデータとして保存し、全体のメモリコピーを避ける。
    const res = await bucket.put(key, file.stream(), {
        onlyIf: { etagDoesNotMatch: "*" },
        httpMetadata: {
            contentType: imageType.mime,
            cacheControl: imageCacheControl(key),
        },
    });
    if (!res) {
        throw new Error("R2 image key collision");
    }

    return {
        key,
        etag: res.etag,
        size: res.size,
        // ブラウザで参照するときの相対URL
        publicUrl: `/media/${key}`,
    };
}
