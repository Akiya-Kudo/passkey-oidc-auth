import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import type { KeyStore } from "@/domain/ports.js";

export type SecretsManagerKeyStoreOptions = {
	secretArn: string;
	region: string;
};

type Jwks = { keys: Record<string, unknown>[] };

function parseJwks(json: string): Jwks {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		throw new Error("JWKS secret must be valid JSON");
	}
	if (
		typeof parsed !== "object" ||
		parsed === null ||
		!("keys" in parsed) ||
		!Array.isArray(parsed.keys) ||
		parsed.keys.length === 0
	) {
		throw new Error("JWKS secret must contain a non-empty keys array");
	}
	return parsed as Jwks;
}

/**
 * デプロイ環境用: Secrets Manager から秘密鍵付き JWK Set を読む。
 * 取得結果はプロセス内にキャッシュする（Lambda コンテナ再利用時は再取得しない）。
 */
export class SecretsManagerKeyStore implements KeyStore {
	readonly #secretArn: string;
	readonly #client: SecretsManagerClient;
	#jwks: Jwks | undefined;

	constructor(options: SecretsManagerKeyStoreOptions) {
		this.#secretArn = options.secretArn;
		this.#client = new SecretsManagerClient({ region: options.region });
	}

	async getJwks(): Promise<Jwks> {
		if (!this.#jwks) {
			const result = await this.#client.send(new GetSecretValueCommand({ SecretId: this.#secretArn }));
			if (!result.SecretString) {
				throw new Error(`JWKS secret ${this.#secretArn} has no SecretString`);
			}
			this.#jwks = parseJwks(result.SecretString);
		}
		return this.#jwks;
	}
}
