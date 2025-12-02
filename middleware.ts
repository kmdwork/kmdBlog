import { auth } from "./auth";

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // 1) /management 以下は「ログイン必須」
    if (pathname.startsWith("/management")) {
        if (!req.auth) {
            const url = new URL("/login", req.nextUrl.origin);
            url.searchParams.set("from", pathname);
            return Response.redirect(url);
        }

        // 2) /management/admin 以下は「admin 必須」
        if (pathname.startsWith("/management/admin")) {
            const role = (req.auth.user as any)?.role;
            if (role !== "admin") {
                // A: 403 を返す（APIやSSRでもわかりやすい）
                return new Response("Forbidden", { status: 403 });

                // B: 画面体験を優先して /management に戻す場合は下を使う
                // const back = new URL("/management", req.nextUrl.origin);
                // return Response.redirect(back);
            }
        }
    }

    // それ以外は通過
});

export const config = {
    matcher: [
        "/management/:path*"
    ]
}