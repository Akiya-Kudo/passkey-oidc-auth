import type { ClientMetadata } from "oidc-provider";
import { Environments } from "@/infrastructure/env.js";

/**
 * 静的 Client 定義。
 * TODO: DynamoDB / ClientRepository から動的読み込みに切り替える
 * TODO: client_secret は Secrets Manager 等へ移す（平文ハードコードは学習用）
 */
export const OidcClients: ClientMetadata[] = [
	{
		client_id: Environments.oidcClientId,
		client_secret: Environments.oidcClientSecret,
		redirect_uris: Environments.oidcRedirectUris,
		grant_types: ["authorization_code"],
		response_types: ["code"],
		token_endpoint_auth_method: "client_secret_post",
	},
];
