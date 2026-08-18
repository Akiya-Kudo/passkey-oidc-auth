import type Provider from "oidc-provider";
import { checkInteractionUidMatches } from "@/adapter/validation/uid";
import { parseConsentDetails, parseInteractionParams } from "@/application/dto/interaction/interaction";
import type { InteractionRouterContext } from "@/application/type/context";
import type { AuthMethod } from "@/domain/auth-method";

/**
 * Interaction context Usecase
 *
 * Scenario
 * - Invoked by Interaction UI on client side when no session is established yet by an authorization request
 *
 * Process Flow
 * 1. Load the current interaction from oidc-provider (via Interaction cookie) with interactionDetails
 * 2. Ensure the URL :uid matches the interaction uid (reject mismatched / stale sessions)
 * 3. Resolve the OIDC client from params.client_id
 * 4. Read the current prompt name (login | consent) so the UI can choose the right screen
 * 5. Collect requested scopes; if prompt is consent, also collect missingOIDCScope for the consent UI
 * 6. Attach configured auth methods so the UI can render password / passkey controls
 * 7. Respond with Cache-Control: no-store and a JSON body (uid, prompt, client, scopes, missingScopes, authMethod)
 *
 * Notes
 * - Read-only: do not call interactionFinished here (login/consent completion is other endpoints)
 * - Current body assembly below is a provisional stub aligned with the Interaction UI contract
 */
export const interactionContextUseCase = async (input: {
	provider: Provider;
	ctx: InteractionRouterContext;
	authMethod: AuthMethod;
}) => {
	const { provider, ctx, authMethod } = input;

	const { uid, prompt, params: rawParams } = await provider.interactionDetails(ctx.req, ctx.res);

	// return 404 if the UID in the cookie doesn't match the UID in the path params
	checkInteractionUidMatches(uid, ctx.params.uid);

	const params = parseInteractionParams(rawParams);
	const client = await provider.Client.find(params.client_id);
	const missingScopes =
		prompt.name === "consent" ? (parseConsentDetails(prompt.details).missingOIDCScope ?? []) : [];

	ctx.set("Cache-Control", "no-store");
	ctx.body = {
		uid,
		prompt: prompt.name,
		client: {
			id: params.client_id,
			name: client?.clientName ?? client?.clientId ?? params.client_id,
		},
		scopes: (params.scope ?? "").split(" ").filter(Boolean),
		missingScopes,
		authMethod: authMethod.toJSON(),
	};
};
