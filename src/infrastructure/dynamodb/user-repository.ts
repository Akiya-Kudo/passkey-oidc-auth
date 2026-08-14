import {
	DynamoDBClient,
	type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
	type TranslateConfig,
} from "@aws-sdk/lib-dynamodb";
import type { UserRepository } from "@/domain/ports.js";
import type { User, UserId } from "@/domain/user.js";

export type DynamoUserRepositoryOptions = {
	tableName: string;
	clientConfig?: DynamoDBClientConfig;
	documentClientConfig?: TranslateConfig;
};

//  TODO: Passkey Credential と同じテーブル設計に合わせて PK/SK を見直す
export class DynamoUserRepository implements UserRepository {
	readonly #tableName: string;
	readonly #doc: DynamoDBDocumentClient;

	constructor(options: DynamoUserRepositoryOptions) {
		this.#tableName = options.tableName;
		this.#doc = DynamoDBDocumentClient.from(
			new DynamoDBClient(options.clientConfig ?? {}),
			{
				marshallOptions: { removeUndefinedValues: true },
				...options.documentClientConfig,
			},
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
