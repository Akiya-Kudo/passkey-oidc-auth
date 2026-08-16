import { isProduction } from "@/infrastructure/env.js";

export type LogLevel = "error" | "warn" | "info";

export type LogFields = {
	msg: string;
	requestId?: string;
	method?: string;
	path?: string;
	status?: number;
	error?: string;
	error_description?: string;
	err?: unknown;
};

type SerializedError = {
	name?: string;
	message: string;
	stack?: string;
	awsHttpStatus?: number;
	awsRequestId?: string;
};

function serializeError(err: unknown): SerializedError {
	if (!(err instanceof Error)) {
		return { message: String(err) };
	}

	const serialized: SerializedError = {
		name: err.name,
		message: err.message,
	};

	if (!isProduction() && err.stack) {
		serialized.stack = err.stack;
	}

	if (
		"$metadata" in err &&
		err.$metadata &&
		typeof err.$metadata === "object"
	) {
		const metadata = err.$metadata as {
			httpStatusCode?: number;
			requestId?: string;
		};
		if (metadata.httpStatusCode !== undefined) {
			serialized.awsHttpStatus = metadata.httpStatusCode;
		}
		if (metadata.requestId) {
			serialized.awsRequestId = metadata.requestId;
		}
	}

	return serialized;
}

function write(level: LogLevel, fields: LogFields): void {
	const { err, ...rest } = fields;
	const payload: Record<string, unknown> = { level, ...rest };
	if (err !== undefined) {
		payload.err = serializeError(err);
	}

	const line = isProduction() ? JSON.stringify(payload) : payload;
	if (level === "error") {
		console.error(line);
		return;
	}
	if (level === "warn") {
		console.warn(line);
		return;
	}
	console.log(line);
}

export function logError(fields: LogFields): void {
	write("error", fields);
}

export function logWarn(fields: LogFields): void {
	write("warn", fields);
}

export function logInfo(fields: LogFields): void {
	write("info", fields);
}
