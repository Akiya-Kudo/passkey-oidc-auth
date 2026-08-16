import type { AdapterFactory, Configuration } from "oidc-provider";
import type { KeyStore, UserRepository } from "@/domain/ports.js";
import { createFindAccount } from "./config/account.js";
import { OidcClients } from "./config/clients.js";
import { OidcRoutes } from "./config/routes.js";
import { renderOidcError } from "./error-hooks.js";

export async function createConfiguration(
	adapter: AdapterFactory,
	userRepository: UserRepository,
	keyStore: KeyStore,
	cookieKeys: string[],
): Promise<Configuration> {
	return {
		clients: OidcClients,
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
			authorization: OidcRoutes.authorization,
			token: OidcRoutes.token,
			userinfo: OidcRoutes.userinfo,
			jwks: OidcRoutes.jwks,
			revocation: OidcRoutes.revocation,
			introspection: OidcRoutes.introspection,
			end_session: OidcRoutes.endSession,
		},
		cookies: {
			keys: cookieKeys,
		},
		renderError: renderOidcError,
		jwks: await keyStore.getJwks(),
	};
}
