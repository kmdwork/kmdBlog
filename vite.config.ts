import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { fileURLToPath } from "node:url";

// next.config.tsのOpenNext開発初期化をVinextビルドでは実行しない。
process.env.KMDBLOG_RUNTIME = "vinext";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@\/lib\/cloudflare-env$/,
        replacement: fileURLToPath(
          new URL("./lib/cloudflare-env.vinext.ts", import.meta.url),
        ),
      },
    ],
  },
  plugins: [
    vinext(),
    cloudflare({
      persistState: { path: ".wrangler/state/vinext" },
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
