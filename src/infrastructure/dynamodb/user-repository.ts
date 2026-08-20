import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, type TranslateConfig } from "@aws-sdk/lib-dynamodb";
import { normalizeEmail } from "@/domain/email.js";
import type { UserRepository } from "@/domain/ports.js";
import type { User, UserId } from "@/domain/user.js";
import { parseEmailIndexUserId, parseUserProfileItem } from "./user-item.js";

export type DynamoUserRepositoryOptions = {
	tableName: string;
	clientConfig?: DynamoDBClientConfig;
	documentClientConfig?: TranslateConfig;
};

/**
 * User Repository
 * - pk=USER#{id}  sk=PROFILE  … User
 * - pk=EMAIL#{email} sk=UNIQUE … email → userId
 */
export class DynamoUserRepository implements UserRepository {
	readonly #tableName: string;
	readonly #doc: DynamoDBDocumentClient;

	readonly #userKeyPrefix = "USER";
	readonly #emailKeyPrefix = "EMAIL";
	readonly #profileKey = "PROFILE";
	readonly #uniqueKey = "UNIQUE";

	constructor(options: DynamoUserRepositoryOptions) {
		this.#tableName = options.tableName;
		this.#doc = DynamoDBDocumentClient.from(new DynamoDBClient(options.clientConfig ?? {}), {
			marshallOptions: { removeUndefinedValues: true },
			...options.documentClientConfig,
		});
	}

	async findById(id: UserId): Promise<User | null> {
		const result = await this.#doc.send(
			new GetCommand({
				TableName: this.#tableName,
				Key: { pk: `${this.#userKeyPrefix}#${id}`, sk: this.#profileKey },
			}),
		);
		if (!result.Item) {
			return null;
		}
		return parseUserProfileItem(result.Item);
	}

	async findByEmail(email: string): Promise<User | null> {
		const normalizedEmail = normalizeEmail(email);
		if (!normalizedEmail) {
			return null;
		}
		const index = await this.#doc.send(
			new GetCommand({
				TableName: this.#tableName,
				Key: { pk: `${this.#emailKeyPrefix}#${normalizedEmail}`, sk: this.#uniqueKey },
			}),
		);
		const userId = parseEmailIndexUserId(index.Item);
		if (!userId) {
			return null;
		}
		return this.findById(userId);
	}

	async save(user: User): Promise<void> {
		await this.#doc.send(
			new PutCommand({
				TableName: this.#tableName,
				Item: {
					pk: `USER#${user.id}`,
					sk: "PROFILE",
					id: user.id,
					displayName: user.displayName,
					email: user.email,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
				},
			}),
		);

		if (user.email) {
			const normalized = normalizeEmail(user.email);
			await this.#doc.send(
				new PutCommand({
					TableName: this.#tableName,
					Item: {
						pk: `EMAIL#${normalized}`,
						sk: "UNIQUE",
						userId: user.id,
					},
					ConditionExpression: "attribute_not_exists(pk) OR userId = :userId",
					ExpressionAttributeValues: {
						":userId": user.id,
					},
				}),
			);
		}
	}
}
