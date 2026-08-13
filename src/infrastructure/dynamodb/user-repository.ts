import {
	DynamoDBClient,
	type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
} from "@aws-sdk/lib-dynamodb";
import type { User, UserId, UserRepository } from "../../domain/index.js";

export type DynamoUserRepositoryOptions = {
	tableName: string;
	client?: DynamoDBDocumentClient;
	clientConfig?: DynamoDBClientConfig;
};

/**
 * TODO: Passkey Credential と同じテーブル設計に合わせて PK/SK を見直す
 */
export class DynamoUserRepository implements UserRepository {
	readonly #tableName: string;
	readonly #doc: DynamoDBDocumentClient;

	constructor(options: DynamoUserRepositoryOptions) {
		this.#tableName = options.tableName;
		this.#doc =
			options.client ??
			DynamoDBDocumentClient.from(
				new DynamoDBClient(options.clientConfig ?? {}),
				{ marshallOptions: { removeUndefinedValues: true } },
			);
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
		return result.Item as User;
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
	}
}
