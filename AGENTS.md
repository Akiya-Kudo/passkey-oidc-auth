# passkey-oidc-auth — agent notes

## Layout

- `src/domain` — User / Client / ports（HTTP・AWS 非依存）
- `src/oidc` — `oidc-provider` 設定・ルート定義
- `src/infrastructure` — DynamoDB Adapter / KeyStore / config
- `src/http` — Koa マウント
- `apps/local-server` — ローカル listen 入口
- `apps/lambdas` — API Gateway(v2) → Koa（serverless-http、単一 Lambda）
- `infra/cdk` — 唯一の別 package（HTTP API + Lambda + DynamoDB）

npm パッケージ境界は **root + `infra/cdk` のみ**。論理分割は `src/` のディレクトリ。

## Local

```bash
pnpm install
pnpm dev
# optional DynamoDB Local:
docker compose up -d
# OIDC_TABLE_NAME=passkey-oidc-local DYNAMODB_ENDPOINT=http://localhost:8000 pnpm tables:local
```

## Deploy

```bash
# TODO: CDK_OIDC_ISSUER / COOKIE_KEYS / JWKS を設定してから
pnpm cdk:deploy
```

未確定事項はコード内の `TODO` コメントを参照。
