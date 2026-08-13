# Passkey + OIDC Identity Sample

## 1. Overview

本プロジェクトでは、**Passkey（WebAuthn）を認証方式として利用する簡易的なOIDC Provider**を、Next.jsを中心に実装する。
学習用に認証フローをスクラッチで実装するが、本番で運用するとなった場合には既存Idaasに差し替え可能にするため、module化を行う

目的は、以下の認証技術の関係を実装を通して理解することである。

* WebAuthn / Passkey
* Authentication / Authorization
* Session
* OAuth 2.0 Authorization Code Flow
* PKCE
* OpenID Connect
* ID Token / Access Token
* JWT / JWKS
* OIDC Discovery
* DynamoDBによる認証情報の永続化

本プロジェクトは**学習用Sample**であり、本番サービスの認証基盤として直接利用することは想定しない。

## Stacks

[panva/node-oidc-provider: OpenID Certified™ OAuth 2.0 Authorization Server implementation for Node.js](https://github.com/panva/node-oidc-provider)
[MasterKale/SimpleWebAuthn: WebAuthn, Simplified. A collection of TypeScript-first libraries for simpler WebAuthn integration. Supports modern browsers, Node, Deno, and more.](https://github.com/MasterKale/SimpleWebAuthn)
- api route
- dynamodb

---

# 2. Goals

## 2.1 Functional Goals

以下の機能を実装する。

### Passkey

* Passkey登録
* Passkeyログイン
* Credential管理
* Challenge管理
* WebAuthn署名検証

### Session

* Passkeyログイン後のSession生成
* Session Cookieによるログイン状態管理
* Logout

### OIDC Provider

* OIDC Discovery
* Authorization Endpoint
* Token Endpoint
* UserInfo Endpoint
* JWKS Endpoint
* Authorization Code
* PKCE
* ID Token
* Access Token

### Client

最初のClientとしてNext.jsアプリ自身を利用する。

将来的には、

* Native App
* 別のWebアプリ
* 外部サービス

からOIDC Providerを利用できる構造を想定する。

---

# 3. Non Goals

最初のSampleでは以下を対象外とする。

* Google / Apple等の外部IdP連携
* Password Authentication
* MFA
* Refresh Token
* Dynamic Client Registration
* Consent画面の高度な実装
* 複数Tenant
* RBAC
* 本番レベルのAccount Recovery
* 高度なSecurity Policy
* 完全なOIDC Certification対応

---

# 4. Architecture

## 4.1 Initial Architecture

API Gatewayは使用せず、Next.jsのRoute HandlerをHTTP APIとして利用する。

```text
                        Browser
                           │
                           ▼
                    ┌─────────────┐
                    │   Next.js   │
                    │             │
                    │ Route       │
                    │ Handlers     │
                    └──────┬──────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
         Passkey          OIDC        Session
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                    Identity Core
                           │
                           ▼
                       DynamoDB
```

---

# 5. Domain Structure

認証方式そのものではなく、**Identityを中心としたDomain**として設計する。

```text
Identity
│
├── User
│
├── Credential
│   └── Passkey
│
├── Session
│
├── Challenge
│
├── OAuth Client
│
├── Authorization Code
│
└── Token
```

PasskeyはIdentityそのものではなく、Userに紐づくCredentialの一種として扱う。

```text
User
 │
 ├── Credential
 │      └── Passkey
 │
 └── Session
```

---

# 6. Authentication / Authorization

AuthenticationとAuthorizationを分離する。

## Authentication

```text
「このユーザーは誰か？」
```

担当するもの：

* Passkey
* Session
* Credential
* Challenge

## Authorization

```text
「このClientがこのUserの情報へアクセスしてよいか？」
```

担当するもの：

* OAuth Client
* Scope
* Authorization Code
* Access Token

---

# 7. Package Structure

最初は1つのNext.jsアプリケーションとして実装する。

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── passkey/
│   │   │       ├── register/
│   │   │       │   ├── options/
│   │   │       │   │   └── route.ts
│   │   │       │   └── verify/
│   │   │       │       └── route.ts
│   │   │       │
│   │   │       └── login/
│   │   │           ├── options/
│   │   │           │   └── route.ts
│   │   │           └── verify/
│   │   │               └── route.ts
│   │   │
│   │   └── oidc/
│   │       ├── authorize/
│   │       │   └── route.ts
│   │       ├── token/
│   │       │   └── route.ts
│   │       └── userinfo/
│   │           └── route.ts
│   │
│   └── .well-known/
│       ├── openid-configuration/
│       │   └── route.ts
│       └── jwks.json/
│           └── route.ts
│
├── domain/
│   ├── user/
│   ├── credential/
│   ├── session/
│   ├── challenge/
│   ├── oauth-client/
│   ├── authorization-code/
│   └── token/
│
├── application/
│   ├── authentication/
│   ├── authorization/
│   ├── oidc/
│   └── session/
│
├── infrastructure/
│   ├── dynamodb/
│   ├── webauthn/
│   └── jwt/
│
└── lib/
    └── config/
```

---

# 8. Passkey API

## 8.1 Registration Options

```http
POST /api/auth/passkey/register/options
```

目的：

* WebAuthn Registration Challengeを生成
* ClientへPublicKeyCredentialCreationOptionsを返す

処理：

```text
Request
  ↓
User取得
  ↓
Challenge生成
  ↓
DynamoDBへ保存
  ↓
WebAuthn Registration Options生成
  ↓
Response
```

---

# 9. Passkey Registration Verification

```http
POST /api/auth/passkey/register/verify
```

Clientから送信されたCredentialを検証する。

```text
Browser
  │
  │ navigator.credentials.create()
  ▼
Credential
  │
  ▼
POST /register/verify
  │
  ├── Challenge検証
  ├── Origin検証
  ├── RP ID検証
  ├── Attestation検証
  └── Public Key取得
  │
  ▼
Credential保存
```

保存する主な情報：

```text
credentialId
userId
publicKey
counter
transports
createdAt
```

---

# 10. Passkey Authentication Options

```http
POST /api/auth/passkey/login/options
```

処理：

```text
Challenge生成
      ↓
DynamoDB保存
      ↓
WebAuthn Authentication Options生成
      ↓
Clientへ返却
```

---

# 11. Passkey Authentication Verification

```http
POST /api/auth/passkey/login/verify
```

処理：

```text
Browser
   │
   │ navigator.credentials.get()
   ▼
Assertion
   │
   ▼
/login/verify
   │
   ├── Challenge検証
   ├── Origin検証
   ├── RP ID検証
   ├── Signature検証
   └── Counter検証
   │
   ▼
User特定
   │
   ▼
Session発行
```

---

# 12. Session

Passkey認証成功後、Sessionを生成する。

```text
Session
├── sessionId
├── userId
├── expiresAt
└── createdAt
```

BrowserにはHttpOnly CookieとしてSession IDを設定する。

```http
Set-Cookie:
  session=...
  HttpOnly
  Secure
  SameSite=Lax
```

Application側では、

```text
Cookie
 ↓
SessionRepository
 ↓
User
```

によってUserを取得する。

---

# 13. OIDC Architecture

OIDC Providerとして以下のEndpointを提供する。

```text
GET  /.well-known/openid-configuration
GET  /.well-known/jwks.json

GET  /api/oidc/authorize
POST /api/oidc/token
GET  /api/oidc/userinfo
```

---

# 14. OIDC Discovery

```http
GET /.well-known/openid-configuration
```

Response例：

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/api/oidc/authorize",
  "token_endpoint": "https://auth.example.com/api/oidc/token",
  "userinfo_endpoint": "https://auth.example.com/api/oidc/userinfo",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile"],
  "code_challenge_methods_supported": ["S256"]
}
```

---

# 15. Authorization Endpoint

```http
GET /api/oidc/authorize
```

受け取る主なParameter：

```text
client_id
redirect_uri
response_type
scope
state
nonce
code_challenge
code_challenge_method
```

基本フロー：

```text
Client
  │
  │ /authorize
  ▼
OIDC Provider
  │
  │ User Session確認
  ▼
Authenticated?
  │
  ├── No
  │    ↓
  │  Login UI
  │    ↓
  │  Passkey
  │
  └── Yes
       ↓
Authorization Code生成
       ↓
redirect_uri
```

---

# 16. Authorization Code

Authorization Codeは短期間のみ有効な一回限りのCredentialとする。

```text
AuthorizationCode
├── code
├── clientId
├── userId
├── redirectUri
├── scope
├── nonce
├── codeChallenge
├── expiresAt
└── consumedAt
```

Token Endpointで一度使用されたCodeは再利用できない。

---

# 17. Token Endpoint

```http
POST /api/oidc/token
```

Clientから、

```text
grant_type
code
redirect_uri
client_id
code_verifier
```

を受け取る。

処理：

```text
Authorization Code取得
        ↓
Expiration確認
        ↓
Client確認
        ↓
redirect_uri確認
        ↓
PKCE検証
        ↓
CodeをConsume
        ↓
ID Token生成
        ↓
Access Token生成
```

Response：

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "..."
}
```

---

# 18. ID Token

JWTとして発行する。

Payload例：

```json
{
  "iss": "https://auth.example.com",
  "sub": "user-id",
  "aud": "client-id",
  "exp": 1234567890,
  "iat": 1234567890,
  "nonce": "..."
}
```

署名には非対称鍵を使用する。

```text
Private Key
    │
    ▼
ID Token signing

Public Key
    │
    ▼
JWKS Endpoint
```

---

# 19. JWKS

```http
GET /.well-known/jwks.json
```

OIDC ClientやResource ServerがID Token / JWTを検証するための公開鍵を提供する。

鍵管理：

```text
Private Key
    ↓
Secrets Manager
```

公開鍵：

```text
JWKS
```

鍵ローテーションを考慮して複数のKeyを保持できる設計にする。

---

# 20. UserInfo

```http
GET /api/oidc/userinfo
Authorization: Bearer <access_token>
```

Access TokenからUserを特定し、scopeに応じた情報を返す。

```json
{
  "sub": "user-id",
  "name": "User",
  "email": "user@example.com"
}
```

---

# 21. DynamoDB

学習用SampleではDynamoDBを採用する。

理由：

* AWS Serverlessとの相性が良い
* Lambdaから利用しやすい
* 小規模なら低コスト
* TTLを利用できる
* Challenge / Session / Authorization Codeなどの短命データと相性が良い

## Logical Entities

```text
User
Credential
Challenge
Session
OAuthClient
AuthorizationCode
Token
```

最初は複数Tableでも構わない。

過度なSingle Table Designは避け、Domain理解を優先する。

---

# 22. Repository Interface

Domain/Application LayerではDynamoDBを直接参照しない。

例えば、

```ts
interface UserRepository {
  findById(id: UserId): Promise<User | null>
  save(user: User): Promise<void>
}
```

```ts
interface CredentialRepository {
  findByCredentialId(
    credentialId: string
  ): Promise<Credential | null>

  findByUserId(
    userId: UserId
  ): Promise<Credential[]>

  save(credential: Credential): Promise<void>
}
```

```ts
interface ChallengeRepository {
  save(challenge: Challenge): Promise<void>

  consume(
    challengeId: string
  ): Promise<Challenge | null>
}
```

Infrastructure LayerでDynamoDBを実装する。

```text
Application
     │
     ▼
Repository Interface
     │
     ▼
DynamoDB Repository
     │
     ▼
DynamoDB
```

---

# 23. WebAuthn Dependency

WebAuthnの暗号処理・Protocol処理はSimpleWebAuthnを利用する。

```text
Application
    │
    ▼
Passkey Service
    │
    ▼
SimpleWebAuthn
```

SimpleWebAuthn自体をDomain Logicに直接露出させない。

これにより将来的にWebAuthn Libraryを変更できる。

---

# 24. Authentication Flow

## Passkey Login

```text
Browser
   │
   │ POST /auth/passkey/login/options
   ▼
Next.js
   │
   ▼
Challenge Service
   │
   ▼
DynamoDB
   │
   ▼
Browser
   │
   │ navigator.credentials.get()
   ▼
Passkey
   │
   ▼
Browser
   │
   │ POST /login/verify
   ▼
Next.js
   │
   ▼
SimpleWebAuthn
   │
   ▼
Credential Verification
   │
   ▼
Session
   │
   ▼
HttpOnly Cookie
```

---

# 25. OIDC + Passkey Flow

```text
Native / Web Client
        │
        │ GET /authorize
        ▼
OIDC Provider
        │
        ▼
Login Session
        │
        ▼
Passkey
        │
        ▼
Authentication
        │
        ▼
Authorization Code
        │
        ▼
Client Redirect
        │
        ▼
POST /token
        │
        ▼
ID Token + Access Token
```

重要なのは、

```text
Passkey
   ↓
Authentication
```

と

```text
OIDC
   ↓
Authentication Resultの連携
```

を分離することである。

---

# 26. Next.js Route Handlerの責務

Route Handlerはできるだけ薄くする。

悪い例：

```text
route.ts
 ├── WebAuthn
 ├── DynamoDB
 ├── Session
 ├── JWT
 ├── User lookup
 └── Validation
```

良い例：

```text
route.ts
    │
    ▼
Application Service
    │
    ├── Domain
    ├── Repository
    └── Provider
```

Route Handlerは、

```text
HTTP Request
    ↓
Validation
    ↓
Application Service
    ↓
HTTP Response
```

程度にする。

---

# 27. 将来のModule化

このSampleを完成させた後、実装を観察してModule化する。

最終的には、

```text
packages/
├── identity-core
├── identity-passkey
├── identity-oidc
├── identity-adapter-dynamodb
└── identity-http
```

を目指す。

依存関係：

```text
identity-http
      │
      ├──────────────┐
      ▼              ▼
identity-oidc   identity-passkey
      │              │
      └──────┬───────┘
             ▼
       identity-core
             ▲
             │
identity-adapter-dynamodb
```

AWS固有の実装はCoreから隔離する。

---

# 28. Security Considerations

学習用であっても以下は最初から意識する。

### WebAuthn

* Origin検証
* RP ID検証
* Challenge検証
* Signature検証
* Counter検証
* User Verification

### OIDC

* redirect_uriの完全一致
* state
* nonce
* PKCE S256
* Authorization Codeの短期有効化
* Authorization Codeの一回限り利用
* issuer検証
* audience検証
* JWT signature検証
* JWT expiration
* key rotation

### Session

* HttpOnly
* Secure
* SameSite
* Session expiration
* Session revocation

---

# 29. Implementation Order

一気にOIDCまで実装しない。

## Phase 1 — Passkey

```text
User
 ↓
Passkey Registration
 ↓
Passkey Login
```

まずWebAuthnを理解する。

## Phase 2 — Session

```text
Passkey
 ↓
Session
 ↓
Cookie
```

## Phase 3 — OAuth

```text
/authorize
/token
Authorization Code
PKCE
```

## Phase 4 — OIDC

```text
Discovery
JWKS
ID Token
UserInfo
```

## Phase 5 — Integration

```text
Passkey
    ↓
Authentication
    ↓
OIDC Authorization
    ↓
Authorization Code
    ↓
Token
```

## Phase 6 — Refactoring

完成した実装を振り返り、

```text
Domain
Application
Infrastructure
Adapter
```

へ分離する。

---

# 30. Final Target

最終的な学習成果物は以下を目標とする。

```text
                         ┌───────────────┐
                         │    Next.js    │
                         │               │
                         │ Web Client    │
                         │ Route Handler │
                         └───────┬───────┘
                                 │
                                 ▼
                       ┌──────────────────┐
                       │ Identity Module  │
                       │                  │
                       │ Authentication   │
                       │ Authorization    │
                       │ Session          │
                       │ OIDC             │
                       └────────┬─────────┘
                                │
                 ┌──────────────┼──────────────┐
                 ▼              ▼              ▼
            SimpleWebAuthn   JWT/JWKS     Repository
                 │                             │
                 │                             ▼
                 │                         DynamoDB
                 │
                 ▼
              Passkey
```

このSampleを完成させた後、必要に応じて、

```text
Next.js Route Handler
        ↓
API Gateway
        ↓
Lambda
```

へHTTP層だけを差し替えられる構造にする。

さらに将来的には、

```text
DynamoDB
PostgreSQL
Firebase
```

などのRepository Adapterを追加できる構造を目指す。

---

# 31. Design Principle

本プロジェクトでは、最初から過度に汎用化しない。

まずは**具体的な1つの実装を完成させる**。

その後、

```text
実装
 ↓
複雑性を発見
 ↓
責務を分離
 ↓
Interface化
 ↓
Module化
```

という順番で抽象化する。

「将来使えるかもしれない」という理由だけで抽象化を追加しない。

最終的な目的は、

> **Passkeyをサポートする認証ライブラリを作ることではなく、Authentication / Authorization / Identityを理解し、異なるTransport・Storage・Authentication Methodに対応可能なIdentity Moduleへ発展させること**

とする。
