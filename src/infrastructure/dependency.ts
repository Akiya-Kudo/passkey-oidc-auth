import type { KeyStore, PasswordCredentialRepository, UserRepository } from "@/domain/ports.js";
import { InMemoryKeyStore } from "./aws/key-store.js";
import { SecretsManagerKeyStore } from "./aws/secrets-manager-key-store.js";
import { createDynamoDBClientConfig } from "./dynamodb/config.js";
import { createDynamoOidcAdapterFactory } from "./dynamodb/factory.js";
import { DynamoPasswordCredentialRepository } from "./dynamodb/password-credential-repository.js";
import { DynamoUserRepository } from "./dynamodb/user-repository.js";
import { Environments } from "./env.js";

export type RuntimeDeps = {
	adapter: ReturnType<typeof createDynamoOidcAdapterFactory>;
	keyStore: KeyStore;
	userRepository: UserRepository;
	passwordCredentialRepository: PasswordCredentialRepository;
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
		tableName: Environments.userTableName,
		clientConfig: dynamoConfig,
	});

	const passwordCredentialRepository = new DynamoPasswordCredentialRepository({
		tableName: Environments.credentialTableName,
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
		passwordCredentialRepository,
	};
}
