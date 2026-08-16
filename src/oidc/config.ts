import type { Configuration } from "oidc-provider";
import type { RuntimeDeps } from "@/infrastructure/index.js";
import { createFindAccount } from "./config/account.js";
import { OidcClients } from "./config/clients.js";
import { OidcRoutes } from "./config/routes.js";
import { renderOidcError } from "./error-hooks.js";

export const oidcConfig = {
	clients: OidcClients,
	routes: OidcRoutes,
};

export async function createConfiguration(
	deps: RuntimeDeps,
): Promise<Configuration> {
	const { config, adapter, userRepository, keyStore } = deps;
	return {
		clients: oidcConfig.clients,
		adapter,
		findAccount: await createFindAccount(userRepository),
		features: {
			devInteractions: { enabled: false },
			revocation: { enabled: true },
			introspection: { enabled: true },
		},
		interactions: {
			url(_ctx, interaction) {
				return `${oidcConfig.routes.interaction}/${interaction.uid}`;
			},
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
			keys: config.cookieKeys,
		},
		renderError: renderOidcError,
		jwks: await keyStore.getJwks(),
	};
}
