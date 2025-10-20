import { getR2Image } from "@/lib/r2";
import { NextRequest } from "next/server";



export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    // 例: /media/posts/hello-world-r2/hero.jpg → posts/hello-world-r2/hero.jpg
    const prefix = '/media/'
    let key = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : ''
    key = decodeURIComponent(key).replace(/^\/+/, '') 
    if (!key || key.endsWith('/')) {
        return new Response(`Not Found :${key}`, { status: 404 })
    }
    const ifNoneMatch = req.headers.get('if-none-match') ?? undefined

    const res = await getR2Image(key, ifNoneMatch)
    return res ?? new Response(`Not Found: res: ${key}`, { status: 404 })
}