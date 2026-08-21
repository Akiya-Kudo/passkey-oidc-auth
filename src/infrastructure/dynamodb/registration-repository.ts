import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand, type TranslateConfig } from "@aws-sdk/lib-dynamodb";
import type { RegistrationRepository } from "@/domain/ports.js";

export type DynamoRegistrationRepositoryOptions = {
	userTableName: string;
	credentialTableName: string;
	clientConfig?: DynamoDBClientConfig;
	documentClientConfig?: TranslateConfig;
};

/**
 * Writes the identity profile, email uniqueness record, and password credential as one
 * DynamoDB transaction so a failed registration cannot leave partial account data behind.
 */
export class DynamoRegistrationRepository implements RegistrationRepository {
	readonly #userTableName: string;
	readonly #credentialTableName: string;
	readonly #doc: DynamoDBDocumentClient;

	readonly #USER_PREFIX = "USER";
	readonly #EMAIL_PREFIX = "EMAIL";
	readonly #PROFILE_SK = "PROFILE";
	readonly #UNIQUE_SK = "UNIQUE";

	readonly #PASSWORD_SK = "PASSWORD";

	constructor(options: DynamoRegistrationRepositoryOptions) {
		this.#userTableName = options.userTableName;
		this.#credentialTableName = options.credentialTableName;
		this.#doc = DynamoDBDocumentClient.from(new DynamoDBClient(options.clientConfig ?? {}), {
			marshallOptions: { removeUndefinedValues: true },
			...options.documentClientConfig,
		});
	}

	async createPasswordAccount(input: Parameters<RegistrationRepository["createPasswordAccount"]>[0]): Promise<void> {
		const { user, passwordCredential } = input;
		// 現状emailアカウントのみサポート
		if (!user.email) {
			throw new Error("A password account requires an email address");
		}

		await this.#doc.send(
			new TransactWriteCommand({
				TransactItems: [
					{
						Put: {
							TableName: this.#userTableName,
							Item: {
								pk: `${this.#USER_PREFIX}#${user.id.value}`,
								sk: this.#PROFILE_SK,
								id: user.id.value,
								displayName: user.displayName,
								email: user.email.value,
								createdAt: user.createdAt,
								updatedAt: user.updatedAt,
							},
							ConditionExpression: "attribute_not_exists(pk)",
						},
					},
					{
						Put: {
							TableName: this.#userTableName,
							Item: {
								pk: `${this.#EMAIL_PREFIX}#${user.email.value}`,
								sk: this.#UNIQUE_SK,
								id: user.id.value,
							},
							ConditionExpression: "attribute_not_exists(pk)",
						},
					},
					{
						Put: {
							TableName: this.#credentialTableName,
							Item: {
								pk: `${this.#USER_PREFIX}#${passwordCredential.userId.value}`,
								sk: this.#PASSWORD_SK,
								type: passwordCredential.type,
								userId: passwordCredential.userId.value,
								passwordHash: passwordCredential.passwordHash,
								algorithm: passwordCredential.algorithm,
							},
							ConditionExpression: "attribute_not_exists(pk)",
						},
					},
				],
			}),
		);
	}
}
