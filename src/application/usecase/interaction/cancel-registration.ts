import type Provider from "oidc-provider";
import { requireSameOrigin } from "@/adapter/validation/same-origin.js";
import { validateUidMatches } from "@/adapter/validation/uid.js";
import type { InteractionRouterContext } from "@/application/type/context.js";
import { AppError, ErrorCodes } from "@/http/app-error.js";

/** Cancels an account-creation prompt and returns the authorization request to the RP. */
export const createInteractionCancelRegistrationUseCase = (provider: Provider) => {
	return async (input: { ctx: InteractionRouterContext }) => {
		const { ctx } = input;
		requireSameOrigin(ctx);

		const details = await provider.interactionDetails(ctx.req, ctx.res);
		validateUidMatches(details.uid, ctx.params.uid);
		if (details.prompt.name !== "create") {
			throw new AppError(400, ErrorCodes.registrationNotAllowed, "The current interaction cannot be cancelled");
		}

		const redirectTo = await provider.interactionResult(
			ctx.req,
			ctx.res,
			{
				error: "access_denied",
				error_description: "The End-User cancelled account creation",
			},
			{ mergeWithLastSubmission: false },
		);

		ctx.status = 200;
		ctx.body = { redirectTo };
	};
};
