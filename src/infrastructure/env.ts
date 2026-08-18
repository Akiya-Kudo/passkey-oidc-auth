import { parseEnv } from "../utils/env.js";

export type AppEnvs = {
	env?: string;
	issuer: string;
	// AWS
	awsRegion: string;
	oidcTableName: string;
	dynamodbEndpoint?: string; // 未設定時はAWSデフォルト
	/** 未設定時は InMemoryKeyStore（ローカル）。デプロイ時は CDK が注入する */
	jwksSecretArn?: string;
	// TODO: 本番 cookie 署名鍵を Secrets / SSM から読む
	cookieKeys: string[];
	localIdpPort?: number;
	trustProxy: boolean;
	/** TODO: DynamoDB / ClientRepository から動的読み込みに切り替える */
	oidcClientId: string;
	/** TODO: Secrets Manager 等へ移す（平文は学習用） */
	oidcClientSecret: string;
	oidcRedirectUris: string[];
	authMethod: string;
};

export const Environments: AppEnvs = {
	env: parseEnv("NODE_ENV", process.env.NODE_ENV, { optional: true }),
	issuer: parseEnv("ISSUER", process.env.ISSUER),
	oidcTableName: parseEnv("OIDC_TABLE_NAME", process.env.OIDC_TABLE_NAME),
	awsRegion: parseEnv("AWS_REGION", process.env.AWS_REGION),
	dynamodbEndpoint: parseEnv("DYNAMODB_ENDPOINT", process.env.DYNAMODB_ENDPOINT, {
		optional: true,
	}),
	jwksSecretArn: parseEnv("JWKS_SECRET_ARN", process.env.JWKS_SECRET_ARN, {
		optional: true,
	}),
	cookieKeys: (parseEnv("COOKIE_KEYS", process.env.COOKIE_KEYS, { optional: true }) ?? "local-dev-cookie-key").split(
		",",
	),
	localIdpPort: parseEnv("LOCAL_IDP_PORT", process.env.LOCAL_IDP_PORT, {
		type: "number",
		optional: true,
	}),
	trustProxy:
		parseEnv("OIDC_TRUST_PROXY", process.env.OIDC_TRUST_PROXY, {
			optional: true,
		}) === "true",
	oidcClientId:
		parseEnv("OIDC_CLIENT_ID", process.env.OIDC_CLIENT_ID, {
			optional: true,
		}) ?? "foo",
	oidcClientSecret:
		parseEnv("OIDC_CLIENT_SECRET", process.env.OIDC_CLIENT_SECRET, {
			optional: true,
		}) ?? "bar",
	oidcRedirectUris: (
		parseEnv("OIDC_REDIRECT_URIS", process.env.OIDC_REDIRECT_URIS, {
			optional: true,
		}) ?? "http://localhost:8080/cb"
	).split(","),
	authMethod:
		parseEnv("AUTH_METHOD", process.env.AUTH_METHOD, {
			optional: true,
		}) ?? "password",
};

export function isProduction(): boolean {
	return Environments.env === "production";
}
