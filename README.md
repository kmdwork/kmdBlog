# kmdBlog

Next.js App Router と Cloudflare Workers で動作するブログです。公開記事・作品一覧と、招待制の管理画面を提供します。記事のメタデータは Cloudflare D1、Markdown 本文と画像は Cloudflare R2 に保存します。

設計上の境界、認可、データ整合性、既知の課題は [docs/architecture.md](docs/architecture.md) を参照してください。コードを変更するときの文書更新ルールは [AGENTS.md](AGENTS.md) にあります。

## 技術構成

- Next.js 16 / React 19 / TypeScript
- Auth.js（Google OAuth、JWT セッション）
- Drizzle ORM / Cloudflare D1
- Cloudflare R2（記事本文・画像）
- OpenNext for Cloudflare / Wrangler
- Vinext / Cloudflare Vite plugin（移行可否を調べるPoCのみ）
- Vitest / ESLint

Issue #4でVinextへの段階移行を採用しています。本番はOpenNextを維持し、devでVinextを確認中です。stg検証後に本番を切り替えます。結果と切替条件は下記の移行文書を参照してください。

## ローカル開発

確認済みのローカル環境は Node.js 24.22.1、npm 11.19.1 です。CIの設定もNode.js 24です。

```bash
npm ci
npm run dev
```

`npm run dev` は Next.js の開発サーバーを起動します。Cloudflare バインディングを含めて確認する場合は、OpenNext のビルド後にローカル Worker を起動します。

```bash
npm run local:dev
```

Vinext PoCをローカル実行する場合は、`.dev.vars.example` のキーをGit管理外の `.dev.vars`（開発サーバー）または `.dev.vars.production`（ビルド済みプレビュー）へ設定してください。値はリポジトリへ追加しません。

ローカルのシークレットは、Git 管理されない `.dev.vars` 系ファイルで管理してください。値を README、Issue、ログ、コミットに記録しないでください。

## 必要な設定

アプリケーションが参照する主な環境変数は次のとおりです。

| 名前 | 用途 | 機密情報 |
| --- | --- | --- |
| `APP_ENV` | 実行環境の識別 | いいえ |
| `APP_ORIGIN` | 公開 URL、招待 URL、メタデータ生成 | いいえ |
| `AUTH_SECRET` | Auth.js の署名 | はい |
| `AUTH_GOOGLE_ID` | Google OAuth クライアント ID | 設定として保護 |
| `AUTH_GOOGLE_SECRET` | Google OAuth クライアントシークレット | はい |
| `OWNER_EMAIL` | 初回管理者のブートストラップ | 個人情報として保護 |
| `RESEND_API_KEY` | 招待メール送信 | はい |
| `MAIL_FROM` | 招待メールの送信元 | いいえ |

Wrangler から注入される主な Cloudflare バインディングは次のとおりです。

| バインディング | 用途 |
| --- | --- |
| `DB` | D1 データベース |
| `R2_POSTS` | Markdown 本文 |
| `R2_IMAGES` | 投稿画像 |
| `KV_CACHE` | キャッシュ用 KV（現時点のアプリケーションコードでは未使用） |
| `ASSETS` | 静的アセット |

実体名や ID は環境別の Wrangler 設定で管理します。文書には転記しません。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | Next.js 開発サーバー |
| `npm run build` | Next.js 本番ビルド |
| `npm test` | Vitest の全テスト |
| `npm run lint` | ESLint |
| `npm run dev:vinext` | Vinext PoC の開発サーバー |
| `npm run build:vinext` | Vinext PoC の Worker ビルド |
| `npm run build:vinext:dev` | dev bindingsを使うVinext Workerビルド |
| `npm run start:vinext` | ビルド済み Vinext PoC のローカルプレビュー |
| `npm run start:vinext:dev` | dev設定のビルド済みVinextローカルプレビュー |
| `npm run cf-typegen:vinext` | Vinext設定からCloudflare binding型を生成 |
| `npm run cf-typegen:vinext:dev` | Vinext dev設定からCloudflare binding型を生成 |
| `npm run deploy:vinext:dev:dry-run` | Vinext dev版をアップロードせず検証 |
| `npm run deploy:vinext:dev` | Vinext確認用dev Workerへデプロイ |
| `npm run build:vinext:stg` / `npm run build:vinext:prod` | 環境別Vinextビルド |
| `npm run deploy:vinext:stg:dry-run` / `npm run deploy:vinext:prod:dry-run` | 環境別Vinextデプロイ検証 |
| `npm run deploy:vinext:stg` / `npm run deploy:vinext:prod` | 環境別Vinextデプロイ（Route移管は手順書参照） |
| `npm run preview` | 開発環境設定で OpenNext プレビュー |
| `npm run local:dev` | 開発環境設定でローカル Worker |
| `npm run cf-typegen` | Cloudflare バインディング型の再生成 |
| `npm run deploy:dev` | 開発環境へデプロイ |
| `npm run deploy:stg` | ステージング環境へデプロイ |
| `npm run deploy:prod` | 本番環境へデプロイ |

デプロイ系コマンドは外部環境を変更します。対象設定と認証先を確認してから実行してください。このリポジトリの作業だけでデプロイの実行までを前提にしません。

## データベース変更

スキーマは `db/schema.ts`、生成済みマイグレーションは `drizzle/` にあります。環境別 D1 への適用手順は、現時点では npm スクリプトとして標準化されていません。スキーマ変更時は、マイグレーション生成物と適用・ロールバック手順を同じ変更内で明示してください。

## CI/CD

`.github/workflows/deploy-stg.yml` は `main` へのpushを契機に、Node.js 24でテスト・Lint・Vinextのstgビルドを行い、生成物を`cf deploy --mode stg --prebuilt`でデプロイする設定です。変更後のGitHub Actions実行は未確認です。本番デプロイは含みません。

CI認証にはGitHub Actions secretの`CLOUDFLARE_API_TOKEN`を使用します。アプリ用secretは手動デプロイで`kmdblog-web-vinext-stg`へ登録済みの値を保持するため、CIでは`.dev.vars.stg`を生成・送信しません。secret更新は手元の`npm run deploy:vinext:stg`で行います。

## 文書

- [システム設計と既知の課題](docs/architecture.md)
- [Vinext 移行フェーズ1 PoC レポート](docs/migrations/vinext-phase-1-poc.md)
- [Vinext 移行フェーズ2 互換性レポート](docs/migrations/vinext-phase-2-compatibility.md)
- [Vinext 移行フェーズ3 dev確認手順](docs/migrations/vinext-phase-3-dev.md)
- [Vinext 移行フェーズ4 本番切替準備](docs/migrations/vinext-phase-4-production.md)
- [リポジトリ内の作業ルール](AGENTS.md)
