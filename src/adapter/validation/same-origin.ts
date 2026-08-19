import type { InteractionRouterContext } from "@/application/type/context";
import { AppError, ErrorCodes } from "@/http/app-error";
import { Environments } from "@/infrastructure/env";

export function requireSameOrigin(ctx: InteractionRouterContext) {
	const origin = ctx.get("Origin");
	if (origin !== Environments.issuer) {
		throw new AppError(403, ErrorCodes.crossOriginForbidden, "Cross-origin interaction submission is not allowed");
	}
}
