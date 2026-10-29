import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 画像本体は最大 5 MiB。multipart のオーバーヘッド分だけ余裕を持たせる。
      bodySizeLimit: "6mb",
    },
  },
  images: {
    // VinextではCloudflare Images optimizerをまだ構成していないため、
    // 原本を直接配信して/_next/imageの400を避ける。OpenNextは従来どおり最適化する。
    unoptimized: process.env.KMDBLOG_RUNTIME === "vinext",
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
if (process.env.KMDBLOG_RUNTIME !== "vinext") {
  initOpenNextCloudflareForDev();
}
