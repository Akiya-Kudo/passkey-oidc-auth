# Simple Passkey OIDC ID Provider

A learning sample of a lightweight OIDC Provider that authenticates with Passkey (WebAuthn).  
It exposes API Gateway endpoints and a login page so client apps can authenticate via Authorization Code + PKCE.

## Tech Stack


| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Frontend       | React (login / Passkey registration UI) |
| Backend        | AWS Lambda (Node.js)                    |
| API            | Amazon API Gateway                      |
| User Directory | Amazon DynamoDB                         |
| IaC            | AWS CDK                                 |


## Deploy

```bash
pnpm install

# CloudFront のカスタムドメインを issuer にする（例: https://auth.example.com）。
# CloudFront のデフォルトドメインを使う場合は、初回 deploy 後の AuthDistributionUrl を設定して再 deploy する。
export ISSUER=https://auth.example.com
pnpm cdk:deploy
```

主な TODO（Secrets / カスタムドメイン / Passkey UI 等）はコード内コメントを参照。



## Usage

1. Deploy the stack with CDK
2. Check `AuthDistributionUrl` from the stack outputs. All OIDC endpoints and the interaction UI are served through it.
3. Register an OIDC client and use Authorization Code Flow (PKCE): `/authorize` → Passkey login → `/token`

For design details and domain structure, see `[docs/abstract.md](./docs/abstract.md)`.

## Interaction UI

`apps/interaction-ui` is a React/Vite SPA. Its built assets are delivered from a private S3 bucket through CloudFront, while `/api/interactions/*` stays on the Koa Lambda. Both use the issuer origin, so no browser CORS configuration is required.

```bash
pnpm build:interaction-ui
```

The build is included automatically in `pnpm cdk:synth` and `pnpm cdk:deploy`.

## More doc

- Please reffer [docs](./docs/abstract.md)
