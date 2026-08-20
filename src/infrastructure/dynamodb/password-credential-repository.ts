import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, type TranslateConfig } from "@aws-sdk/lib-dynamodb";
import type { PasswordCredential } from "@/domain/credential.js";
import type { PasswordCredentialRepository } from "@/domain/ports.js";
import type { UserId } from "@/domain/user.js";

export type DynamoPasswordCredentialRepositoryOptions = {
	tableName: string;
	clientConfig?: DynamoDBClientConfig;
	documentClientConfig?: TranslateConfig;
};

/**
 * Password Credential Repository
 * - pk=USER#{userId} sk=PASSWORD
 * TODO: Passkey 追加時は同じテーブルに sk=PASSKEY#{credentialId} を足す（別リポジトリ実装）。
 */
export class DynamoPasswordCredentialRepository implements PasswordCredentialRepository {
	readonly #tableName: string;
	readonly #doc: DynamoDBDocumentClient;

	constructor(options: DynamoPasswordCredentialRepositoryOptions) {
		this.#tableName = options.tableName;
		this.#doc = DynamoDBDocumentClient.from(new DynamoDBClient(options.clientConfig ?? {}), {
			marshallOptions: { removeUndefinedValues: true },
			...options.documentClientConfig,
		});
	}

	async findByUserId(userId: UserId): Promise<PasswordCredential | null> {
		const result = await this.#doc.send(
			new GetCommand({
				TableName: this.#tableName,
				Key: { pk: `USER#${userId}`, sk: "PASSWORD" },
			}),
		);
		const hash = result.Item?.passwordHash;
		if (typeof hash !== "string") {
			return null;
		}
		return {
			type: "password",
			userId,
			passwordHash: hash,
			algorithm: "scrypt",
		};
	}

	async save(credential: PasswordCredential): Promise<void> {
		await this.#doc.send(
			new PutCommand({
				TableName: this.#tableName,
				Item: {
					pk: `USER#${credential.userId}`,
					sk: "PASSWORD",
					type: credential.type,
					userId: credential.userId,
					passwordHash: credential.passwordHash,
					algorithm: credential.algorithm,
				},
			}),
		);
	}
}
