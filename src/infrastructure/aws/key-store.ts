import { exportJWK, generateKeyPair } from "jose";
import type { KeyStore } from "@/domain/ports.js";

/**
 * ローカル開発用: プロセス内で RSA 鍵を生成して保持する。
 * Lambda ではコールドスタート毎に鍵が変わるため使わない。
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
