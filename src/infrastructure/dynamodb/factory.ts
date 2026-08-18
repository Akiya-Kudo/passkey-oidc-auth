import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import type { AdapterFactory } from "oidc-provider";
import { DynamoOidcAdapter } from "./oidc-adapter.js";

export type DynamoOidcAdapterOptions = {
	tableName: string;
	clientConfig?: DynamoDBClientConfig;
};
export function createDynamoOidcAdapterFactory(options: DynamoOidcAdapterOptions): AdapterFactory {
	return (name: string) => new DynamoOidcAdapter(name, options);
}
