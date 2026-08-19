import type { Configuration } from "oidc-provider";
import { createRuntimeDeps, type RuntimeDeps } from "@/infrastructure/dependency.js";
import { Environments } from "@/infrastructure/env.js";
import { createFindAccount } from "./config/account.js";
import { OidcClients } from "./config/clients.js";
import { OidcRoutes } from "./config/routes.js";
import { renderOidcError } from "./error-hooks.js";

export async function createConfiguration(deps: RuntimeDeps = createRuntimeDeps()): Promise<Configuration> {
	const { adapter, userRepository, keyStore } = deps;
	const clients = OidcClients;
	const routes = OidcRoutes;

	return {
		clients,
		adapter,
		findAccount: await createFindAccount(userRepository),
		features: {
			devInteractions: { enabled: false },
			revocation: { enabled: true },
			introspection: { enabled: true },
		},
		interactions: {
			url(_ctx, interaction) {
				return `${OidcRoutes.interaction}/${interaction.uid}`;
			},
		},
		routes: {
			authorization: routes.authorization,
			token: routes.token,
			userinfo: routes.userinfo,
			jwks: routes.jwks,
			revocation: routes.revocation,
			introspection: routes.introspection,
			end_session: routes.endSession,
		},
		cookies: {
			// Cookie 著名様秘密鍵
			keys: Environments.cookieKeys,
			short: {
				path: "/",
			},
		},
		ttl: {
			Interaction: 60 * 60, // 1 hour
			Session: 14 * 24 * 60 * 60, // 14 days
			Grant: 14 * 24 * 60 * 60, // 14 days
		},
		renderError: renderOidcError,
		jwks: await keyStore.getJwks(),
	};
}
