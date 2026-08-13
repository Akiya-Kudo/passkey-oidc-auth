import type { OAuthClient, OAuthClientId } from "./client.js";
import type { User, UserId } from "./user.js";

export interface UserRepository {
	findById(id: UserId): Promise<User | null>;
	save(user: User): Promise<void>;
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
