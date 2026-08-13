import type {
	APIGatewayProxyEventV2,
	APIGatewayProxyHandlerV2,
	APIGatewayProxyResultV2,
	Context,
} from "aws-lambda";
import serverless from "serverless-http";
import { createOidcApp } from "@/http/koa.js";

/**
 * API Gateway HTTP API (payload v2) → Koa + oidc-provider。
 * Provider / 鍵生成はコールドスタート時に一度だけ行う。
 * ルーティングは Koa / oidc-provider 側で行う。
 */
let cached: ReturnType<typeof serverless> | undefined;

export const handler: APIGatewayProxyHandlerV2 = async (
	event: APIGatewayProxyEventV2,
	context: Context,
) => {
	if (!cached) {
		const { app } = await createOidcApp();
		cached = serverless(app, {
			// TODO: binary media types が必要なら request/response 変換を拡張
		});
	}

	const result = await cached(event, context);
	return result as APIGatewayProxyResultV2;
};
