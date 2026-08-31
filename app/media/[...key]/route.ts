import { getR2Image } from "@/lib/r2";
import {
    imageCacheControl,
    imageTypeFromKey,
    isSafeImageKeySegments,
} from "@/lib/images/policy";
import { NextRequest } from "next/server";

type RouteContext = {
    params: Promise<{ key: string[] }>;
};

function imageResponseHeaders(
    key: string,
    object: Pick<R2Object, "httpEtag" | "size" | "uploaded">,
): Headers {
    const imageType = imageTypeFromKey(key);
    if (!imageType) throw new Error("Unsupported image type");

    const headers = new Headers({
        "Cache-Control": imageCacheControl(key),
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Content-Type": imageType.mime,
        "Cross-Origin-Resource-Policy": "same-origin",
        "ETag": object.httpEtag,
        "Last-Modified": object.uploaded.toUTCString(),
        "X-Content-Type-Options": "nosniff",
    });
    if (object.size > 0) {
        headers.set("Content-Length", String(object.size));
    }
    return headers;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
    const { key: segments } = await params;
    if (!isSafeImageKeySegments(segments)) {
        return new Response("Not Found", { status: 404 });
    }

    const key = segments.join("/");
    if (!imageTypeFromKey(key)) {
        return new Response("Not Found", { status: 404 });
    }

    const conditionalHeaders = new Headers();
    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch) conditionalHeaders.set("if-none-match", ifNoneMatch);

    const result = await getR2Image(
        key,
        ifNoneMatch ? conditionalHeaders : undefined,
    );
    if (!result) {
        return new Response("Not Found", { status: 404 });
    }

    const headers = imageResponseHeaders(key, result.object);
    if (result.status === "not-modified") {
        headers.delete("Content-Length");
        return new Response(null, { status: 304, headers });
    }

    return new Response(result.object.body, { headers });
}
