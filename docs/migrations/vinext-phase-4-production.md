# Vinext 移行フェーズ4 本番切替準備

更新日: 2026-10-29

Issue #4と計画PR #6に基づく本番切替手順です。設定の準備と実環境での確認結果を区別します。実デプロイとpushは所有者が行います。

## 現在の判定

所有者からstg環境での確認完了報告を受けました。2026-10-29、管理者の明示的な判断により、切戻しの実機検証を省略してCI切替へ進めます。切戻しは「成功」ではなく「管理者承認により省略」と記録し、手順・旧Worker・OpenNext設定は保持します。

CI設定はVinextへ変更済みで、GitHub Actions上の実行確認待ちです。本番デプロイは未実施のため、Phase 4は継続中です。stg確認の報告は受領していますが、権限別・書き込み等の個別結果はこの会話では明示されていません。

Vinextは画像原本を直接配信します。リサイズ・形式変換は行いません。この差を許容できることも本番切替条件です。Cloudflare Images導入は今回の範囲に含めません。

## 環境と設定

| 項目 | stg | prod |
| --- | --- | --- |
| mode | `stg` | `prod` |
| Vinext Worker | `kmdblog-web-vinext-stg` | `kmdblog-web-vinext-prod` |
| OpenNext Worker（切戻し先） | `kmdblog-web-stg` | `kmdblog-web-prod` |
| Route | `stg.kmdworks.com/*` | `kmdworks.com/*` |
| origin | `https://stg.kmdworks.com` | `https://kmdworks.com` |
| secretファイル | `.dev.vars.stg` | `.dev.vars.prod` |

`cloudflare.config.ts`はmodeごとにWorker、D1、R2、Routeを選択します。D1/R2の名前・IDは既存Wrangler設定と一致させ、作成やmigrationは行いません。stg/prodのworkers.devとプレビューURLは無効です。

**既存設定の注意点:** stg/prodの`KV_CACHE`は同じnamespace IDを参照しています。今回も既存値を維持していますが、完全な環境分離とはいえません。現アプリで未使用のため、Vinextキャッシュadapterは接続しません。KVを使い始める前に分離が必要です。

## stgを先に確認する

1. `.dev.vars.example`を参考に、Git管理外の`.dev.vars.stg`へstg用の認証・メール設定を記入します。`APP_ORIGIN`はstg/prodでは設定ファイルのtext bindingで固定しているため、secretファイルには含めません。
2. Google OAuthクライアントに`https://stg.kmdworks.com/api/auth/callback/google`が登録され、`AUTH_GOOGLE_ID`と一致することを確認します。
3. `npx cf auth whoami`で認証先を確認し、`npm run deploy:vinext:stg:dry-run`を実行します。
4. Dashboardで既存OpenNext Workerから`stg.kmdworks.com/*`のRouteだけを削除し、直後に`npm run deploy:vinext:stg`を実行します。WorkerやDNS、D1/R2は削除しません。切替中は短時間アクセスできなくなる可能性があります。
5. Phase 3文書の確認項目をstgでも実施し、以下の結果を記録します。

| 判定対象 | 必要な確認 | 現在 |
| --- | --- | --- |
| 公開表示 | 記事一覧・本文・作品・画像・スマートフォン表示 | 未確認 |
| SEO | HTMLに本文・canonical・OGP、sitemap/robotsのorigin | 未確認 |
| 認証 | Googleログイン・ログアウト・再ログイン、JWTセッション | 未確認 |
| 認可 | 未認証management拒否、非adminのadmin画面403、admin許可 | 未確認 |
| Server Actions | テスト下書きの作成・更新・削除、画像アップロードと表示 | 未確認 |
| 招待 | テスト宛先への送信・受諾・origin・権限 | 未確認 |
| 配信 | `/media`のContent-Type、ETag/304、キャッシュヘッダー | 未確認 |
| 切戻し | Vinext Route削除→`npm run deploy:stg`→OpenNext確認 | 管理者承認により実機検証を省略 |
| CI | stg確認後に自動デプロイ経路をVinextへ切替・実行確認 | 設定変更済み、GitHub Actions実行待ち |

`.github/workflows/deploy-stg.yml`はNode.js 24でテスト・Lint・Vinextのstgビルドを行い、同じmodeのBuild Outputを`cf deploy --mode stg --prebuilt`でデプロイします。アプリ用secretは手動登録済みのWorkerの値を保持します。GitHub Actionsには従来の`CLOUDFLARE_API_TOKEN`を使用し、ローカルsecretファイルはCIへ渡しません。トークンがVinext Workerとstg Routeを更新できることは実行時に確認します。

所有者がmainへ反映後、Actionsの成功とstgのログイン・記事・画像を確認します。すでにVinextへ移管したRouteを更新するため、再度Routeを削除する必要はありません。

CI変更後のローカル検証では、ワークフローYAMLの読み込み、Node.js 24・stg用コマンドの確認、全47テスト、stgビルドと`cf deploy --mode stg --prebuilt --dry-run`が成功しました。GitHub上のトークン権限と既存secretの引き継ぎは、実際のActions実行後に確認します。

## 本番のGo条件

- 上記のstg確認とCI確認が完了し、未解決の認証・認可・データ書き込み問題がない。
- 原本配信の画像サイズ・表示性能を許容できる。
- 切替直前のD1バックアップ、R2データ保全、現在のOpenNextデプロイとRouteを所有者が確認する。
- OpenNextのコード、依存関係、Wrangler設定、既存secretとWorkerを保持する。切戻しの実機検証は管理者承認により省略し、実行時の問題が未検証であることを受容する。
- `.dev.vars.prod`には本番用の値だけを用意し、OAuth callbackが`https://kmdworks.com/api/auth/callback/google`と一致する。

## 設定準備の検証結果

2026-10-29、ダミーsecretを使い`cf deploy --mode stg/prod --dry-run`をそれぞれ実行して成功しました。生成設定でWorker名、APP_ENV、APP_ORIGIN、D1、R2、Route、workers.dev無効化が各環境に対応することを確認しました。アップロードとRoute変更は行っていません。

全47テスト、ESLint（エラー0・既存警告7件）、Next.js型生成後のTypeScript検査、`git diff --check`が成功し、オンラインの`npm audit`は脆弱性0件でした。実際のstg/prod secret、Cloudflareリソースへのアクセス権、OAuth、デプロイ、CI実行は未確認です。

## 所有者が行う本番切替

1. `npm test`、`npm run lint`、型検査、依存関係監査と`npm run deploy:vinext:prod:dry-run`を実施します。dry-runでは実リソースへの接続や権限は確認できません。
2. Dashboardで`kmdblog-web-prod`から`kmdworks.com/*`のRouteだけを削除します。
3. `npm run deploy:vinext:prod`を実行します。
4. DashboardでRouteがVinextに接続したことを確認し、`/api/health`の`env: "prod"`、公開ページ・画像・ログイン・管理権限・既存記事を確認します。healthだけでは実行基盤を識別できません。
5. Workers Logsで5xx、OAuth callbackエラー、D1/R2エラーを確認します。secret、セッショントークン、個人情報を作業記録へ転記しません。
6. 公開ページと認証を切替直後に確認し、その後24時間を初期観測期間とします。書き込み確認には専用テストデータを使い、所有者が結果を記録します。

## 停止条件と切戻し

ログイン不能、認可の誤許可、記事・画像の取得不能、書き込みの不整合、主要経路の継続的5xxがあれば本番切替を停止します。

1. Dashboardで`kmdblog-web-vinext-prod`から`kmdworks.com/*`のRouteだけを削除します。
2. 保持している同じリビジョンで`npm run deploy:prod`を実行し、OpenNextへRouteを戻します。
3. Route、health、記事、画像、認証を確認します。

部分的なtrigger更新エラーでは成功した変更が残ります。再実行前にRouteの所有Workerを確認します。コードの切戻しはD1/R2への書き込みを戻さないため、データ不整合は別途復旧します。ストレージを削除・初期化しません。

## OpenNext終了の条件

本番の初期観測と書き込み確認が完了し、所有者が安定稼働を確認した後に限り、OpenNext専用依存・facade・設定・スクリプトを整理します。切戻しの実機検証は管理者判断で省略しています。現時点では削除しません。Next.jsの型やSharp等は実際の利用を確認してから判断します。旧Workerの削除は所有者が対象を確認して別途実施します。
