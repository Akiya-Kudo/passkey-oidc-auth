import type Provider from "oidc-provider";
import { validateClientExists } from "@/adapter/validation/client";
import { validatePrompt } from "@/adapter/validation/prompt";
import { validateUidMatches } from "@/adapter/validation/uid";
import { parseConsentDetails, parseInteractionParams } from "@/application/dto/interaction/interaction";
import type { InteractionRouterContext } from "@/application/type/context";
import type { AuthMethod } from "@/domain/auth-method";

/**
 * Interaction context Usecase
 *
 * Scenario
 * - Called by Interaction UI after oidc-provider redirects to /interaction/{uid}.
 * - One Interaction carries a single prompt at a time (login then consent are sequential
 *   Interactions if both are needed). This endpoint only reads that current prompt for the UI.
 *
 * Notes
 * - prompt.name / reasons are oidc-provider policy results, not a copy of the authorize
 *   request's prompt query param. We only expose name for screen switching.
 * - Do not re-check session or grant here; interactionDetails already reflects that decision.
 */
export const interactionContextUseCase = async (input: {
	provider: Provider;
	ctx: InteractionRouterContext;
	authMethod: AuthMethod;
}) => {
	const { provider, ctx, authMethod } = input;

	const { uid, prompt, params: rawParams } = await provider.interactionDetails(ctx.req, ctx.res);

	// return 404 if the UID in the cookie doesn't match the UID in the path params
	validateUidMatches(uid, ctx.params.uid);

	validatePrompt(prompt.name);

	const params = parseInteractionParams(rawParams);
	const client = await provider.Client.find(params.client_id);
	validateClientExists(client);

	// if prompt is consent, collect missingOIDCScope for the consent UI display
	const missingScopes = prompt.name === "consent" ? (parseConsentDetails(prompt.details).missingOIDCScope ?? []) : [];

	// set no-store to prevent persistent caching of in-progress content
	ctx.set("Cache-Control", "no-store");

	ctx.body = {
		uid,
		prompt: prompt.name,
		client: {
			id: params.client_id,
			name: client.clientName,
		},
		scopes: (params.scope ?? "").split(" ").filter(Boolean),
		missingScopes,
		authMethod: authMethod.toJSON(),
	};
};
