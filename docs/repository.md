# 想定 repository 構成

**柔軟に変更する。差分が生じている場合には実際のrepository構成を正としてこのファイルの定義を修正する**

```tree
passkey-oidc-auth/
├─ apps/
│  ├─ local-server/                 # ローカル専用入口（listen のみ）
│  │  └─ src/
│  │     └─ server.ts
│  │
│  └─ lambdas/                      # Lambda 入口（API Gateway → Koa）
│     └─ src/
│        └─ handler.ts              # serverless-http + 単一入口
│
├─ src/                             # 共有ロジック（ディレクトリ境界のみ）
│  ├─ oidc/
│  │  ├─ provider.ts
│  │  ├─ interactions.ts
│  │  ├─ clients.ts
│  │  ├─ keys.ts
│  │  └─ routes.ts
│  ├─ domain/
│  │  ├─ user.ts
│  │  ├─ client.ts
│  │  └─ ports.ts
│  ├─ infrastructure/
│  │  ├─ dynamodb/
│  │  │  ├─ oidc-adapter.ts
│  │  │  ├─ user-repository.ts
│  │  │  └─ client-repository.ts
│  │  ├─ aws/
│  │  │  ├─ key-store.ts
│  │  │  └─ kms-key-store.ts
│  │  └─ config.ts
│  ├─ http/
│  │  ├─ koa.ts
│  │  └─ routes/
│  └─ types/
│     └─ oidc-provider.d.ts
│
├─ infra/
│  └─ cdk/                          # ★ 唯一の別 package.json
│     ├─ bin/
│     │  └─ app.ts
│     └─ lib/
│        └─ idp.ts
│
├─ docker-compose.yml
├─ scripts/
│  └─ create-local-tables.ts
├─ package.json
├─ pnpm-workspace.yaml              # infra/cdk のみ
└─ tsconfig.base.json
```

方針: 論理分割は `src/` のディレクトリ。npm パッケージ境界は root + CDK のみ。
