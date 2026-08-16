import type {
	Configuration,
	KoaContextWithOIDC,
	Provider,
} from "oidc-provider";
import { isProduction } from "@/infrastructure/env.js";
import { logError, logWarn } from "@/utils/logger.js";

export const renderOidcError: NonNullable<Configuration["renderError"]> = (
	ctx,
	out,
	error,
) => {
	ctx.type = "application/json";
	ctx.body = {
		error: out.error,
		error_description:
			isProduction() && out.error === "server_error"
				? "oops! something went wrong"
				: out.error_description,
		...(!isProduction() && error instanceof Error
			? { debug: { name: error.name, message: error.message } }
			: {}),
	};
};

function requestIdFrom(ctx: KoaContextWithOIDC): string | undefined {
	return ctx.get("x-request-id") || undefined;
}

export function bindOidcErrorHandlers(provider: Provider): void {
	provider.on("server_error", (ctx, err) => {
		logError({
			msg: "oidc.server_error",
			requestId: requestIdFrom(ctx),
			method: ctx.method,
			path: ctx.path,
			err,
		});
	});

	provider.on("authorization.error", (ctx, err) => {
		logWarn({
			msg: "oidc.authorization.error",
			requestId: requestIdFrom(ctx),
			method: ctx.method,
			path: ctx.path,
			error: err.error,
			error_description: err.error_description,
			err: isProduction() ? undefined : err,
		});
	});
}
