import { AppError, ErrorCodes } from "@/http/app-error";

export type PasswordVerifyBody = {
	email: string;
	password: string;
};

export function parsePasswordVerifyBody(body: unknown): PasswordVerifyBody {
	if (typeof body !== "object" || body === null || Array.isArray(body)) {
		throw new AppError(400, ErrorCodes.requestError, "Request body must be a JSON object");
	}
	const record = body as Record<string, unknown>;
	const email = record.email;
	const password = record.password;
	if (typeof email !== "string" || email.trim().length === 0) {
		throw new AppError(400, ErrorCodes.requestError, "email is required");
	}
	if (typeof password !== "string" || password.length === 0) {
		throw new AppError(400, ErrorCodes.requestError, "password is required");
	}
	return { email, password };
}
