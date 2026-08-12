想定 repository 構成

**柔軟に変更する。差分が生じている場合には実際のrepository構成を正としてこのファイルの定義を修正する**

```
idp/
├─ apps/
│  ├─ local-server/                 # ローカル専用: Koaで全ルートを公開
│  │  └─ src/
│  │     └─ server.ts
│  │
│  └─ lambdas/                      # 本番専用: Lambda入口（薄く保つ）
│     └─ src/
│        ├─ authorization.ts        # /authorize, /interaction/*
│        ├─ token.ts                # /token, /userinfo, /revocation
│        └─ metadata.ts             # /.well-known/*, /jwks
│
├─ packages/
│  ├─ oidc/                         # IdPの中核
│  │  └─ src/
│  │     ├─ provider.ts             # Provider生成・共通設定
│  │     ├─ interactions.ts         # login / consent
│  │     ├─ clients.ts              # OIDC Client登録・検証
│  │     ├─ keys.ts                 # JWKS署名鍵の取得インターフェース
│  │     └─ routes.ts               # endpoint群と用途の定義
│  │
│  ├─ application/                  # ユースケース
│  │  └─ src/
│  │     ├─ authenticate-user.ts
│  │     ├─ register-client.ts
│  │     └─ manage-session.ts
│  │
│  ├─ domain/                       # AWSやHTTPに依存しない型・ルール
│  │  └─ src/
│  │     ├─ user.ts
│  │     ├─ client.ts
│  │     └─ ports.ts                # UserRepository / OidcAdapter等のIF
│  │
│  ├─ infrastructure/               # 実装差し替え箇所
│  │  └─ src/
│  │     ├─ dynamodb/
│  │     │  ├─ oidc-adapter.ts      # node-oidc-provider Adapter
│  │     │  ├─ user-repository.ts
│  │     │  └─ client-repository.ts
│  │     ├─ aws/
│  │     │  └─ kms-key-store.ts
│  │     └─ config.ts
│  │
│  └─ http/                         # HTTPフレームワーク境界
│     └─ src/
│        ├─ koa.ts                  # Koaへのマウント
│        └─ apigateway.ts           # API Gateway v2 → Node HTTP変換
│
├─ infra/
│  └─ cdk/
│     ├─ bin/
│     └─ lib/
│        ├─ idp-stack.ts            # HTTP API, Lambda, DynamoDB, IAM
│        └─ routes.ts               # API Gatewayルーティング定義
│
├─ docker-compose.yml                # DynamoDB Local
├─ scripts/
│  ├─ create-local-tables.ts
│  └─ seed-local.ts
├─ tests/
│  ├─ unit/
│  ├─ integration/                  # DynamoDB Localを利用
│  └─ e2e/                          # Playwright: login/redirect/cookie
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.base.json
```