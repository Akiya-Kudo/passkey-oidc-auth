import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
	createApiGatewayHandler,
	createOidcApp,
} from "../../../src/http/index.js";

/**
 * Lambda 共通: Koa + oidc-provider アプリを生成して API Gateway に橋渡しする。
 * ルート分割は API Gateway 側で行い、各 Lambda は同一アプリを載せる。
 */
export const handler: APIGatewayProxyHandlerV2 = createApiGatewayHandler(
	async () => {
		const { app } = await createOidcApp();
		return app;
	},
);
