import { type Configuration, interactionPolicy, errors as oidcErrors } from "oidc-provider";
import type { RuntimeDeps } from "@/infrastructure/dependency.js";
import { Environments } from "@/infrastructure/env.js";
import { createFindAccount } from "./config/account.js";
import { OidcClients } from "./config/clients.js";
import { OidcRoutes } from "./config/routes.js";
import { renderOidcError } from "./error-hooks.js";

export async function createConfiguration(deps: RuntimeDeps): Promise<Configuration> {
	const { adapter, userRepository, keyStore } = deps;
	const clients = OidcClients;
	const routes = OidcRoutes;
	const policy = interactionPolicy.base();
	// `create` must precede `login`; otherwise an unauthenticated authorization request
	// is sent to the login prompt before its requested account-creation prompt is checked.
	policy.add(
		new interactionPolicy.Prompt(
			{ name: "create", requestable: true },
			new interactionPolicy.Check("create_prompt_combination", "prompt=create must be used alone", (ctx) => {
				if (ctx.oidc.prompts.has("create") && ctx.oidc.prompts.size > 1) {
					throw new oidcErrors.InvalidRequest("prompt=create must be used alone");
				}
				return interactionPolicy.Check.NO_NEED_TO_PROMPT;
			}),
		),
		// `create` must be the first prompt checked.
		0,
	);

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
			policy,
			url(_ctx, interaction) {
				return `${OidcRoutes.interaction}/${interaction.uid}`;
			},
		},
		discovery: {
			prompt_values_supported: ["none", "login", "consent", "create"],
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
