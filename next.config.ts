import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // "incremental" か true（どちらでもOK）
    ppr: 'incremental',
  },
};
module.exports = {
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "kmdworks.com" },
            { protocol: "https", hostname: "dev.kmdworks.com" },
            { protocol: "https", hostname: "stg.kmdworks.com" },
            {
                protocol: "http",
                hostname: "localhost",
                port: "8787",
            },
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
        ],
    },
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
