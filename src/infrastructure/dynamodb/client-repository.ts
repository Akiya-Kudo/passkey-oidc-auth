import {
	DynamoDBClient,
	type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
	ClientRepository,
	OAuthClient,
	OAuthClientId,
} from "../../domain/index.js";

export type DynamoClientRepositoryOptions = {
	tableName: string;
	client?: DynamoDBDocumentClient;
	clientConfig?: DynamoDBClientConfig;
};

/**
 * TODO: client_secret は暗号文または Secrets Manager 参照のみにする
 */
export class DynamoClientRepository implements ClientRepository {
	readonly #tableName: string;
	readonly #doc: DynamoDBDocumentClient;

	constructor(options: DynamoClientRepositoryOptions) {
		this.#tableName = options.tableName;
		this.#doc =
			options.client ??
			DynamoDBDocumentClient.from(
				new DynamoDBClient(options.clientConfig ?? {}),
				{ marshallOptions: { removeUndefinedValues: true } },
			);
	}

	async findById(id: OAuthClientId): Promise<OAuthClient | null> {
		const result = await this.#doc.send(
			new GetCommand({
				TableName: this.#tableName,
				Key: { pk: `CLIENT#${id}`, sk: "META" },
			}),
		);
		if (!result.Item) {
			return null;
		}
		return result.Item as OAuthClient;
	}

	async save(client: OAuthClient): Promise<void> {
		await this.#doc.send(
			new PutCommand({
				TableName: this.#tableName,
				Item: {
					pk: `CLIENT#${client.clientId}`,
					sk: "META",
					...client,
				},
			}),
		);
	}
}
