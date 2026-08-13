import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import type { AdapterFactory } from "oidc-provider";
import type { KeyStore, UserRepository } from "@/domain/ports.js";
import { EnvJwksKeyStore, InMemoryKeyStore } from "./aws/key-store.js";
import { KmsKeyStore } from "./aws/kms-key-store.js";
import { createDynamoOidcAdapterFactory } from "./dynamodb/oidc-adapter.js";
import { DynamoUserRepository } from "./dynamodb/user-repository.js";
import { type AppEnvs, Environments } from "./env.js";

export type RuntimeDeps = {
	config: AppEnvs;
	adapter?: AdapterFactory;
	keyStore: KeyStore;
	userRepository?: UserRepository;
};

function dynamoClientConfig(config: AppEnvs): DynamoDBClientConfig {
	if (!config.dynamodbEndpoint) {
		// デプロイ時
		return { region: config.awsRegion };
	}

	// ローカル開発時
	return {
		region: config.awsRegion,
		endpoint: config.dynamodbEndpoint,
		credentials: {
			accessKeyId: "local",
			secretAccessKey: "local",
		},
	};
}

export function createRuntimeDeps(): RuntimeDeps {
	const clientConfig = dynamoClientConfig(Environments);

	const adapter = Environments.oidcTableName
		? createDynamoOidcAdapterFactory({
				tableName: Environments.oidcTableName,
				clientConfig,
			})
		: undefined;

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

	const userRepository = Environments.oidcTableName
		? new DynamoUserRepository({
				tableName: Environments.oidcTableName,
				clientConfig,
			})
		: undefined;

	return {
		config: Environments,
		adapter,
		keyStore,
		userRepository,
	};
}
