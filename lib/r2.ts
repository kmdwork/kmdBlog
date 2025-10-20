import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getR2Text (r2Key: string):Promise<string | null> {
    const { env } = getCloudflareContext<{
        env: { R2_POSTS: R2Bucket };
    }>();
    
    // @ts-expect-error: R2_POSTS binding is injected by Wrangler at runtime
    const obj = await env.R2_POSTS.get(r2Key);
    if(!obj) return null;
    return obj.text();
}


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
