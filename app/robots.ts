import type { MetadataRoute } from "next";

function normalizeOrigin(raw: string): string {
    return raw.replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
    const origin = normalizeOrigin(process.env.APP_ORIGIN ?? "https://kmdworks.com");
    const appEnv = process.env.APP_ENV ?? "";
    const isProd = appEnv === "prod";

    if (!isProd) {
        return {
            rules: {
                userAgent: "*",
                disallow: "/",
            },
            sitemap: `${origin}/sitemap.xml`,
        };
    }

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/management",
                    "/management/*",
                    "/login",
                    "/invite",
                    "/invite/*",
                    "/api",
                    "/api/*",
                ],
            },
        ],
        sitemap: `${origin}/sitemap.xml`,
    };
}
