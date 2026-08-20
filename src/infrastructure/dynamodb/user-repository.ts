import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, type TranslateConfig } from "@aws-sdk/lib-dynamodb";
import { Email } from "@/domain/email.js";
import type { UserRepository } from "@/domain/ports.js";
import { User } from "@/domain/user.js";
import { UserId } from "@/domain/user-id.js";

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

	readonly #USER_PREFIX = "USER";
	readonly #EMAIL_PREFIX = "EMAIL";
	readonly #PROFILE_SK = "PROFILE";
	readonly #UNIQUE_SK = "UNIQUE";

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
				Key: { pk: `${this.#USER_PREFIX}#${id}`, sk: this.#PROFILE_SK },
			}),
		);
		if (!result.Item) {
			return null;
		}
		const user = User.from({
			id: UserId.parse(result.Item?.id),
			displayName: result.Item?.displayName,
			email: result.Item?.email ? Email.from(result.Item.email) : undefined,
			createdAt: result.Item?.createdAt,
			updatedAt: result.Item?.updatedAt,
		});
		return user;
	}

	async findByEmail(email: Email): Promise<User | null> {
		const result = await this.#doc.send(
			new GetCommand({
				TableName: this.#tableName,
				Key: { pk: `${this.#EMAIL_PREFIX}#${email.toString()}`, sk: this.#UNIQUE_SK },
			}),
		);
		if (!result.Item) {
			return null;
		}
		const userId = UserId.parse(result.Item?.id);
		return this.findById(userId);
	}

	async save(user: User): Promise<void> {
		await this.#doc.send(
			new PutCommand({
				TableName: this.#tableName,
				Item: {
					pk: `${this.#USER_PREFIX}#${user.id}`,
					sk: this.#PROFILE_SK,
					id: user.id,
					displayName: user.displayName,
					email: user.email,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
				},
			}),
		);

		if (user.email) {
			await this.#doc.send(
				new PutCommand({
					TableName: this.#tableName,
					Item: {
						pk: `${this.#EMAIL_PREFIX}#${user.email.toString()}`,
						sk: this.#UNIQUE_SK,
						id: user.id,
					},
					ConditionExpression: "attribute_not_exists(pk) OR id = :id",
					ExpressionAttributeValues: {
						":id": user.id,
					},
				}),
			);
		}
	}
}
