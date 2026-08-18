import { AppError, ErrorCodes } from "@/http/app-error";

/**
 * Types and parsers for the two Interaction fields that oidc-provider exposes as
 * `UnknownObject` (`{ [key: string]: unknown }`): `params` and `prompt.details`.
 *
 * Why they are untyped upstream:
 * - `params` holds the raw authorization request query. Its shape depends on the request
 *   (scope, PKCE, resource indicators, custom params), so the library cannot type it as
 *   one fixed object.
 * - `prompt.details` differs per prompt and is oidc-provider's own grant-diff data
 *   (missingOIDCScope etc.), not a standardized OIDC field.
 */

/**
 * Subset of the OIDC authorization request parameters we read from `Interaction.params`.
 * These are standard OAuth 2.0 / OIDC request params sent by the client to /authorize:
 * - client_id: required by the spec on every authorization request.
 * - scope: spec param, optional here because we only need it to display requested scopes
 *   (an OIDC request normally includes at least `openid`).
 */
export type InteractionParams = {
	client_id: string;
	scope?: string;
};

/**
 * Subset of `prompt.details` for the consent prompt. These are NOT OIDC spec fields;
 * oidc-provider computes them as the diff between what the client requested and what the
 * account has already granted, so the UI knows what still needs consent:
 * - missingOIDCScope: scopes not yet granted.
 * - missingOIDCClaims: individual claims not yet granted.
 * - missingResourceScopes: per-resource (API) scopes not yet granted, keyed by indicator.
 */
export type ConsentDetails = {
	missingOIDCScope?: string[];
	missingOIDCClaims?: string[];
	missingResourceScopes?: Record<string, string[]>;
};

export function parseInteractionParams(params: Record<string, unknown>): InteractionParams {
	if (typeof params.client_id !== "string" || params.client_id.length === 0) {
		throw new AppError(400, ErrorCodes.requestError, "Interaction is missing client_id");
	}
	return {
		client_id: params.client_id,
		scope: typeof params.scope === "string" ? params.scope : undefined,
	};
}

export function parseConsentDetails(details: Record<string, unknown>): ConsentDetails {
	return {
		missingOIDCScope: optionalStringArray(details.missingOIDCScope),
		missingOIDCClaims: optionalStringArray(details.missingOIDCClaims),
		missingResourceScopes: optionalResourceScopes(details.missingResourceScopes),
	};
}

function optionalStringArray(value: unknown): string[] | undefined {
	if (value === undefined) return undefined;
	if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
		throw new AppError(400, ErrorCodes.requestError, "Invalid interaction consent details");
	}
	return value;
}

function optionalResourceScopes(value: unknown): Record<string, string[]> | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value !== "object" || Array.isArray(value)) {
		throw new AppError(400, ErrorCodes.requestError, "Invalid interaction consent details");
	}
	const result: Record<string, string[]> = {};
	for (const [indicator, scopes] of Object.entries(value)) {
		const parsed = optionalStringArray(scopes);
		if (!parsed) {
			throw new AppError(400, ErrorCodes.requestError, "Invalid interaction consent details");
		}
		result[indicator] = parsed;
	}
	return result;
}
