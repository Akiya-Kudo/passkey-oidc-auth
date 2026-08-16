import type { KeyStore } from "@/domain/ports.js";
import { InMemoryKeyStore } from "./aws/key-store.js";
import { SecretsManagerKeyStore } from "./aws/secrets-manager-key-store.js";
import { createDynamoDBClientConfig } from "./dynamodb/config.js";
import { createDynamoOidcAdapterFactory } from "./dynamodb/factory.js";
import { DynamoUserRepository } from "./dynamodb/user-repository.js";
import { Environments } from "./env.js";

export function createRuntimeDeps() {
	const dynamoConfig = createDynamoDBClientConfig({
		endpoint: Environments.dynamodbEndpoint,
		region: Environments.awsRegion,
	});
	const adapter = createDynamoOidcAdapterFactory({
		tableName: Environments.oidcTableName,
		clientConfig: dynamoConfig,
	});

	const userRepository = new DynamoUserRepository({
		tableName: Environments.oidcTableName,
		clientConfig: dynamoConfig,
	});

	const keyStore: KeyStore = Environments.jwksSecretArn
		? new SecretsManagerKeyStore({
				secretArn: Environments.jwksSecretArn,
				region: Environments.awsRegion,
			})
		: new InMemoryKeyStore();

	return {
		adapter,
		keyStore,
		userRepository,
		cookieKeys: Environments.cookieKeys,
		issuer: Environments.issuer,
	};
}
