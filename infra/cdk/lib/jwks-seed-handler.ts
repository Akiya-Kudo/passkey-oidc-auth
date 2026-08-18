import { generateKeyPairSync, randomUUID } from "node:crypto";
import { GetSecretValueCommand, PutSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

function isJwks(value: unknown): value is { keys: unknown[] } {
	return (
		typeof value === "object" && value !== null && "keys" in value && Array.isArray(value.keys) && value.keys.length > 0
	);
}

/** デプロイ時に JWKS が未設定なら RSA 鍵を 1 本入れて上書きする。既存の有効な JWKS は維持する。 */
export async function handler(): Promise<void> {
	const secretArn = process.env.JWKS_SECRET_ARN;
	if (!secretArn) {
		throw new Error("JWKS_SECRET_ARN is not set");
	}

	const client = new SecretsManagerClient({});
	const current = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));

	try {
		const parsed: unknown = JSON.parse(current.SecretString ?? "");
		if (isJwks(parsed)) {
			return;
		}
	} catch {
		// CDK 既定のランダム文字列など、JWKS でない場合は初期化する
	}

	const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
	const jwk = privateKey.export({ format: "jwk" });
	await client.send(
		new PutSecretValueCommand({
			SecretId: secretArn,
			SecretString: JSON.stringify({
				keys: [
					{
						...jwk,
						kid: randomUUID(),
						use: "sig",
						alg: "RS256",
					},
				],
			}),
		}),
	);
}
