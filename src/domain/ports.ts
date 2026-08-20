import type { OAuthClient, OAuthClientId } from "./client.js";
import type { PasswordCredential } from "./credential.js";
import type { Email } from "./user/email.js";
import type { User, UserId } from "./user/user.js";

export interface UserRepository {
	findById(id: UserId): Promise<User | null>;
	findByEmail(email: Email): Promise<User | null>;
	save(user: User): Promise<void>;
}

/**
 * Password 認証手段。Passkey は別ポート（検索キー・件数・中身が違う）。
 * 物理テーブルは User / OIDC Adapter と同じ単一テーブルでよい（PK/SK で分離）。
 */
export interface PasswordCredentialRepository {
	findByUserId(userId: UserId): Promise<PasswordCredential | null>;
	save(credential: PasswordCredential): Promise<void>;
}

export interface ClientRepository {
	findById(id: OAuthClientId): Promise<OAuthClient | null>;
	save(client: OAuthClient): Promise<void>;
}

/** JWKS 公開鍵 + 署名用秘密鍵の取得口 */
export interface KeyStore {
	/** oidc-provider の `jwks.keys` に渡す JWK 配列 */
	getJwks(): Promise<{ keys: Record<string, unknown>[] }>;
}
