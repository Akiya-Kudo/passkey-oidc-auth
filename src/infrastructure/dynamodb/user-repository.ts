import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, type TranslateConfig } from "@aws-sdk/lib-dynamodb";
import { normalizeEmail } from "@/domain/email.js";
import type { UserRepository } from "@/domain/ports.js";
import type { User, UserId } from "@/domain/user.js";

export type DynamoUserRepositoryOptions = {
	tableName: string;
	clientConfig?: DynamoDBClientConfig;
	documentClientConfig?: TranslateConfig;
};

type EmailIndexItem = {
	pk: string;
	sk: string;
	userId: UserId;
};

/**
 * Single-table layout (OIDC Adapter / User / Password は同じテーブル):
 * - pk=USER#{id}  sk=PROFILE  … User
 * - pk=EMAIL#{email} sk=UNIQUE … email → userId
 * - pk=USER#{id}  sk=PASSWORD … PasswordCredential（別リポジトリ実装）
 */
export class DynamoUserRepository implements UserRepository {
	readonly #tableName: string;
	readonly #doc: DynamoDBDocumentClient;

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
				Key: { pk: `USER#${id}`, sk: "PROFILE" },
			}),
		);
		if (!result.Item) {
			return null;
		}
		return toUser(result.Item);
	}

	async findByEmail(email: string): Promise<User | null> {
		const normalized = normalizeEmail(email);
		if (!normalized) {
			return null;
		}
		const index = await this.#doc.send(
			new GetCommand({
				TableName: this.#tableName,
				Key: { pk: `EMAIL#${normalized}`, sk: "UNIQUE" },
			}),
		);
		const userId = (index.Item as EmailIndexItem | undefined)?.userId;
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
					...user,
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

function toUser(item: Record<string, unknown>): User {
	return {
		id: String(item.id),
		displayName: typeof item.displayName === "string" ? item.displayName : undefined,
		email: typeof item.email === "string" ? item.email : undefined,
		createdAt: String(item.createdAt),
		updatedAt: String(item.updatedAt),
	};
}
