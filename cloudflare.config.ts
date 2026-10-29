import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

const commonEnv = {
  ASSETS: bindings.assets(),
  AUTH_SECRET: bindings.secret(),
  AUTH_GOOGLE_ID: bindings.secret(),
  AUTH_GOOGLE_SECRET: bindings.secret(),
  OWNER_EMAIL: bindings.secret(),
  RESEND_API_KEY: bindings.secret(),
  MAIL_FROM: bindings.secret(),
};

export default defineConfig(({ mode }) => {
  const isDevDeployment = mode === "dev";
  const stagedDeployment = mode === "stg"
    ? {
        environment: "stg",
        origin: "https://stg.kmdworks.com",
        route: "stg.kmdworks.com/*",
        databaseId: "1e4af4a6-62c2-4932-a20f-8f1c939f8774",
      }
    : mode === "prod"
      ? {
          environment: "prod",
          origin: "https://kmdworks.com",
          route: "kmdworks.com/*",
          databaseId: "558a641d-bf16-44ca-9237-fa9c6f7b8d16",
        }
      : undefined;
  const isDeployment = isDevDeployment || stagedDeployment !== undefined;

  return {
    accountId: isDeployment
      ? "b0a13428f1c5b31e40235985336f152b"
      : undefined,
    worker: defineWorker({
      name: isDevDeployment
        ? "kmdblog-web-vinext-dev"
        : stagedDeployment
          ? `kmdblog-web-vinext-${stagedDeployment.environment}`
          : "kmdblog-web-vinext-poc",
      entrypoint: "vinext/server/fetch-handler",
      compatibilityDate: "2026-10-29",
      compatibilityFlags: ["nodejs_compat"],
      workersDev: !stagedDeployment,
      previewUrls: isDevDeployment,
      observability: isDeployment ? { enabled: true } : undefined,
      triggers: isDevDeployment
        ? [
            triggers.fetch({
              pattern: "dev.kmdworks.com/*",
              zone: "kmdworks.com",
            }),
          ]
        : stagedDeployment
          ? [triggers.fetch({ pattern: stagedDeployment.route, zone: "kmdworks.com" })]
          : undefined,
      assets: {
        htmlHandling: "none",
        notFoundHandling: "none",
        runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
      },
      env: isDevDeployment
        ? {
            ...commonEnv,
            APP_ENV: bindings.text("dev"),
            APP_ORIGIN: bindings.secret(),
            API_BASE_URL: bindings.text("https://api-dev.example.com"),
            DB: bindings.d1({
              name: "kmdblog-d1-dev",
              id: "94d6e5d1-33fd-4704-9ea9-8b9b85f06c43",
            }),
            KV_CACHE: bindings.kv({
              id: "60f75a20af044705a50d6b9ef424bcc9",
            }),
            R2_POSTS: bindings.r2({ name: "kmdblog-md-dev" }),
            R2_IMAGES: bindings.r2({ name: "kmdblog-images-dev" }),
          }
        : stagedDeployment
          ? {
              ...commonEnv,
              APP_ENV: bindings.text(stagedDeployment.environment),
              APP_ORIGIN: bindings.text(stagedDeployment.origin),
              API_BASE_URL: bindings.text(`https://api-${stagedDeployment.environment}.example.com`),
              DB: bindings.d1({
                name: `kmdblog-d1-${stagedDeployment.environment}`,
                id: stagedDeployment.databaseId,
              }),
              KV_CACHE: bindings.kv({ id: "1aaa06c8b7574a378d9d0c63e515700f" }),
              R2_POSTS: bindings.r2({ name: `kmdblog-md-${stagedDeployment.environment}` }),
              R2_IMAGES: bindings.r2({ name: `kmdblog-images-${stagedDeployment.environment}` }),
            }
          : {
            ...commonEnv,
            APP_ENV: bindings.text("vinext-poc"),
            APP_ORIGIN: bindings.text("http://localhost:3001"),
            DB: bindings.d1({ name: "kmdblog-d1-dev" }),
            R2_POSTS: bindings.r2({ name: "kmdblog-md-dev" }),
            R2_IMAGES: bindings.r2({ name: "kmdblog-images-dev" }),
          },
    }),
  };
});
