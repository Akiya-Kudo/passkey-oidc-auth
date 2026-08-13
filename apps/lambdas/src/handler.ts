import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createApiGatewayHandler, createOidcApp } from "@/http/index.js";

/**
 * API Gateway HTTP API → Koa + oidc-provider。
 * ルーティングは Koa / oidc-provider 側で行う。
 */
export const handler: APIGatewayProxyHandlerV2 = createApiGatewayHandler(
	async () => {
		const { app } = await createOidcApp();
		return app;
	},
);
