import { parseEnv } from "../../utils/env.js";

export type AppEnvs = {
	issuer: string;
	// AWS
	awsRegion: string;
	oidcTableName: string;
	dynamodbEndpoint?: string; // 未設定時はAWSデフォルト
	// TODO: Secrets Manager ARN を渡して署名鍵を読む
	jwksSecretArn?: string; // 未設定時はプレースホルダとして KmsKeyStore を立てて明示的に失敗させている
	// TODO: 本番 cookie 署名鍵を Secrets / SSM から読む
	cookieKeys: string[];
	localPort?: number;
};

export const Environments: AppEnvs = {
	issuer: parseEnv("ISSUER", process.env.ISSUER),
	oidcTableName: parseEnv("OIDC_TABLE_NAME", process.env.OIDC_TABLE_NAME),
	awsRegion: parseEnv(
		"AWS_REGION",
		process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION,
	),
	dynamodbEndpoint: parseEnv(
		"DYNAMODB_ENDPOINT",
		process.env.DYNAMODB_ENDPOINT,
		{ optional: true },
	),
	jwksSecretArn: parseEnv("JWKS_SECRET_ARN", process.env.JWKS_SECRET_ARN, {
		optional: true,
	}),
	cookieKeys: (
		parseEnv("COOKIE_KEYS", process.env.COOKIE_KEYS, { optional: true }) ??
		"local-dev-cookie-key"
	).split(","),
	localPort: parseEnv("LOCAL_PORT", process.env.LOCAL_PORT, {
		type: "number",
		optional: true,
	}),
};
