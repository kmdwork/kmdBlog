# Vinext 移行フェーズ3 dev確認手順

確認日: 2026-10-29

この文書は、Vinext版をdev環境の公開URLへ切り替えて確認する手順です。実際のデプロイ操作は作業者が行います。

## 配置方針

| 項目 | OpenNext（現行） | Vinext（確認用） |
| --- | --- | --- |
| Worker | `kmdblog-web-dev` | `kmdblog-web-vinext-dev` |
| URL | 切り替え前の`dev.kmdworks.com` | 切り替え後の`dev.kmdworks.com`とworkers.dev URL |
| D1 / R2 / KV | devリソース | 同じdevリソースを共有 |
| Worker Route | 切り替え前に接続 | 切り替え後に接続 |

Vinext版は別Worker名のまま、`dev.kmdworks.com/*`のWorker RouteだけをOpenNextからVinextへ切り替えます。OpenNext Workerは削除しませんが、切り替え中の`dev.kmdworks.com`はVinext版を表示します。データはdev環境と共有するため、最初は読み取り確認だけを行ってください。

workers.dev URLも引き続き公開されます。ただし、OAuthとURL生成の確認には`dev.kmdworks.com`を使用してください。

## 1. secretファイルを準備する

`.dev.vars.example`のキーを、Git管理外の`web/.dev.vars.dev`へ設定します。実値をIssue、PR、ログ、コミットへ記録しないでください。

`APP_ORIGIN`には`https://dev.kmdworks.com`を指定します。末尾のスラッシュは不要です。

必要なキー:

- `APP_ORIGIN`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `OWNER_EMAIL`
- `RESEND_API_KEY`
- `MAIL_FROM`

`.dev.vars.dev`は`.gitignore`の対象です。

## 2. Google OAuthを準備する

Google OAuthクライアントの承認済みリダイレクトURIに、次が登録されていることを確認します。

```text
https://dev.kmdworks.com/api/auth/callback/google
```

`.dev.vars.dev`の`AUTH_GOOGLE_ID`が、この設定を行ったOAuthクライアントのIDと一致することも確認します。Auth.jsのGoogleログインはサーバー側フローのため、承認済みJavaScript生成元の追加は必須ではありません。

## 3. デプロイ前検証

次のコマンドはWorkerをアップロードしません。

```bash
npm ci
npm run cf-typegen:vinext:dev
npm test
npm run lint
npm run deploy:vinext:dev:dry-run
```

dry-runはビルドとパッケージングを確認します。Cloudflare上のリソースやsecretの実在、OAuth動作までは確認しません。

2026-10-29時点で、ダミーsecretを使用したdry-runは成功しています。dev用のD1、R2、KVとsecret名が解決され、Workerはアップロードされていません。パッケージサイズは3,020.99 KiB（gzip 1,092.08 KiB）でした。dry-run単体では、実際のsecret、OAuth、リモートリソースへの接続までは確認できません。

## workers.devでの先行確認結果

Route切り替え前のworkers.dev URLでは、D1の記事情報とR2の記事本文を読み取れることを確認しました。R2画像も、存在する同じキーがOpenNextとVinextの両方で200、存在しない同じキーが両方で404になったため、R2バインディングと`/media/*`経路は動作しています。

Route切り替え後、R2の直接画像URLは200でしたが、記事画像とGoogleアカウント画像が共通して使用する`/_next/image`は400を返しました。Cloudflare Images optimizerをまだ構成していないため、Vinextビルドだけ`images.unoptimized`を有効にして原本を直接配信します。OpenNextの画像最適化は維持されます。

この対応ではVinext上のリサイズと画像形式変換を行いません。移行可否の確認を優先した暫定対応であり、Vinextを正式採用する場合はCloudflare Images bindingと`imagesOptimizer()`の導入を別途判断します。

Google OAuthはworkers.dev URLで`redirect_uri_mismatch`になりました。Route切り替え後は、既存の`https://dev.kmdworks.com/api/auth/callback/google`を使用して再確認します。

### dev環境での解決結果（2026-10-29）

- 所有者が`dev.kmdworks.com`でGoogleログイン、記事情報、記事本文の表示を確認しました。
- 記事画像とアカウントアイコンが表示されない問題を再確認しました。R2の原本は200でしたが、`/_next/image`は`Invalid image optimization parameters`で400を返していました。許可済みのdevドメインでも発生したため、ホスト許可リストだけが原因という当初の判断は不十分でした。
- `next.config.ts`でVinextビルド時のみ`images.unoptimized`を有効にしました。原本の直接配信に変更して再デプロイ後、所有者から画像表示の復旧報告を受けました。新しい画像最適化サービスやbindingは追加していません。
- 同一Routeの競合（10020）は、既存WorkerからRouteだけを削除してVinextへ割り当てる手順で対応します。Worker本体とデータは保持します。

devの主要表示とログインは確認済みです。ログアウト、非管理者の拒否、記事の作成・更新・削除、招待メール、切戻しの実施結果は個別の報告がないため未確認です。計画PR #6のPhase 3にはstg確認とCIも含まれ、devの画像復旧だけではPhase 3全体の完了にはなりません。stgと本番の手順・判定条件は[Phase 4手順](vinext-phase-4-production.md)に記録します。

## 4. dev確認用Workerをデプロイする

Cloudflareでは同じRouteパターンを2つのWorkerへ同時に割り当てられません。先にCloudflare Dashboardで`kmdblog-web-dev`の「Domains & Routes」から、`dev.kmdworks.com/*`のRouteだけを削除します。Worker本体、D1、R2、KV、secretは削除しません。

Route削除後から次のデプロイが完了するまで、`dev.kmdworks.com`には短時間アクセスできなくなる可能性があります。削除対象が`kmdblog-web-dev`に割り当てられた`dev.kmdworks.com/*`であることを確認してから操作してください。

続いて次のコマンドを実行します。Vinext Workerをデプロイし、空いた`dev.kmdworks.com/*`のRouteを割り当てます。

```bash
npm run deploy:vinext:dev
```

このコマンドは`.dev.vars.dev`で宣言した値を、デプロイするWorker Versionのsecretとして送信します。デプロイ後の確認は`https://dev.kmdworks.com`で行います。

RouteがOpenNextに残ったまま実行すると、Cloudflare APIのエラー10020でRoute設定だけが失敗します。この場合、VinextのWorker Versionやsecretなど先に成功した変更は残る可能性がありますが、`dev.kmdworks.com/*`はOpenNextのままです。OpenNext Workerを削除せず、上記のRouteだけを削除して同じデプロイコマンドを再実行します。

## 5. 確認順序

最初は書き込みを行わず、次を確認します。

1. `/api/health`が200で`env: "dev"`を返す
2. `/terms`、`/about`が表示される
3. `/posts`、`/works`が既存devデータを読み取れる
4. 既存画像が`/media/*`から表示される
5. 未認証の`/management`が`/login`へ移動する
6. Googleログイン・ログアウトが成功する
7. admin / editorの管理画面表示と権限が現行devと一致する

読み取りと認証が確認できた後に限り、テスト用データで次を確認します。

1. 下書き記事の作成・更新・削除
2. Markdown本文のR2保存・取得
3. 画像アップロードと表示
4. 招待メールのURLが`https://dev.kmdworks.com`を指す

本番相当データや復旧できないデータを検証に使用しないでください。

## 6. 問題があった場合

問題があれば、最初にCloudflare Dashboardで`kmdblog-web-vinext-dev`から`dev.kmdworks.com/*`のRouteだけを削除します。続いて次の既存コマンドでOpenNext版を再デプロイし、空いたRouteを`kmdblog-web-dev`へ戻します。

```bash
npm run deploy:dev
```

ロールバック後、`https://dev.kmdworks.com/api/health`と主要ページを確認してください。Vinext Workerの削除やOpenNext Worker自体のバージョンロールバックではなく、Routeをいったん外して既存OpenNext設定を再デプロイする手順です。

Worker削除やsecret削除はこの手順に含めません。削除が必要な場合は、対象Worker名を再確認してから別途実施します。

## 次の判定

上記が完了したら、結果を次の3区分で記録します。

- 一致: OpenNext devと同じ挙動
- 差異あり: 移行前に修正または仕様判断が必要
- 未確認: 外部設定やテストデータ不足で確認できない

Google OAuth、認可、D1/R2の読み書きに未解決の差異がある場合、stgへ進みません。

2026-10-29追記: 所有者からstg環境での確認報告を受領しました。切戻しの実機検証は管理者承認により省略し、stgのCIをVinextへ変更しました。省略した検証を成功扱いにはせず、GitHub Actions上の実行結果を次に確認します。
