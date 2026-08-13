import Koa from "koa";
import mount from "koa-mount";
import type { Provider } from "oidc-provider";
import { createRuntimeDeps } from "../infrastructure/index.js";
import { type CreateProviderOptions, createProvider } from "../oidc/index.js";
import { createAppRouter } from "./routes/index.js";

export type CreateOidcAppOptions = {
	providerOptions?: CreateProviderOptions;
};

export async function createOidcApp(
	options: CreateOidcAppOptions = {},
): Promise<{ app: Koa; provider: Provider }> {
	const deps = createRuntimeDeps();
	const provider =
		options.providerOptions != null
			? await createProvider(options.providerOptions)
			: await createProvider({
					issuer: deps.config.issuer,
					adapter: deps.adapter,
					keyStore: deps.keyStore,
					userRepository: deps.userRepository,
					cookieKeys: deps.config.cookieKeys,
				});

	const router = createAppRouter(provider);
	const app = new Koa();

	// TODO: API Gateway 経由時の proxy / secure cookie 設定を環境に合わせて調整
	// provider.proxy = true が必要な場合あり（X-Forwarded-Proto）
	provider.proxy = process.env.OIDC_TRUST_PROXY === "true";

	app.use(router.routes());
	app.use(router.allowedMethods());
	// koa-mount の型が @types/koa@2 前提のためキャスト
	app.use(mount(provider as unknown as Koa));

	return { app, provider };
}
