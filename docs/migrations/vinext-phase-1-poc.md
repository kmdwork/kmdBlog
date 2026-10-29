# Vinext 移行フェーズ1 PoC レポート

確認日: 2026-10-29

この文書は Issue #4 のフェーズ1として、現行 OpenNext 経路を維持したまま Vinext の互換性とビルド可否を確認した記録です。Vinext の採用決定や各環境へのデプロイを示すものではありません。

## 結論

- **確認済み:** Vinext の静的チェックと Cloudflare Workers 向けビルドは完了し、生成した Worker をローカル起動できました。
- **確認済み:** 固定ページ、health API、未認証の管理画面リダイレクトはローカル Worker で応答しました。
- **未完了:** D1、R2、Auth.js の実行に必要な bindings と secret は Vinext 設定へまだ移していません。データ参照画面、メディア、Auth.js API はこの状態では動作しません。
- **判断:** フェーズ2へ進む前に、Auth.js 互換性と Cloudflare コンテキスト取得方法を解決する必要があります。認証仕様の変更はこの PoC の範囲外です。
- **継続:** 既存の OpenNext、Wrangler 設定、デプロイスクリプトは削除・置換していません。

## 検証環境

| 項目 | 確認値 |
| --- | --- |
| Node.js | 24.22.1 |
| npm | 11.19.1 |
| Next.js | 16.4.3 |
| Vinext | 1.4.0 |
| `@vinext/cloudflare` | 1.3.0 |
| Vite | 8.3.5 |
| `@cloudflare/vite-plugin` | 2.0.0-beta.v.7 |
| `cf` | 1.0.0-beta.25 |
| React / React DOM | 19.3.1 |

`vinext init` が要求する peer dependency に合わせ、React と React DOM は 19.2.6 から 19.3.1 へ更新しました。

## 互換性チェック

`npx vinext check` の結果は 87% compatible（対応 16、部分対応 1、要対応 2）でした。

| 判定 | 対象 | 対応方針 |
| --- | --- | --- |
| 要対応 | `lib/actions/invites.ts` の `next/dist/client/components/redirect-error` | Next.js の内部モジュールへの依存を、公開APIで表現できる処理へフェーズ2で置換する |
| 要対応 | `next-auth` | 現行 Auth.js の認証仕様を維持できるか実行検証する。互換性を確認できるまで移行判断を進めない |
| 部分対応 | `next/image` | `remotePatterns` は利用できるが、画像最適化基盤は別途必要。フェーズ2以降で現行挙動と比較する |

チェックが示した `next-auth` の代替候補へ、このPoCだけを根拠に変更はしません。認証方式の変更は利用者・セッション・運用に影響する別の設計判断です。

## 追加したPoC構成

- `vite.config.ts`: Vinext と Cloudflare Vite plugin を組み合わせる設定
- `cloudflare.config.ts`: 本番環境名と衝突しない `kmdblog-web-vinext-poc` という Worker 名、静的アセット binding のみを持つ設定
- npm scripts: `dev:vinext`、`build:vinext`、`start:vinext`、`deploy:vinext`
- `.gitignore`: Vinext / Vite / Cloudflare のローカル生成物

`next.config.ts` は Vinext ビルド時だけ OpenNext の開発初期化を行わないようにしました。これがない場合、Vinext ビルド完了後も OpenNext の開発用リソースが残ってプロセスが終了しません。通常の Next.js / OpenNext 実行では従来どおり初期化します。

## ビルドとローカル実行

`npm run build:vinext` は成功し、`.cloudflare/output/v0` に Worker 出力を生成しました。`npm run start:vinext` でその出力をローカル起動し、次の応答を確認しました。

| パス | HTTP | 結果 |
| --- | ---: | --- |
| `/api/health` | 200 | 応答 |
| `/terms` | 200 | 固定ページを表示 |
| `/management` | 302 | `/login?from=%2Fmanagement` へリダイレクト |
| `/` | 200 | ページは応答するが、DB binding 不在のエラーをログ出力 |
| `/posts` | 500 | `DB` binding が未接続 |
| `/works` | 500 | `DB` binding が未接続 |
| `/api/auth/session` | 500 | `AUTH_SECRET` がVinext Workerへ未接続 |
| `/media/not-found.webp` | 500 | `R2_IMAGES` binding が未接続 |

この結果はアプリケーション互換性が完了したことを意味しません。フェーズ1では、Worker出力と最小ルーティングが動く地点までを確認しています。

## 既知の警告と制約

- ビルド中に Vinext / React Server Components plugin 由来の sourcemap 警告があります。
- 一部の dynamic import が同時に static import されている旨の警告があります。
- 500 KiB を超えるクライアント chunk があります。
- 複数ルートの分類が `Unknown` と表示されます。
- `cf workers types` は型ファイルを生成しましたが、sandbox から Cloudflare telemetry 保存先へ書き込めない警告を出しました。型生成自体は成功しています。
- 既存の Next.js / OpenNext ビルドでは、同期版 `getCloudflareContext()` をビルド時に呼ぶ警告と、`wrangler.dev.jsonc` の `compatibility_date` が古いという警告が引き続き出ます。このPoCでは既存経路の挙動を変えないため修正していません。

これらはフェーズ1のビルド阻害要因ではありません。ルーティング・キャッシュ・出力サイズに影響する警告は、実データを使うフェーズ2以降で挙動を確認します。

## 検証結果

| コマンド | 結果 |
| --- | --- |
| `npx vinext check` | 成功、87% compatible |
| `npm run build:vinext` | 成功 |
| `npm run build` | 成功、既知の `getCloudflareContext()` 警告あり |
| `npx opennextjs-cloudflare build --config wrangler.dev.jsonc` | 成功、既知の警告あり |
| `npm test` | 45件成功 |
| `npm run lint` | エラーなし、既存警告7件 |
| `npx tsc --noEmit` | 成功 |
| `npx drizzle-kit check` | 成功 |
| `npm audit` | 既知の脆弱性0件 |

## フェーズ2へ進む条件

1. `getCloudflareContext()` に依存する D1 / R2 アクセスを、Vinextでも利用できる Cloudflare bindings 取得方法へ切り替える。
2. `AUTH_SECRET`、OAuth、メール等の変数を値をリポジトリへ保存せずVinext Workerへ渡す。
3. Auth.js のログイン、セッション、proxy、ロール判定が現行仕様のまま動くことを確認する。
4. Next.js 内部モジュールへの依存を除去する。
5. 画像表示とキャッシュ・最適化の差を確認する。

各環境の実リソースID、secret、デプロイ操作はこのレポートおよびPoC設定に含めません。
