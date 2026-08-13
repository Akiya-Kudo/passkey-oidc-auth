import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";

export type CreateDynamoDBClientOptions = {
	endpoint?: string;
	region: string;
};

export function createDynamoDBClientConfig({
	endpoint,
	region,
}: CreateDynamoDBClientOptions): DynamoDBClientConfig {
	const config: DynamoDBClientConfig = { region };

	// ローカル開発時
	if (endpoint) {
		config.endpoint = endpoint;
		config.credentials = {
			accessKeyId: "local",
			secretAccessKey: "local",
		};
	}

	return config;
}
