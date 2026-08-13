import Koa from "koa";
import mount from "koa-mount";
import type { AdapterFactory, Configuration, Provider } from "oidc-provider";
import type { KeyStore } from "@/domain/ports.js";
import { createProvider } from "@/oidc/provider.js";
import { bindCustomRoutes } from "./routes.js";

export async function createOidcApp(): Promise<{
	app: Koa;
	provider: Provider;
}> {
	const provider = await createProvider();

	const router = bindCustomRoutes(provider);
	const app = new Koa();

	// TODO: API Gateway 経由時の proxy / secure cookie 設定を環境に合わせて調整
	// provider.proxy = true が必要な場合あり（X-Forwarded-Proto）
	provider.proxy = process.env.OIDC_TRUST_PROXY === "true";

	app.use(router.routes());
	app.use(router.allowedMethods());
	app.use(mount(provider));

	return { app, provider };
}
