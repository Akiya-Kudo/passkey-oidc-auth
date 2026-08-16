import Koa from "koa";
import mount from "koa-mount";
import { Environments } from "@/infrastructure/env.js";
import { bindOidcErrorHandlers } from "@/oidc/error-hooks.js";
import { createProvider } from "@/oidc/provider.js";
import {
	type AppState,
	registerProcessErrorHandlers,
	requestIdAndErrorHandler,
} from "./error-handler.js";
import { bindCustomRoutes } from "./routes.js";

export async function createOidcApp(): Promise<{
	app: Koa<AppState>;
}> {
	registerProcessErrorHandlers();
	const provider = await createProvider();
	bindOidcErrorHandlers(provider);

	const router = bindCustomRoutes(provider);
	const app = new Koa<AppState>();

	// TODO: API Gateway 経由時の proxy / secure cookie 設定を環境に合わせて調整
	// provider.proxy = true が必要な場合あり（X-Forwarded-Proto）
	provider.proxy = Environments.trustProxy;

	app.use(requestIdAndErrorHandler());
	app.use(router.routes());
	app.use(router.allowedMethods());
	app.use(mount(provider));

	return { app };
}
