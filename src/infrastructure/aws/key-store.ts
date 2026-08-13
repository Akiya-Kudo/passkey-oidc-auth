import { exportJWK, generateKeyPair } from "jose";
import type { KeyStore } from "@/domain/ports.js";

/**
 * 開発用: プロセス内で RSA 鍵を生成して保持する。
 * Lambda ではコールドスタート毎に鍵が変わるため本番利用不可。
 *
 * TODO: Secrets Manager / KMS 実装に切り替える（EnvJwksKeyStore / KmsKeyStore）
 */
export class InMemoryKeyStore implements KeyStore {
	#keys: Record<string, unknown>[] | undefined;

	async getJwks(): Promise<{ keys: Record<string, unknown>[] }> {
		if (!this.#keys) {
			const { privateKey } = await generateKeyPair("RS256", {
				extractable: true,
			});
			const jwk = await exportJWK(privateKey);
			this.#keys = [
				{
					...jwk,
					kid: "local-dev-key",
					use: "sig",
					alg: "RS256",
				},
			];
		}
		return { keys: this.#keys };
	}
}

/**
 * 環境変数 `JWKS_JSON` から秘密鍵付き JWK Set を読む。
 * TODO: 本番では Secrets Manager から同等 JSON を取得する
 */
export class EnvJwksKeyStore implements KeyStore {
	async getJwks(): Promise<{ keys: Record<string, unknown>[] }> {
		const raw = process.env.JWKS_JSON;
		if (!raw) {
			throw new Error(
				"JWKS_JSON environment variable is required for EnvJwksKeyStore",
			);
		}
		const parsed = JSON.parse(raw) as { keys: Record<string, unknown>[] };
		if (!Array.isArray(parsed.keys) || parsed.keys.length === 0) {
			throw new Error("JWKS_JSON must contain a non-empty keys array");
		}
		return parsed;
	}
}
