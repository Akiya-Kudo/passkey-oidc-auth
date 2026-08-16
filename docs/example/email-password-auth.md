# 仮に Email + Password を導入する場合

本番の認証方式は **Passkey のみ** です。この文書は Interaction 実装に入る前に、IdP と OIDC の役割分担を掴むための思考実験です。コードは書きません。

---

## 1. 先に言葉を分ける

混同しやすいものが 3 つあります。

| 言葉 | このプロジェクトでの意味 | 担当 |
|---|---|---|
| **認証 (Authentication)** | 今ブラウザの前にいる人が、どの User か確かめる | 自分たち（Interaction UI + `/api/interactions/:uid/login`） |
| **認可 (Authorization / OIDC)** | その User が Client に何を渡してよいか | `oidc-provider`（`/authorize` → consent → `/token`） |
| **IdP** | 上の両方を持つ「ログインしてもらう側」全体 | このアプリ |

Email + Password を足すのは **認証の中身だけ** です。Authorization Code、PKCE、ID Token、consent、`findAccount` の claims は、認証方式が変わっても同じです。

oidc-provider が知っているのは次だけです。

```ts
await provider.interactionFinished(req, res, {
  login: { accountId: user.id },
});
```

「email と password が正しかった」は **呼ぶ前に自分たちで終わらせる** 必要があります。`accountId` をブラウザから受け取って `interactionFinished` してはいけません。今の Passkey TODO と同じ制約です。

```68:71:src/http/routes/interaction.ts
	router.post("/api/interactions/:uid/login", async (ctx) => {
		requireSameOrigin(ctx);
		// TODO: WebAuthn assertion を検証し、その検証結果から accountId を決定する。
		// accountId をクライアントから受け取って interactionFinished を呼んではならない。
```

---

## 2. 現状ですでにできていること

ログイン画面の「中身」以外は、ほぼ揃っています。

```text
Client
  → GET /authorize          oidc-provider が Interaction を作る
  → 303 /interaction/{uid}  SPA
  → GET  /api/interactions/{uid}/context
  → （ここで login が 501）
  → POST /api/interactions/{uid}/confirm   consent は実装済み
  → /authorize に resume
  → code を Client へ
  → POST /token
```

| 層 | ファイル | 今あるもの |
|---|---|---|
| Interaction 開始 | `src/oidc/config.ts` の `interactions.url` | `/interaction/{uid}` へ飛ばす |
| Cookie | `src/http/koa.ts` の `app.keys` | `_interaction` の署名 |
| context | `src/http/routes/interaction.ts` | `prompt` / client / scopes |
| consent | 同上 `confirm` | Grant を保存して `interactionFinished` |
| User の claims | `src/oidc/config/account.ts` | `sub` / `email` / `name` |
| User 保存 | `src/domain/user.ts` + `user-repository.ts` | `id` で読む・書く。email は任意 |
| SPA | `apps/interaction-ui` | `prompt === "login"` なら Login、`"consent"` なら Consent |

足りないのは **「この Interaction の User は誰か」を決める処理** と、その User を初めて作る動線です。

---

## 3. 新規登録は必要か

**必要です。** Password 認証は「既存の User を email で探す」ので、探す先が無いとログインできません。Passkey も同じで、Credential を紐づける User が先に要ります。

ただし登録は OIDC の標準エンドポイントではありません。`/authorize` や `/token` には置きません。IdP の **自前画面** です。

置き場所は 2 通りあります。

### A. Interaction の中で登録する（学習におすすめ）

未ログインで `/authorize` に来た人が、同じ `/interaction/{uid}` で「新規登録」できる。

- 登録成功 = その場で認証成功
- すぐ `interactionFinished({ login })` できる
- 「認証は Interaction の login prompt を終わらせる」が体感できる

### B. 登録専用ページを別にする

`/register` のような独立ページ。終わったら Client の `/authorize` に戻す。

- パスワード再設定・メール確認と切り分けやすい
- Interaction Cookie と登録画面の寿命を混ぜない
- 「ログイン」と「アカウント作成」が別フローになる

学習用の仮実装なら **A** で足ります。Passkey 本番でも「初回登録」は Interaction 内か、ログイン済みセッションからの登録かの設計が要ります。ここでの A は、その判断の練習です。

メール確認（確認リンクを踏むまでログイン不可）は、学習用なら省略してよいです。省略するなら「email を持っていること」と「その email の所有者であること」を同一視している、と明記してください。

---

## 4. フロー

### 4.1 ログイン（既存ユーザー）

```text
Client → /authorize
  → prompt=login の Interaction
  → SPA: email / password フォーム
  → POST /api/interactions/{uid}/login
       Origin チェック（既存の requireSameOrigin）
       Interaction Cookie で uid を確認
       email で User を探す
       password をハッシュと比較
       成功したら accountId をサーバが決める
       interactionFinished({ login: { accountId } })
  → oidc-provider が Session に accountId を載せる
  → 必要なら prompt=consent
  → code 発行
```

失敗（email 不明・password 不一致）では `interactionFinished` しません。Interaction はそのまま残し、SPA に 401 相当を返します。

### 4.2 新規登録（Interaction 内）

```text
同じ /interaction/{uid}
  → SPA: 登録フォーム（email / password / 表示名）
  → POST /api/interactions/{uid}/register
       email の重複チェック
       password をハッシュして保存
       User を新規作成（id はサーバ発行）
       interactionFinished({ login: { accountId: 新しい User.id } })
  → 以降はログイン成功と同じ（consent → code）
```

登録も「認証に成功した」とみなします。作った直後の本人だからです。Client から `accountId` を受け取らない、という規則は登録でも同じです。

### 4.3 consent は触らない

consent は「誰か」が決まったあとの話です。Email + Password を足しても `confirm` ルートはそのまま使えます。

---

## 5. ドメインと保存

今の User は認証シークレットを持っていません。

```1:9:src/domain/user.ts
export type UserId = string;

export type User = {
	id: UserId;
	displayName?: string;
	email?: string;
	createdAt: string;
	updatedAt: string;
};
```

Repository も id 検索だけです。

```3:7:src/domain/ports.ts
export interface UserRepository {
	findById(id: UserId): Promise<User | null>;
	save(user: User): Promise<void>;
}
```

### 5.1 User と「認証手段」を分ける

Passkey に進むなら、最初から分けた方がよいです。

```text
User（誰か）
  id, email, displayName, ...

Credential（どう証明するか）
  password:  userId + passwordHash + algorithm
  passkey:   userId + credentialId + publicKey + counter   ← 後でこれだけ残る
```

User の `email` は **連絡先・ログイン識別子** です。パスワードそのものを User に直書きしない。後で Passkey だけになっても User はそのまま使えます。

学習用の最小なら User に `passwordHash` を足しても動きます。その場合でも「本番では Credential テーブルに移す」と書いておく。

### 5.2 追加する Repository 操作

| 操作 | 用途 |
|---|---|
| `findByEmail(email)` | ログイン・登録時の重複チェック |
| `createWithPassword(...)` または `save` + Credential | 新規登録 |
| 既存の `findById` | `findAccount`（ID Token の `sub`） |

email は正規化します（trim、小文字化）。GSI が要ります。今のテーブル作成スクリプトは OIDC Adapter 用インデックスだけで、Users 用は TODO のままです。

```11:11:scripts/create-local-tables.ts
 * TODO: Users / Credentials 用テーブル設計を追加する
```

例:

```text
pk = USER#{userId}     sk = PROFILE      … 今の User
pk = USER#{userId}     sk = PASSWORD     … passwordHash
pk = EMAIL#{email}     sk = UNIQUE       … userId への一意制約
```

`EMAIL#` は Conditional Put で「既にあれば失敗」にすると、同時登録の競合を防げます。

### 5.3 password の扱い

- 保存はハッシュのみ（argon2id または scrypt）。平文・可逆暗号は不可
- 比較は定数時間（ライブラリの `verify` に任せる）
- リクエスト Body の JSON で送る（query や URL に載せない）
- ログに email 以外の秘密を出さない。password は絶対に出さない
- 失敗応答は「email または password が違います」に統一する（存在有無を分けない）

---

## 6. HTTP と SPA

### 6.1 追加ルート

既存の Interaction ルートに足します。新しい OIDC エンドポイントは不要です。

| メソッド | パス | 役割 |
|---|---|---|
| 既存 GET | `/api/interactions/:uid/context` | 変更なしで足りる |
| 既存 POST | `/api/interactions/:uid/login` | email/password を検証して `login` 完了 |
| **新規 POST** | `/api/interactions/:uid/register` | User 作成して `login` 完了 |
| 既存 POST | `/api/interactions/:uid/confirm` | 変更なし |

どちらも:

1. `requireSameOrigin`（既存）
2. `provider.interactionDetails` で Cookie の Interaction を取る
3. `requireCurrentInteraction` で URL の uid と一致させる
4. `prompt.name === "login"` でなければ 400
5. サーバが `accountId` を決めてから `interactionFinished`

login の疑似コード:

```ts
const { email, password } = パースした body;
const user = await users.findByEmail(normalize(email));
if (!user || !(await passwordCredential.verify(user.id, password))) {
  throw new AppError(401, "invalid_credentials", "…", { expose: true });
}
await provider.interactionFinished(
  ctx.req,
  ctx.res,
  { login: { accountId: user.id } },
  { mergeWithLastSubmission: true },
);
ctx.respond = false; // confirm と同じ。303 は oidc-provider が出す
```

### 6.2 SPA

`Login.tsx` をフォームにする。

- email / password
- 「サインイン」→ `POST .../login`
- 「新規登録」→ 同じ uid のまま登録フォーム、`POST .../register`
- `credentials: "same-origin"` は維持（Interaction Cookie が要る）

consent 画面は今のままでよいです。

### 6.3 Vite プロキシ

`/api` は既に Koa へプロキシしています。パスを足してもプレフィックスはそのままです。

---

## 7. oidc-provider 側でやること・やらないこと

やること:

- `interactionFinished` に `login.accountId` を渡す
- 既存の `findAccount` が、その id の User を返す（email scope なら email claim）

やらなくてよいこと:

- `features.resourceIndicators` や grant type の変更
- パスワード検証を Adapter に書く
- User を OIDC Adapter の `Session` レコードに直書きする

Session Cookie（`_session`）は `interactionFinished({ login })` のあと oidc-provider が更新します。自前で `_session` を set する必要はありません。`docs/abstract.md` の「自前 SessionRepository」は、今の実装では **oidc-provider の Session モデル** に相当します。

`findAccount` は既に email を claims に載せます。登録時に `user.email` を保存すれば、Client が `scope=openid email` を付けたときに ID Token へ入ります。

---

## 8. 既存ファイルへの差分一覧

実装するなら、触る場所はだいたいここです。

| 場所 | 内容 |
|---|---|
| `src/domain/user.ts` | email を必須にするか検討 |
| `src/domain/ports.ts` | `findByEmail`、Password Credential ポート |
| `src/infrastructure/dynamodb/user-repository.ts` | email 検索・一意制約 |
| 新規 `password-credential.ts` など | hash / verify |
| `src/http/routes/interaction.ts` | login の 501 を実装、register 追加 |
| `src/http/app-error.ts` | `invalid_credentials` / `email_taken` |
| `apps/interaction-ui` | フォーム、register API |
| `scripts/create-local-tables.ts` と CDK | email 用 GSI または別アイテム |
| `src/http/koa.ts` | JSON body を読む middleware（未導入なら） |

`src/oidc/config.ts` の clients / routes / ttl は、この仮導入だけでは変えなくてよいです。

---

## 9. 学習用で省略してよいもの / 省略しないもの

省略してよい（Passkey に進むなら捨てる）:

- パスワードリセット
- メール確認メール
- ロックアウト・CAPTCHA
- パスワード強度メーター（サーバ側の最低長だけあればよい）
- 複数デバイスでのセッション一覧

省略しない（認証の骨格なので Passkey でも残る）:

- Interaction Cookie を見てから認証する
- `accountId` はサーバが決める
- 同一 Origin の POST だけ受け付ける
- 失敗しても Interaction を壊さない
- 成功したら `interactionFinished({ login })` → 必要なら consent
- User id と認証手段を分ける

---

## 10. Passkey 実装への読み替え

Email + Password で理解した対応関係は、そのまま Passkey に置き換えます。

| Email + Password | Passkey |
|---|---|
| `POST .../login` で secret を検証 | assertion を検証 |
| `POST .../register` でハッシュ保存 | attestation を検証して公開鍵保存 |
| 識別子は email | 識別子は `credentialId`（discoverable credential なら UI で email 不要） |
| `accountId = user.id` | 同じ。Credential から User を引く |
| `interactionFinished({ login })` | **同じ** |

Passkey では「パスワードを送る」代わりに、challenge の発行と署名検証が入ります。challenge は短命なので、OIDC Adapter と同じテーブルか、専用アイテム（TTL 付き）に置きます。そこが Password との最大の差です。

Interaction の枠（uid、Cookie、prompt、consent）は共通です。だから先に Password で枠を頭に入れると、次の Passkey は「login ハンドラの中身」だけに集中できます。

---

## 11. この文書の結論

1. Email + Password は **IdP の認証** であり、OIDC の新しいエンドポイントではない。
2. 新規登録動線は必要。学習なら **同じ Interaction 内** が分かりやすい。
3. 足すものは User の email 一意制約、password ハッシュ、`login` / `register` API、SPA のフォーム。
4. 成功の出口はどちらも `interactionFinished({ login: { accountId } })`。consent 以降は現状のまま。
5. 本番ではこの方式は入れず、同じ枠に Passkey 検証を実装する。

##  MEMO

グループID統合サービスのようなものでは、特定のサービスドメイン側で会員登録を行うケースがある。その様な場合には認証基盤と統合IDサービスが統合されており会員ディレクトリなども共有して利用しているケースが存在する。

しかし、基本的には認証基盤ドメイン内で会員登録を行い、認証基盤で会員情報の管理を行うことで、複数サービスにおける、会員情報の保存。登録動線の統一かが可能

しかし、サービスごとに保持するべき会員情報が異なる場合には個々のサービスで認証基盤のIDを紐付け保存を行うべき