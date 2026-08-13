export type OAuthClientId = string;

export type OAuthClient = {
	clientId: OAuthClientId;
	/** TODO: Secrets Manager 等で管理する。平文保存は学習用のみ */
	clientSecret?: string;
	redirectUris: string[];
	grantTypes?: string[];
	responseTypes?: string[];
	tokenEndpointAuthMethod?: string;
};
