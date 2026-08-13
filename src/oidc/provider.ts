import { type Configuration, Provider } from "oidc-provider";
import { createRuntimeDeps } from "@/infrastructure/index.js";
import { createFindAccount } from "./config/find-account.js";
import { oidcConfig } from "./config.js";

export async function createProvider(): Promise<Provider> {
	const clients = oidcConfig.clients;

	const deps = createRuntimeDeps();
	const { config, adapter, keyStore, userRepository } = deps;
	const { issuer, cookieKeys } = config;

	const configuration: Configuration = {
		clients,
		adapter,
		findAccount: await createFindAccount(userRepository),
		features: {
			devInteractions: { enabled: false },
			revocation: { enabled: true },
			introspection: { enabled: true },
		},
		routes: {
			authorization: oidcConfig.routes.authorization,
			token: oidcConfig.routes.token,
			userinfo: oidcConfig.routes.userinfo,
			jwks: oidcConfig.routes.jwks,
			revocation: oidcConfig.routes.revocation,
			introspection: oidcConfig.routes.introspection,
			end_session: oidcConfig.routes.endSession,
		},
		cookies: {
			keys: cookieKeys,
		},
	};

	configuration.jwks = await keyStore.getJwks();

	return new Provider(issuer, configuration);
}
