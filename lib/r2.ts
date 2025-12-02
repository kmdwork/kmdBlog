import { getCloudflareContext } from "@opennextjs/cloudflare";


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
export async function getR2Image (key: string, ifNoneMatch?: string):Promise<Response | null> {
    const { env } = getCloudflareContext<{ env: { R2_IMAGES: R2Bucket } }>();
    // @ts-expect-error: R2_IMAGES binding is injected by Wrangler at runtime
    const obj = await env.R2_IMAGES.get(key);
    if (!obj) return null;

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('ETag', obj.httpEtag);
    headers.set('Accept-Ranges', 'bytes'); 

    // Content-Type の保険（無いケースに備える）
    if (!headers.has('Content-Type')) {
        // 簡易拡張子判定（本気でやるならmimeライブラリ導入）
        const lc = key.toLowerCase()
        const fallback =
        lc.endsWith('.webp') ? 'image/webp' :
        lc.endsWith('.avif') ? 'image/avif' :
        lc.endsWith('.png')  ? 'image/png'  :
        lc.endsWith('.jpg') || lc.endsWith('.jpeg') ? 'image/jpeg' :
        lc.endsWith('.svg')  ? 'image/svg+xml' :
        'application/octet-stream'
        headers.set('Content-Type', fallback)
    }

    if (!headers.has('Cache-Control')) {
        headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800, immutable');
    }

    // 付加情報
    if (obj.size) headers.set('Content-Length', String(obj.size))
    if (obj.uploaded) headers.set('Last-Modified', new Date(obj.uploaded).toUTCString())

    // 条件付きGET: If-None-Match で 304
    if (ifNoneMatch && ifNoneMatch.replace(/W\//, '') === obj.httpEtag) {
        return new Response(null, { status: 304, headers })
    }

    return new Response(obj.body ,{
        headers,
    });
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
export function r2ImageKeyFromSlug(slug: string, filename: string, d = new Date()) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `images/${y}/${m}/${slug}/${filename}`;
}

// 画像アップロード
export async function putR2Image(params: {
    slug: string;
    file: File;
}) {
    const { slug, file } = params;

    const { env } = getCloudflareContext<{
        env: { R2_IMAGES: R2Bucket };
    }>();
    // @ts-expect-error: binding is injected by Wrangler
    const bucket: R2Bucket = env.R2_IMAGES;

    const key = r2ImageKeyFromSlug(slug, file.name);
    const arrayBuf = await file.arrayBuffer();

    // R2 へ PUT
    const res = await bucket.put(key, arrayBuf, {
        httpMetadata: {
            contentType: file.type || "application/octet-stream",
            cacheControl: "public,max-age=31536000,immutable",
        },
    });

    return {
        key,
        etag: res?.etag as string | undefined,
        size: res?.size ?? arrayBuf.byteLength,
        // ブラウザで参照するときの相対URL
        publicUrl: `/media/${key}`, // 既存の /media/[...path] route がR2_IMAGESを返す想定
    };
}
