import type { Middleware } from "koa";
import { errors as oidcErrors } from "oidc-provider";
import { isProduction } from "@/infrastructure/env.js";
import { logError, logWarn } from "@/utils/logger.js";
import { AppError, ErrorCodes, type PublicErrorBody, type PublicErrorKind } from "./app-error.js";

export const REQUEST_ID_HEADER = "x-request-id";

export type AppState = {
	requestId: string;
};

function httpStatus(err: unknown): number {
	if (err instanceof AppError) {
		return err.status;
	}
	if (hasNumber(err, "status")) {
		return err.status;
	}
	if (hasNumber(err, "statusCode")) {
		return err.statusCode;
	}
	return 500;
}

function hasNumber<K extends string>(err: unknown, key: K): err is Record<K, number> {
	return typeof err === "object" && err !== null && key in err && typeof (err as Record<K, unknown>)[key] === "number";
}

function oidcErrorDescription(err: unknown): string | undefined {
	if (typeof err !== "object" || err === null || !("error_description" in err)) {
		return undefined;
	}

	return typeof err.error_description === "string" ? err.error_description : undefined;
}

function withDebug(body: PublicErrorBody, err: unknown): PublicErrorBody {
	if (isProduction() || !(err instanceof Error)) {
		return body;
	}
	const errorDescription = oidcErrorDescription(err);
	return {
		...body,
		debug: {
			name: err.name,
			message: err.message,
			...(errorDescription ? { error_description: errorDescription } : {}),
		},
	};
}

function toPublicError(err: unknown): {
	status: number;
	body: PublicErrorBody;
} {
	if (err instanceof AppError) {
		const kind: PublicErrorKind = err.expose ? "request_error" : "server_error";
		return {
			status: err.status,
			body: withDebug(
				{
					error: kind,
					code: err.code,
					message: err.expose ? err.message : "Internal server error",
				},
				err,
			),
		};
	}

	if (err instanceof oidcErrors.SessionNotFound) {
		return {
			status: 400,
			body: withDebug(
				{
					error: "request_error",
					code: ErrorCodes.interactionSessionNotFound,
					message: "Authentication session not found",
				},
				err,
			),
		};
	}

	const status = httpStatus(err);
	if (status >= 500) {
		return {
			status,
			body: withDebug(
				{
					error: "server_error",
					code: ErrorCodes.serverError,
					message: "Internal server error",
				},
				err,
			),
		};
	}

	return {
		status,
		body: withDebug(
			{
				error: "request_error",
				code: ErrorCodes.requestError,
				message: err instanceof Error ? err.message : "Bad request",
			},
			err,
		),
	};
}

export function requestIdAndErrorHandler(): Middleware<AppState> {
	return async (ctx, next) => {
		const requestId = ctx.get(REQUEST_ID_HEADER) || crypto.randomUUID();
		ctx.state.requestId = requestId;
		ctx.req.headers[REQUEST_ID_HEADER] = requestId;
		ctx.set(REQUEST_ID_HEADER, requestId);

		try {
			await next();
		} catch (err) {
			const { status, body } = toPublicError(err);
			const fields = {
				msg: status >= 500 ? "unhandled" : "client_error",
				requestId,
				method: ctx.method,
				path: ctx.path,
				status,
				err,
			};
			if (status >= 500) {
				logError(fields);
			} else {
				logWarn(fields);
			}

			ctx.status = status;
			ctx.body = body;
		}
	};
}

let processHandlersRegistered = false;

export function registerProcessErrorHandlers(): void {
	if (processHandlersRegistered) {
		return;
	}
	processHandlersRegistered = true;

	process.on("unhandledRejection", (err) => {
		logError({ msg: "unhandledRejection", err });
	});
	process.on("uncaughtException", (err) => {
		logError({ msg: "uncaughtException", err });
	});
}
