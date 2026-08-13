import type { KeyStore } from "@/domain/ports.js";

/**
 * TODO: AWS KMS で署名する KeyStore を実装する
 * - oidc-provider は JWK 秘密鍵を直接持つ想定のため、
 *   KMS 署名に合わせる場合は custom token signing か、
 *   暗号化した秘密鍵を Secrets Manager に置く方式を検討する
 */
export class KmsKeyStore implements KeyStore {
	constructor(
		/** TODO: KMS KeyId / Alias ARN */
		readonly _keyId: string,
	) {}

	async getJwks(): Promise<{ keys: Record<string, unknown>[] }> {
		throw new Error("KmsKeyStore is not implemented yet");
	}
}
