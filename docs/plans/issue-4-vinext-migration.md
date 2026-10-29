# Issue #4: OpenNext から Vinext への段階的移行計画

- Issue: https://github.com/kmdwork/kmdBlog/issues/4
- 計画作成日: 2026-10-29
- 対象ベース: `main`
- 状態: 計画のみ。実装未着手

## Goal

OpenNextで稼働しているkmdBlogを、現行本番を維持したまま段階的にVinextへ移行する。公開サイト、管理画面、Auth.jsによる認証・認可、D1/R2/KV bindings、Server Actions、Route Handlers、SSR/ISR、メタデータ、画像配信の観測可能な挙動を維持する。

Vinextはbetaであり、公式ドキュメントも本番採用前の互換性チェックを求めている。そのため、互換性PoCで阻害要因と実際の生成物を確認するまでは、OpenNextのビルド・デプロイ経路を削除しない。

Related to #4

## Requirement Model

### Current Behavior

- **確認済み:** Next.js 16.4.3、React 19、Auth.js 5.0.0-beta.32、OpenNext for Cloudflare 1.20.14を使用している。
- **確認済み:** OpenNextは `.open-next/worker.js` と `.open-next/assets` を生成し、環境別 `wrangler.*.jsonc` からCloudflare Workersへデプロイする。
- **確認済み:** D1は `DB`、R2は `R2_POSTS` / `R2_IMAGES`、KVは `KV_CACHE` として環境別にbindingされる。アプリケーションコードでのKV利用は現時点では確認できない。
- **確認済み:** `lib/db.ts` と `lib/r2.ts` はOpenNext固有の `getCloudflareContext()` からbindingsを取得する。
- **確認済み:** `proxy.ts` はAuth.jsの `auth()` ラッパーを使用し、`/management` では `req.auth?.user` を要求し、`/management/admin` ではadmin以外を403にする。Issue #3の回帰テストはmainに存在する。
- **確認済み:** 記事詳細と一覧に `revalidate = 60` があり、公開ページはSSR、メタデータ、sitemap、robots、`next/image` を利用する。
- **確認済み:** `/media/[...key]` はR2オブジェクトをストリーム配信し、固定Content-Type、CSP、`nosniff`、ETag、Cache-Controlを付与する。
- **確認済み:** CIはmainへのpushでNode.js 22を使ってOpenNextをビルドし、ステージングへデプロイする。
- **確認済み:** 現在のmainでは `compatibility_date` はdev/prodが `2025-10-29`、stgが `2025-03-01` である。Issue本文の「stg/prodが2025-03-01」という記載からprodは更新済みである。
- **確認済み:** 公式手順では `vinext check` と非破壊的な `vinext init` が提供され、既存のNext.js経路とVinext経路を並行利用できる。
- **確認済み:** VinextはApp Router、Server Actions、Route Handlers、SSR、ISR、`proxy.ts`、Cloudflare bindingsをサポートするとしている。一方、画像最適化は部分対応で、Cache Components、ビルド時画像・フォント最適化、開発時native modulesには既知の差異がある。

### Required Behavior

- Vinextの互換性チェック、本番ビルド、Cloudflare Workersローカル実行を成功させ、未対応項目があれば影響と判断を記録する。
- Googleログイン、ログアウト、JWTセッション、招待、新規・既存ユーザーのサインイン条件を維持する。
- 未認証またはuserを欠く異常な認証結果を `/management` へ通さない。
- 非adminの `/management/admin` を403にし、adminだけを通す。
- Server ActionsとRoute Handlersのサーバー側認可、入力検証、fail-closed性を維持する。
- D1、R2、KV、環境変数、Secrets、Bindingsをdev/stg/prodで維持し、既存データ、R2キー、公開URLを変更しない。
- 公開ページのSSR/ISR、記事、作品、メタデータ、OGP、sitemap、robots、画像表示に回帰を起こさない。
- `/media` のストリーム、レスポンスヘッダー、条件付きGET、キャッシュ挙動と画像アップロードを維持する。
- dev、stg、prodの順に検証し、各段階でOpenNextへ戻せる状態を保つ。
- テスト、lint、型検査、依存関係監査、Vinext/Cloudflareビルドを成功させる。

### Constraints and Non-goals

- 認証・認可・セッションの仕様、DBスキーマ、公開URL、D1/R2のデータ形式は変更しない。
- 既知の投稿所有権、D1/R2間の原子性、監査ログなど、Vinext移行と無関係な設計課題はこのIssueで修正しない。
- Vinextで不要と実証できるまではNext.js、Sharp、OpenNext関連依存や設定を削除しない。
- OpenNextの出力パスやWrangler設定をVinextへ機械的に流用しない。公式手順と実際の生成物を根拠に決める。
- `compatibility_date` は移行に必要な場合だけ環境ごとに検証し、無関係な一括更新をしない。
- シークレット値、CloudflareのID、個人情報を計画・ログ・PRへ転記しない。
- デプロイと実環境確認はリポジトリ所有者が実施する。実装側は再現可能なコマンド、確認項目、切戻し手順を提供する。

### Assumptions

- デフォルトブランチと全実装フェーズのベースは `main` とする。
- 既存のCloudflareリソース、binding名、Secrets名、カスタムドメインを再利用する。
- Phase 1からPhase 3まではOpenNext経路を並行維持し、本番切替の判断前に削除しない。
- PoCで認証・binding・データ互換性に重大な非互換が見つかった場合、仕様変更で迂回せず後続フェーズを保留する。
- `vinext init` の生成結果はそのまま採用せず、差分を確認してこのリポジトリに必要な最小構成だけを残す。

### Questions

現時点で計画PRを妨げる未決定事項はない。次の項目はPhase 1の実測結果によって決める。

- Auth.jsの `auth()` ラッパーを含む `proxy.ts` がVinext上で変更なしに動作するか。
- 環境別bindingを `cloudflare.config.ts`、Wrangler設定、または両者でどう表現するか。
- `next/image`、Sharp、Cloudflare側の画像最適化を現行挙動のまま維持できるか。
- Vinextの出力物、プレビュー、デプロイコマンドと、既存の環境別設定を接続する最小構成。
- `revalidate = 60` とキャッシュ無効化が現行と同じ観測結果になるか。

## Plan

- [ ] Phase 1: OpenNextを維持したままVinext互換性PoCを確立する
- [ ] Phase 2: 認証、bindings、データ経路、公開表示のVinext回帰を解消する
- [ ] Phase 3: dev/stgのVinext運用経路と切戻しを検証する
- [ ] Phase 4: 本番をVinextへ切り替え、OpenNextを安全に終了する

## Phase Details and Acceptance Criteria

### Phase 1: OpenNextを維持したままVinext互換性PoCを確立する

#### Scope

- 対象バージョンを記録して `vinext check` を実行し、警告・未対応API・設定差分を分類する。
- Cloudflare Workersを対象に `vinext init` の生成差分を確認し、Vinext用の開発・ビルド・ローカル実行経路を既存のNext.js/OpenNext経路と並行して追加する。
- 実際の生成物を確認して、Vinext用設定、bindings型生成、出力物、プレビュー方法を記録する。
- Auth.js、OpenNext固有API、Sharp、画像最適化、ISR、ESM化による既存設定ファイルへの影響をPoC報告に残す。
- このフェーズでは既定のビルド、CI、stg/prodデプロイ経路を切り替えない。

#### Acceptance Criteria

- [ ] 使用したVinext、Cloudflare Vite plugin、Node.jsのバージョンと実行日時が記録されている。
- [ ] `npx vinext check` の全指摘が「対応不要」「Phase 2で対応」「移行阻害」のいずれかに分類されている。
- [ ] Vinext開発サーバー、Cloudflare Workers向け本番ビルド、ローカル実行またはプレビューが成功する。失敗する場合は最小再現と阻害条件が記録され、Phase 2以降は開始されない。
- [ ] Vinextの出力パスとコマンドは実測結果から設定され、`.open-next/*` を流用していない。
- [ ] 既存の `npm run dev`、OpenNextビルド、OpenNextデプロイ用コマンドと設定が残っている。
- [ ] `npm test`、`npm run lint`、`npx tsc --noEmit`、`npm audit`、既存Next.js/OpenNextビルドが移行前と同じ基準で完了する。
- [ ] Phase 1の差分にDBマイグレーション、公開URL変更、stg/prod切替が含まれない。

### Phase 2: 認証、bindings、データ経路、公開表示のVinext回帰を解消する

#### Scope

- OpenNext固有のbinding取得をVinext/Cloudflare Workersでサポートされる方法へ移し、D1とR2をServer Components、Server Actions、Route Handlersから利用できるようにする。
- `proxy.ts` とAuth.jsの統合、OAuth callback、JWTセッション、招待、ログアウトをVinext環境で検証する。
- Issue #3のproxy回帰テストを維持し、Vinext実行時にのみ現れる異常セッションやルーティング差異を必要最小限のテストで補う。
- 記事読取・投稿、画像アップロード、`/media` ストリーム、ETag/304、固定セキュリティヘッダーを検証する。
- 公開ページのSSR/ISR、検索、記事本文、作品、metadata/OGP、sitemap、robots、`next/image` を現行OpenNextと比較する。
- 既存のアプリケーション仕様に関係しないリファクタリングは行わない。

#### Acceptance Criteria

- [ ] Googleログイン・ログアウト、JWTセッション、招待済みユーザー、無効ユーザーの挙動が現行仕様と一致する。
- [ ] 未認証、`null`、userなし、エラー相当の認証結果は `/management` に入れず、正常なユーザーは入れる。
- [ ] 非adminの `/management/admin` は403、adminはアクセス可能である。
- [ ] Server ActionsとRoute Handlersはサーバー側認可を維持し、権限不足と異常入力を拒否する。
- [ ] D1の読取・書込、R2のMarkdown読取・書込、画像アップロード、画像ストリーム、ETag/304が同じbinding名とキー形式で動作する。
- [ ] KVをVinextのキャッシュに使用する場合、既存 `KV_CACHE` のデータやアプリケーションキーと衝突しない名前空間方針が明記される。使用しない場合も未使用であることが記録される。
- [ ] 公開ページ、metadata/OGP、sitemap、robots、画像、`revalidate = 60` の観測結果がOpenNextのベースラインと一致するか、許容する差異が明記される。
- [ ] DBスキーマ、D1マイグレーション、R2キー、公開URL、認証仕様に変更がない。
- [ ] `npm test`、`npm run lint`、`npx tsc --noEmit`、`npm audit`、Vinext/Cloudflareビルドが成功する。

### Phase 3: dev/stgのVinext運用経路と切戻しを検証する

#### Scope

- devとstgについて、既存と同じCloudflareリソース、環境変数名、Secrets名、カスタムドメインを使うVinext設定を整備する。
- devからstgの順で、所有者が実行できるデプロイ・スモークテスト・ログ確認手順を文書化する。
- OpenNextの最後の正常デプロイを特定し、VinextからOpenNextへ戻すコマンドと判断条件を明示する。
- dev/stgで検証済みのコマンドに限ってnpm scriptsとステージングCIを更新する。
- `compatibility_date` の差異は、Vinextが要求する最小値と実環境回帰を根拠に環境ごとに扱う。

#### Acceptance Criteria

- [ ] 所有者がdevへVinextをデプロイし、Phase 2の認証・管理・公開・D1/R2確認項目を実環境で完了している。
- [ ] dev成功後、所有者がstgへVinextをデプロイし、同じ確認項目を完了している。
- [ ] dev/stgのSecrets値をリポジトリやログへ出さず、必要なSecrets名と設定手順だけが文書化されている。
- [ ] D1/R2/KVのbinding先が対象環境の既存リソースと一致し、prodリソースを参照していない。
- [ ] ステージングCIは検証済みのVinextビルド・デプロイ経路を使用し、同じコマンドをローカルでも再現できる。
- [ ] OpenNextへの切戻しをdevまたはstgで実行し、復旧時間、確認結果、判断条件が記録されている。
- [ ] prodのデプロイ設定と稼働中Workerは変更されていない。
- [ ] 全自動テスト、lint、型検査、監査、Vinextビルドに加え、dev/stgの手動回帰結果が記録されている。

### Phase 4: 本番をVinextへ切り替え、OpenNextを安全に終了する

#### Scope

- Phase 3の証跡と未解決事項を確認し、本番切替のgo/no-goを記録する。
- 本番用Vinext設定、デプロイコマンド、スモークテスト、観測、切戻し手順を確定する。
- 所有者による本番デプロイ後、認証、管理、公開表示、D1/R2、画像、メタデータを確認する。
- 安定確認後にだけ、既定のnpm scripts、OpenNext依存、`open-next.config.ts`、OpenNext専用設定・出力参照を整理する。
- READMEと `docs/architecture.md` をVinextの現行構成、コマンド、既知の差異、運用手順に更新する。

#### Acceptance Criteria

- [ ] Phase 1からPhase 3の受け入れ条件が完了し、移行阻害の未解決事項がない。
- [ ] 本番切替前に直前のOpenNextデプロイ、切戻しコマンド、責任者、観測時間、停止条件が記録されている。
- [ ] 所有者が本番へVinextをデプロイし、Google認証、管理画面、記事投稿、画像アップロード、公開記事、`/media`、metadata/OGPを確認している。
- [ ] D1/R2の既存データ、キー、公開URL、OAuth callback URLを変更していない。
- [ ] エラー率、Workerログ、主要レスポンス、認証失敗を定めた観測時間中に確認し、問題時はOpenNextへ切り戻せる。
- [ ] 安定確認前はOpenNext経路を削除せず、削除後も直前のOpenNext commit/refから再デプロイできる。
- [ ] `npm test`、`npm run lint`、`npx tsc --noEmit`、`npm audit`、Vinext/Cloudflare本番ビルドが成功する。
- [ ] READMEと設計文書が、Vinext採用済みというIssue #4の決定と実際の運用コマンドを反映している。

## Risks

- **Beta互換性:** Vinextはbetaで、Next.js 16 APIの完全互換ではない。互換性チェックとPoC結果を後続フェーズの開始条件にする。
- **Auth.js / proxy:** `auth(proxy)` のラッパーとJWTセッションは単体のproxy API対応だけでは保証できない。実際のOAuth callbackと異常セッションを確認する。
- **Binding取得:** `getCloudflareContext()` から `cloudflare:workers` への変更は広いサーバー経路に影響する。D1/R2それぞれの読取・書込と失敗時挙動を検証する。
- **キャッシュ:** VinextのISR/Workers Cache/KVはOpenNextと内部実装が異なる。60秒再検証、更新反映、キャッシュキー衝突を観測する。
- **画像:** Vinextの画像最適化は部分対応で、Sharpなどnative modulesは開発環境に既知の制約がある。表示品質、Content-Type、サイズ、remote imageを比較する。
- **ESM化:** `vinext init` が `type: module` を追加するため、Drizzle、Vitest、PostCSS、ESLint等の設定読み込みに回帰が起こり得る。
- **環境差:** dev/prodとstgの `compatibility_date` が異なる。移行と無関係な同期をせず、必要性と回帰結果を環境別に記録する。
- **自動デプロイ:** main pushでstgへ自動デプロイされるため、CI切替はdev/stgの手動検証と切戻し確認後に行う。
- **生成差分:** `vinext init` はmanifestや設定を自動変更する。生成結果をレビューし、無関係な変更や不要な依存を除外する。
- **既存設計課題:** 投稿所有権やD1/R2整合性などは移行とは別問題であり、同時修正すると回帰原因を分離できないため対象外とする。

## Dependencies

- Issue #3 / PR #5のfail-closed proxyテスト（mainへ反映済み）
- Vinext公式互換性チェックと互換性ダッシュボード
- Cloudflare Workersのdev/stg/prodリソースと環境別Secrets
- Google OAuthのdev/stg/prod callback設定
- リポジトリ所有者によるdev/stg/prodデプロイと手動確認
- 公式資料:
  - https://vinext.dev/
  - https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
  - https://github.com/cloudflare/vinext/blob/main/docs/getting-started/migrating.mdx

## Expected Change Boundary

PoCの実測結果により確定するが、変更候補は次の範囲に限定する。

- `package.json` / `package-lock.json`: Vinext/Vite依存と並行実行スクリプト、最終切替
- `vite.config.ts` / Vinext・Cloudflare設定: Workers実行、bindings、キャッシュ、画像
- `next.config.ts` / `open-next.config.ts`: OpenNext初期化の並行維持と最終整理
- `wrangler.*.jsonc`: 実測した出力・環境別bindingとの接続（必要な場合のみ）
- `lib/db.ts` / `lib/r2.ts` と関連テスト: binding取得方法
- `auth.ts` / `proxy.ts` と認証テスト: 互換性対応が必要な場合のみ
- `app/media/[...key]/route.ts` と画像テスト: ストリーム互換性対応が必要な場合のみ
- `.github/workflows/deploy-stg.yml`: stg検証後のビルド・デプロイ切替
- `README.md` / `docs/architecture.md` / 移行・切戻し記録: 実際の運用と設計判断

DBスキーマ、マイグレーション、コンテンツ、公開URLの変更は想定しない。

## Validation Matrix

| 対象 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
| --- | --- | --- | --- | --- |
| `vinext check` / Vinext build | ローカル | ローカル | dev/stg | prod |
| Next.js/OpenNext回帰 | 維持確認 | 比較基準 | 切戻し確認 | 安定確認まで保持 |
| proxy/Auth.js | 起動確認 | 自動・ローカル統合 | dev/stg実認証 | prod実認証 |
| D1/R2/KV | binding存在 | 読取・書込 | 環境分離 | 既存データ維持 |
| 公開SSR/ISR/SEO | 主要ルート起動 | OpenNext比較 | dev/stgスモーク | prodスモーク |
| `/media` / 画像 | build確認 | ヘッダー・stream・upload | dev/stg実データ | prod実データ |
| 切戻し | 経路保持 | 経路保持 | 実行確認 | 手順待機 |

## Current Phase

Planning complete. Implementation has not started. Next: Phase 1.
