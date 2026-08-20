import {
	CreateTableCommand,
	type CreateTableCommandInput,
	DynamoDBClient,
	ResourceInUseException,
	UpdateTimeToLiveCommand,
} from "@aws-sdk/client-dynamodb";
import { parseEnv } from "@/utils/env";

/**
 * DynamoDB Local 向けにテーブルを作成する。
 *
 * - OIDC_TABLE_NAME: oidc-provider adapter（grantId / uid / userCode の GSI、expiresAt TTL）
 * - USER_TABLE_NAME: User（pk/sk。USER#…/PROFILE と EMAIL#…/UNIQUE）
 * - CREDENTIAL_TABLE_NAME: Password credential（pk/sk。USER#…/PASSWORD）
 *
 * Usage: pnpm tables:local
 * Seed: pnpm seed:local
 */
const endpoint = parseEnv("LOCAL_DYNAMODB_ENDPOINT", process.env.LOCAL_DYNAMODB_ENDPOINT);
const region = parseEnv("AWS_REGION", process.env.AWS_REGION);
const oidcTableName = parseEnv("OIDC_TABLE_NAME", process.env.OIDC_TABLE_NAME);
const userTableName = parseEnv("USER_TABLE_NAME", process.env.USER_TABLE_NAME);
const credentialTableName = parseEnv("CREDENTIAL_TABLE_NAME", process.env.CREDENTIAL_TABLE_NAME);

const client = new DynamoDBClient({
	region,
	endpoint,
	credentials: {
		accessKeyId: "local",
		secretAccessKey: "local",
	},
});

type TableSpec = {
	name: string;
	input: CreateTableCommandInput;
	ttlAttribute?: string;
};

const pkSk = {
	AttributeDefinitions: [
		{ AttributeName: "pk", AttributeType: "S" as const },
		{ AttributeName: "sk", AttributeType: "S" as const },
	],
	KeySchema: [
		{ AttributeName: "pk", KeyType: "HASH" as const },
		{ AttributeName: "sk", KeyType: "RANGE" as const },
	],
	BillingMode: "PAY_PER_REQUEST" as const,
};

const tables: TableSpec[] = [
	{
		name: oidcTableName,
		ttlAttribute: "expiresAt",
		input: {
			TableName: oidcTableName,
			AttributeDefinitions: [
				...pkSk.AttributeDefinitions,
				{ AttributeName: "grantId", AttributeType: "S" },
				{ AttributeName: "uid", AttributeType: "S" },
				{ AttributeName: "userCode", AttributeType: "S" },
			],
			KeySchema: pkSk.KeySchema,
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
			BillingMode: pkSk.BillingMode,
		},
	},
	{
		name: userTableName,
		input: {
			TableName: userTableName,
			...pkSk,
		},
	},
	{
		name: credentialTableName,
		input: {
			TableName: credentialTableName,
			...pkSk,
		},
	},
];

async function ensureTable(spec: TableSpec): Promise<void> {
	try {
		await client.send(new CreateTableCommand(spec.input));
		if (spec.ttlAttribute) {
			await client.send(
				new UpdateTimeToLiveCommand({
					TableName: spec.name,
					TimeToLiveSpecification: {
						AttributeName: spec.ttlAttribute,
						Enabled: true,
					},
				}),
			);
		}
		console.log(`Created table: ${spec.name}`);
	} catch (error) {
		if (error instanceof ResourceInUseException) {
			console.log(`Table already exists: ${spec.name}`);
			return;
		}
		throw error;
	}
}

for (const table of tables) {
	await ensureTable(table);
}
