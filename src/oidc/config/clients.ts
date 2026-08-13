import type { ClientMetadata } from "oidc-provider";

/**
 * 静的 Client 定義。
 * TODO: DynamoDB / ClientRepository から動的読み込みに切り替える
 * TODO: client_secret は Secrets Manager 等へ移す（平文ハードコードは学習用）
 */
export const OidcClients: ClientMetadata[] = [
	{
		client_id: process.env.OIDC_CLIENT_ID ?? "foo",
		client_secret: process.env.OIDC_CLIENT_SECRET ?? "bar",
		redirect_uris: (
			process.env.OIDC_REDIRECT_URIS ?? "http://localhost:8080/cb"
		).split(","),
		grant_types: ["authorization_code"],
		response_types: ["code"],
		token_endpoint_auth_method: "client_secret_post",
	},
];
