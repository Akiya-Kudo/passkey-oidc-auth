export const ErrorCodes = {
	serverError: "server_error",
	requestError: "request_error",
	interactionNotFound: "interaction_not_found",
	interactionSessionNotFound: "interaction_session_not_found",
	crossOriginForbidden: "cross_origin_forbidden",
	consentNotRequired: "consent_not_required",
	loginNotRequired: "login_not_required",
	unauthenticatedConsent: "unauthenticated_consent",
	invalidCredentials: "invalid_credentials",
	notImplemented: "not_implemented",
	interactionContextClientNotFound: "interaction_context_client_not_found",
	unsupportedInteractionPrompt: "unsupported_interaction_prompt",
	invalidEmail: "invalid_email",
	invalidUser: "invalid_user",
	invalidUserId: "invalid_user_id",
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
		error_description?: string;
	};
};

export class AppError extends Error {
	readonly status: number;
	readonly code: ErrorCode;
	readonly expose: boolean;

	constructor(status: number, code: ErrorCode, message: string, options?: { expose?: boolean }) {
		super(message);
		this.name = "AppError";
		this.status = status;
		this.code = code;
		this.expose = options?.expose ?? status < 500;
	}
}
