export const ErrorCodes = {
	serverError: "server_error",
	requestError: "request_error",
	interactionNotFound: "interaction_not_found",
	interactionSessionNotFound: "interaction_session_not_found",
	crossOriginForbidden: "cross_origin_forbidden",
	consentNotRequired: "consent_not_required",
	unauthenticatedConsent: "unauthenticated_consent",
	notImplemented: "not_implemented",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export type PublicErrorKind = "server_error" | "request_error";

export type PublicErrorBody = {
	error: PublicErrorKind;
	code: string;
	message: string;
	debug?: {
		name: string;
		message: string;
	};
};

export class AppError extends Error {
	readonly status: number;
	readonly code: ErrorCode;
	readonly expose: boolean;

	constructor(
		status: number,
		code: ErrorCode,
		message: string,
		options?: { expose?: boolean },
	) {
		super(message);
		this.name = "AppError";
		this.status = status;
		this.code = code;
		this.expose = options?.expose ?? status < 500;
	}
}
