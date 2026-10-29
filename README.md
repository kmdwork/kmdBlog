# kmdBlog

Next.js App Router と Cloudflare Workers で動作するブログです。公開記事・作品一覧と、招待制の管理画面を提供します。記事のメタデータは Cloudflare D1、Markdown 本文と画像は Cloudflare R2 に保存します。

設計上の境界、認可、データ整合性、既知の課題は [docs/architecture.md](docs/architecture.md) を参照してください。コードを変更するときの文書更新ルールは [AGENTS.md](AGENTS.md) にあります。

## 技術構成

- Next.js 16 / React 19 / TypeScript
- Auth.js（Google OAuth、JWT セッション）
- Drizzle ORM / Cloudflare D1
- Cloudflare R2（記事本文・画像）
- OpenNext for Cloudflare / Wrangler
- Vitest / ESLint

OpenNext は現行の実装です。Vinext への移行は検討事項であり、まだ採用決定ではありません。

## ローカル開発

確認済みのローカル環境は Node.js 24.22.1、npm 11.19.1 です。CI は現在 Node.js 22 を使用します。

```bash
npm ci
npm run dev
```

`npm run dev` は Next.js の開発サーバーを起動します。Cloudflare バインディングを含めて確認する場合は、OpenNext のビルド後にローカル Worker を起動します。

```bash
npm run local:dev
```

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

`.github/workflows/deploy-stg.yml` は `main` への push を契機に、Node.js 22 で OpenNext ビルドを行い、ステージングへデプロイします。本番デプロイはこのワークフローに含まれません。

## 文書

- [システム設計と既知の課題](docs/architecture.md)
- [リポジトリ内の作業ルール](AGENTS.md)
