# Vinext 移行フェーズ2 互換性レポート

確認日: 2026-10-29

この文書は Issue #4 のフェーズ2として、Cloudflare bindings と Auth.js を現行OpenNext経路と共存させた結果を記録します。各環境へのデプロイや実リソースを使うOAuth確認はフェーズ3以降の対象です。

## 結論

- **確認済み:** D1とR2はVinext Workerからネイティブな `cloudflare:workers` bindingsとして参照できました。
- **確認済み:** Auth.jsのsession、providers、CSRF routeはダミーのローカル設定で200を返しました。
- **確認済み:** 未認証の管理画面アクセスは従来どおりログイン画面へ302でリダイレクトされました。
- **確認済み:** Next.js内部モジュールへの依存を公開APIへ置換し、Vinext静的互換性は87%から92%へ改善しました。
- **継続課題:** `vinext check` は `next-auth` を非互換として静的判定します。基礎routeの実行は確認できましたが、Google OAuthの往復、DBを使うコールバック、ロールを含むセッション更新は実環境での確認が必要です。

## 実行基盤の共存方法

アプリケーションのD1/R2処理は `lib/cloudflare-env.ts` を共通の入口として使います。

- Next.js / OpenNext: `getCloudflareContext()` からbindingsを取得
- Vinext: Vite aliasにより `lib/cloudflare-env.vinext.ts` を解決し、`cloudflare:workers` の `env` からbindingsを取得

この分離により、データアクセスや認証ロジックへ実行基盤の条件分岐を広げず、現行OpenNextの挙動を維持します。

## PoC bindings

`cloudflare.config.ts` に次のbinding宣言を追加しました。

| binding | 種別 | ローカル確認 |
| --- | --- | --- |
| `DB` | D1 | クエリがローカルD1へ到達。未適用DBでは `no such table` になることを確認 |
| `R2_POSTS` | R2 | Workerへ注入 |
| `R2_IMAGES` | R2 | 存在しないキーが404になり、binding不在の500が解消 |
| `APP_ENV` | text | health APIが `vinext-poc` を返す |
| `APP_ORIGIN` | text | PoCローカルURL |
| 認証・メール設定 | secret | 値を設定した場合だけWorkerへ注入 |

実リソースIDやsecret値は設定・文書へ追加していません。ローカルsecretは `.dev.vars.example` をコピーしてGit管理外の `.dev.vars` または `.dev.vars.production` に設定します。

## Auth.js 実行確認

実値ではないローカル専用のダミー設定を使用し、ビルド済みVinext Workerで確認しました。

| パス | HTTP | 結果 |
| --- | ---: | --- |
| `/api/auth/session` | 200 | 未認証セッションとして `null` |
| `/api/auth/providers` | 200 | Google provider設定を返す |
| `/api/auth/csrf` | 200 | CSRF tokenを生成 |
| `/management` | 302 | `/login?from=%2Fmanagement` へリダイレクト |

これらはAuth.jsの基本routeとproxyがVinext上で実行できる証拠です。一方、外部Google OAuth、招待照合、初回ユーザー作成、JWTへのロール反映まではローカルダミー設定では確認していません。

## Next.js内部API依存

招待Server Actionは、内部モジュールの `isRedirectError` ではなく、`next/navigation` の公開API `unstable_rethrow` を使用するよう変更しました。redirect等のフレームワーク制御例外を再送出する従来の挙動は維持します。

この変更により `vinext check` の内部import問題は解消し、結果は次のとおりです。

- 92% compatible
- 対応 16
- 部分対応 1（画像最適化）
- 要対応 1（`next-auth` の静的判定）

## 検証結果

| コマンド・確認 | 結果 |
| --- | --- |
| `npx vinext check` | 成功、92% compatible |
| `npm run build:vinext` | 成功 |
| `npm run build` | 成功、既知の `getCloudflareContext()` 警告あり |
| `npx opennextjs-cloudflare build --config wrangler.dev.jsonc` | 成功、既知の警告あり |
| `npm test` | 47件成功 |
| `npm run lint` | エラーなし、既存警告7件 |
| `npx tsc --noEmit` | 成功 |
| `npx drizzle-kit check` | 成功 |
| `npm audit` | 既知の脆弱性0件 |

## フェーズ3へ送る確認

1. ローカルまたは開発環境D1へmigrationを適用し、記事・作品・ユーザー照会を確認する。
2. 開発環境のsecretをWorkerへ設定し、Google OAuthのログイン・コールバック・ログアウトを確認する。
3. admin / editor / 未認証でproxyとServer Actionの認可結果を比較する。
4. R2のMarkdown取得、画像取得・アップロードを実リソースまたは移行用ローカルデータで確認する。
5. 画像最適化を設定しない場合の表示・キャッシュ差を確認する。

Auth.jsの基本routeが動いたことだけを根拠に、認証ライブラリの変更や移行完了とは判断しません。
