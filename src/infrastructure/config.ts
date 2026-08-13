export type AppConfig = {
	issuer: string;
	/** DynamoDB テーブル名。未設定時は memory adapter */
	oidcTableName?: string;
	awsRegion: string;
	/** DynamoDB Local 等。未設定時は AWS デフォルト */
	dynamodbEndpoint?: string;
	/**
	 * TODO: Secrets Manager ARN を渡して署名鍵を読む
	 * 例: arn:aws:secretsmanager:ap-northeast-1:123:secret:oidc-jwks
	 */
	jwksSecretArn?: string;
	/**
	 * TODO: 本番 cookie 署名鍵を Secrets / SSM から読む
	 */
	cookieKeys: string[];
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
	const issuer = env.ISSUER ?? env.OIDC_ISSUER;
	if (!issuer) {
		throw new Error("ISSUER (or OIDC_ISSUER) environment variable is required");
	}

	return {
		issuer,
		oidcTableName: env.OIDC_TABLE_NAME,
		awsRegion: env.AWS_REGION ?? env.AWS_DEFAULT_REGION ?? "ap-northeast-1",
		dynamodbEndpoint: env.DYNAMODB_ENDPOINT,
		jwksSecretArn: env.JWKS_SECRET_ARN,
		cookieKeys: (env.COOKIE_KEYS ?? "local-dev-cookie-key").split(","),
	};
}
