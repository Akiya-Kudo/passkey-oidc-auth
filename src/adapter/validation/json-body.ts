import type { InteractionRouterContext } from "@/application/type/context";
import { AppError, ErrorCodes } from "@/http/app-error";

/**
 * Reads a JSON request body from the Node request stream.
 * Koa does not parse JSON by default; Interaction APIs that use fetch need this.
 */
export async function readJsonBody(ctx: InteractionRouterContext): Promise<unknown> {
	const contentType = ctx.get("content-type") ?? "";
	if (!contentType.toLowerCase().includes("application/json")) {
		throw new AppError(400, ErrorCodes.requestError, "Content-Type must be application/json");
	}

	const chunks: Buffer[] = [];
	for await (const chunk of ctx.req) {
		chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
	}
	const raw = Buffer.concat(chunks).toString("utf8");
	if (!raw) {
		throw new AppError(400, ErrorCodes.requestError, "Request body is empty");
	}
	try {
		return JSON.parse(raw) as unknown;
	} catch {
		throw new AppError(400, ErrorCodes.requestError, "Request body is not valid JSON");
	}
}
