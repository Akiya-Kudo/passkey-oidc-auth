import type Provider from "oidc-provider";
import { requireSameOrigin } from "@/adapter/validation/same-origin";
import type { InteractionRouterContext } from "@/application/type/context";
import { AppError, ErrorCodes } from "@/http/app-error";

export const interactionPasswordVerifyUseCase = async (input: {
	provider: Provider;
	ctx: InteractionRouterContext;
}) => {
	const { ctx } = input;
	requireSameOrigin(ctx);
	throw new AppError(501, ErrorCodes.notImplemented, "Password verification is not implemented yet", {
		expose: true,
	});
};
