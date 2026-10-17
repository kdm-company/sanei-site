# 株式会社サンエイ コーポレートサイト（sanei-barrel.jp）

金属バレル加工・表面処理加工の株式会社サンエイ（東大阪市）の公式サイト。静的 HTML/CSS。

- 本番ドメイン：https://sanei-barrel.jp/（エックスサーバー（Xserverドメイン）で取得。DNS は Cloudflare：ネームサーバー fred / lucy.ns.cloudflare.com、2026-10-17 にゾーン追加）
- ドメインは Worker の**カスタムドメイン**（`wrangler.jsonc` の `routes`）で受ける。`sanei-barrel.jp` と `www.sanei-barrel.jp`。DNS レコードは Cloudflare が自動で作るので手で消さない。Always Use HTTPS はオン
- workers.dev の URL は無効（本番ドメインのみ）
- ホスティング：Cloudflare Workers `sanei-site`（KDM アカウント）。設定は `wrangler.jsonc`
- **デプロイは手元から `npx wrangler@4 deploy`**（Git 連携なし）。GitHub は `kdm-company/sanei-site`（push は kdm-company アカウントで）
- 4ページ構成：TOP / バレル加工について（`barrel/`）/ 会社概要（`company/`）/ お問い合わせ（`contact/`）＋ プライバシーポリシー（`privacy/`、noindex）
- お問い合わせフォームはなし（電話とメールの案内）

## `_worker.js` がしていること

- `www.sanei-barrel.jp` → `sanei-barrel.jp` へ 301
- `.md`・`scripts/`・`差し替え写真/`・設定ファイルなど公開しないパスは 404（アップロード対象からも `.assetsignore` で除外）
- `/assets/note-feed.json`：note（https://note.com/sanei_barrel/rss）の最新3件をその場で取得して返す（1時間キャッシュ）。トップの「NEWS / NOTE」が `assets/note-feed.js` で表示する。note に届かないときはリポジトリの `assets/note-feed.json`（控え）を返す

## 更新のしかた

1. HTML/CSS/画像を直す（写真は WebP、`assets/photos/`）
2. `npx wrangler@4 deploy`
3. ページを追加・削除したら `sitemap.xml` も直す

写真の差し替えは `差し替え写真/` に元写真を置いて作業する（git・公開の対象外）。

## 旧確認用 URL

公開前のクライアント確認には GitHub Pages（https://kdm-company.github.io/sanei-site/）を使っていた。`.github/workflows/pages.yml` が main への push で更新する。
