import type {
	APIGatewayProxyEventV2,
	APIGatewayProxyHandlerV2,
	APIGatewayProxyResultV2,
	Context,
} from "aws-lambda";
import type Koa from "koa";
import serverless from "serverless-http";

type CachedHandler = {
	app: Koa;
	handler: ReturnType<typeof serverless>;
};

let cache: CachedHandler | undefined;

/**
 * API Gateway HTTP API (payload v2) → Koa への変換ハンドラを返す。
 * Provider / 鍵生成はコールドスタート時に一度だけ行う想定。
 */
export function createApiGatewayHandler(
	createApp: () => Promise<Koa>,
): APIGatewayProxyHandlerV2 {
	return async (event: APIGatewayProxyEventV2, context: Context) => {
		if (!cache) {
			const app = await createApp();
			cache = {
				app,
				handler: serverless(app, {
					// TODO: binary media types が必要なら request/response 変換を拡張
				}),
			};
		}

		const result = await cache.handler(event, context);
		return result as APIGatewayProxyResultV2;
	};
}

/** テスト用にキャッシュを捨てる */
export function resetApiGatewayHandlerCache() {
	cache = undefined;
}
