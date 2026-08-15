import {
	CreateTableCommand,
	DynamoDBClient,
	ResourceInUseException,
} from "@aws-sdk/client-dynamodb";

/**
 * DynamoDB Local 向けに OIDC Adapter 用テーブルを作成する
 *
 * TODO: Users / Credentials 用テーブル定義を追加する
 * Usage: pnpm tables:local
 */
const endpoint = throwIfUndefined(process.env.DYNAMODB_ENDPOINT);
const region = throwIfUndefined(process.env.AWS_REGION);
const tableName = throwIfUndefined(process.env.OIDC_TABLE_NAME);

const client = new DynamoDBClient({
	region,
	endpoint,
	credentials: {
		accessKeyId: "local",
		secretAccessKey: "local",
	},
});

async function main() {
	try {
		await client.send(
			new CreateTableCommand({
				TableName: tableName,
				AttributeDefinitions: [
					{ AttributeName: "pk", AttributeType: "S" },
					{ AttributeName: "sk", AttributeType: "S" },
					{ AttributeName: "grantId", AttributeType: "S" },
					{ AttributeName: "uid", AttributeType: "S" },
					{ AttributeName: "userCode", AttributeType: "S" },
				],
				KeySchema: [
					{ AttributeName: "pk", KeyType: "HASH" },
					{ AttributeName: "sk", KeyType: "RANGE" },
				],
				GlobalSecondaryIndexes: [
					{
						IndexName: "grantIdIndex",
						KeySchema: [{ AttributeName: "grantId", KeyType: "HASH" }],
						Projection: { ProjectionType: "ALL" },
					},
					{
						IndexName: "uidIndex",
						KeySchema: [{ AttributeName: "uid", KeyType: "HASH" }],
						Projection: { ProjectionType: "ALL" },
					},
					{
						IndexName: "userCodeIndex",
						KeySchema: [{ AttributeName: "userCode", KeyType: "HASH" }],
						Projection: { ProjectionType: "ALL" },
					},
				],
				BillingMode: "PAY_PER_REQUEST",
			}),
		);
		console.log(`Created table: ${tableName}`);
	} catch (error) {
		if (error instanceof ResourceInUseException) {
			console.log(`Table already exists: ${tableName}`);
			return;
		}
		throw error;
	}
}

await main();

function throwIfUndefined<T>(value: T | undefined): T {
	if (!value) {
		throw new Error(
			"required environment variable is not set, please place .env file in the root directory",
		);
	}
	return value;
}
