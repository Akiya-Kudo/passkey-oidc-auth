import type Provider from "oidc-provider";
import { requireSameOrigin } from "@/adapter/validation/same-origin";
import { checkInteractionUidMatches } from "@/adapter/validation/uid";
import { parseConsentDetails, parseInteractionParams } from "@/application/dto/interaction/interaction";
import type { InteractionRouterContext } from "@/application/type/context";
import { AppError, ErrorCodes } from "@/http/app-error";

export const interactionConsentUseCase = async (input: { provider: Provider; ctx: InteractionRouterContext }) => {
	const { provider, ctx } = input;
	requireSameOrigin(ctx);
	const details = await provider.interactionDetails(ctx.req, ctx.res);
	checkInteractionUidMatches(details.uid, ctx.params.uid);
	if (details.prompt.name !== "consent") {
		throw new AppError(400, ErrorCodes.consentNotRequired, "The current interaction does not require consent");
	}
	const params = parseInteractionParams(details.params);
	const consentDetails = parseConsentDetails(details.prompt.details);
	const accountId = details.session?.accountId;
	if (!accountId) {
		throw new AppError(400, ErrorCodes.unauthenticatedConsent, "The consent interaction has no authenticated account");
	}

	let grant = details.grantId ? await provider.Grant.find(details.grantId) : undefined;
	if (!grant) {
		grant = new provider.Grant({
			accountId,
			clientId: params.client_id,
		});
	}

	if (consentDetails.missingOIDCScope) {
		grant.addOIDCScope(consentDetails.missingOIDCScope.join(" "));
	}
	if (consentDetails.missingOIDCClaims) {
		grant.addOIDCClaims(consentDetails.missingOIDCClaims);
	}
	if (consentDetails.missingResourceScopes) {
		for (const [indicator, scopes] of Object.entries(consentDetails.missingResourceScopes)) {
			grant.addResourceScope(indicator, scopes.join(" "));
		}
	}

	await provider.interactionFinished(
		ctx.req,
		ctx.res,
		{ consent: { grantId: await grant.save() } },
		{ mergeWithLastSubmission: true },
	);
	ctx.respond = false;
};
