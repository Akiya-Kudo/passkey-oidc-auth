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

Infrastructure is defined as CDK templates. The stack is expected to provision API Gateway, Lambda, DynamoDB, and resources for serving the login page.

```bash
# Install dependencies (from the monorepo root)
pnpm install

# Deploy with CDK (after implementation)
pnpm --filter passkey-oidc-auth cdk deploy
```



## Usage

1. Deploy the stack with CDK
2. Check the API Gateway URL / login page URL from the stack outputs
3. Register an OIDC client and use Authorization Code Flow (PKCE): `/authorize` → Passkey login → `/token`

For design details and domain structure, see `[docs/abstract.md](./docs/abstract.md)`.

## More doc

- Please reffer [docs](./docs/abstract.md)