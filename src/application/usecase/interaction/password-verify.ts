import { requireSameOrigin } from "@/adapter/validation/same-origin";
import { requireCurrentInteraction } from "@/adapter/validation/uid";
import { InteractionRouterContext } from "@/application/type/context";
import { AppError, ErrorCodes } from "@/http/app-error";
import Provider from "oidc-provider";

export const interactionPasswordVerifyUseCase = async (input: {
	provider: Provider;
	ctx: InteractionRouterContext;
}) => {
	const { provider, ctx } = input;
	requireSameOrigin(ctx);
	throw new AppError(501, ErrorCodes.notImplemented, "Password verification is not implemented yet", {
		expose: true,
	});
};
