import type { AdapterFactory } from "oidc-provider";
import type { KeyStore, UserRepository } from "../domain/index.js";
import { EnvJwksKeyStore, InMemoryKeyStore } from "./aws/key-store.js";
import { KmsKeyStore } from "./aws/kms-key-store.js";
import { type AppConfig, loadConfig } from "./config.js";
import { createDynamoOidcAdapterFactory } from "./dynamodb/oidc-adapter.js";
import { DynamoUserRepository } from "./dynamodb/user-repository.js";

export type RuntimeDeps = {
	config: AppConfig;
	adapter?: AdapterFactory;
	keyStore: KeyStore;
	userRepository?: UserRepository;
};

/**
 * 環境変数から Adapter / KeyStore / Repository を組み立てる
 */
export function createRuntimeDeps(
	env: NodeJS.ProcessEnv = process.env,
): RuntimeDeps {
	const config = loadConfig(env);

	const clientConfig = {
		region: config.awsRegion,
		...(config.dynamodbEndpoint
			? {
					endpoint: config.dynamodbEndpoint,
					// DynamoDB Local 用ダミー資格情報
					credentials: {
						accessKeyId: env.AWS_ACCESS_KEY_ID ?? "local",
						secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? "local",
					},
				}
			: {}),
	};

	const adapter = config.oidcTableName
		? createDynamoOidcAdapterFactory({
				tableName: config.oidcTableName,
				clientConfig,
			})
		: undefined;

	let keyStore: KeyStore;
	if (env.JWKS_JSON) {
		keyStore = new EnvJwksKeyStore();
	} else if (config.jwksSecretArn) {
		// TODO: Secrets Manager から JWKS を取得する実装に置き換える
		// 現状はプレースホルダとして KmsKeyStore を立てて明示的に失敗させる
		keyStore = new KmsKeyStore(config.jwksSecretArn);
	} else {
		keyStore = new InMemoryKeyStore();
	}

	const userRepository = config.oidcTableName
		? new DynamoUserRepository({
				tableName: config.oidcTableName,
				clientConfig,
			})
		: undefined;

	return {
		config,
		adapter,
		keyStore,
		userRepository,
	};
}

export { EnvJwksKeyStore, InMemoryKeyStore } from "./aws/key-store.js";
export { KmsKeyStore } from "./aws/kms-key-store.js";
export { type AppConfig, loadConfig } from "./config.js";
export { DynamoClientRepository } from "./dynamodb/client-repository.js";
export {
	createDynamoOidcAdapterFactory,
	DynamoOidcAdapter,
} from "./dynamodb/oidc-adapter.js";
export { DynamoUserRepository } from "./dynamodb/user-repository.js";
