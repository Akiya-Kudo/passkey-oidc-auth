import Koa from "koa";
import mount from "koa-mount";
import type { Provider } from "oidc-provider";
import { type CreateProviderOptions, createProvider } from "@/oidc/provider.js";
import { createRuntimeDeps } from "../infrastructure/index.js";
import { bindRoutes } from "./routes.js";

export type CreateOidcAppOptions = {
	providerOptions?: CreateProviderOptions;
};

export async function createOidcApp(
	options: CreateOidcAppOptions = {},
): Promise<{ app: Koa; provider: Provider }> {
	const deps = createRuntimeDeps();

	const providerDefaultOptions = {
		issuer: deps.config.issuer,
		adapter: deps.adapter,
		keyStore: deps.keyStore,
		userRepository: deps.userRepository,
		cookieKeys: deps.config.cookieKeys,
	};
	const provider = await createProvider(
		options.providerOptions ?? providerDefaultOptions,
	);

	const router = bindRoutes(provider);
	const app = new Koa();

	// TODO: API Gateway 経由時の proxy / secure cookie 設定を環境に合わせて調整
	// provider.proxy = true が必要な場合あり（X-Forwarded-Proto）
	provider.proxy = process.env.OIDC_TRUST_PROXY === "true";

	app.use(router.routes());
	app.use(router.allowedMethods());
	app.use(mount(provider));

	return { app, provider };
}
