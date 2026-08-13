import type { AdapterFactory } from "oidc-provider";
import type { KeyStore, UserRepository } from "@/domain/ports.js";
import { EnvJwksKeyStore, InMemoryKeyStore } from "./aws/key-store.js";
import { KmsKeyStore } from "./aws/kms-key-store.js";
import { createDynamoDBClientConfig } from "./dynamodb/config.js";
import { createDynamoOidcAdapterFactory } from "./dynamodb/factory.js";
import { DynamoUserRepository } from "./dynamodb/user-repository.js";
import { type AppEnvs, Environments } from "./env.js";

export type RuntimeDeps = {
	config: AppEnvs;
	adapter?: AdapterFactory;
	keyStore: KeyStore;
	userRepository?: UserRepository;
};

export function createRuntimeDeps(): RuntimeDeps {
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

	let keyStore: KeyStore;
	if (Environments.jwksJson) {
		keyStore = new EnvJwksKeyStore(Environments.jwksJson);
	} else if (Environments.jwksSecretArn) {
		// TODO: Secrets Manager から JWKS を取得する実装に置き換える
		// 現状はプレースホルダとして KmsKeyStore を立てて明示的に失敗させる
		keyStore = new KmsKeyStore(Environments.jwksSecretArn);
	} else {
		keyStore = new InMemoryKeyStore();
	}

	return {
		config: Environments,
		adapter,
		keyStore,
		userRepository,
	};
}
