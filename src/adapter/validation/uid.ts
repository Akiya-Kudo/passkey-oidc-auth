import { AppError, ErrorCodes } from "@/http/app-error";
import { DefaultContext, DefaultState, ParameterizedContext } from "koa";

type InteractionRouterContext = ParameterizedContext<DefaultState, DefaultContext & { params: Record<string, string> }>;

export function requireCurrentInteraction(ctx: InteractionRouterContext, uid: string) {
	if (ctx.params.uid !== uid) {
		throw new AppError(404, ErrorCodes.interactionNotFound, "Interaction not found");
	}
}
