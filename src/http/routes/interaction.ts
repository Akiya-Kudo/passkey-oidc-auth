import type Router from "@koa/router";
import type { DefaultContext, DefaultState, ParameterizedContext } from "koa";
import type { Provider } from "oidc-provider";
import { Environments } from "@/infrastructure/env.js";
import { AppError, ErrorCodes } from "../app-error.js";

type InteractionParams = {
	client_id: string;
	scope?: string;
};

type ConsentDetails = {
	missingOIDCScope?: string[];
	missingOIDCClaims?: string[];
	missingResourceScopes?: Record<string, string[]>;
};

type InteractionRouterContext = ParameterizedContext<
	DefaultState,
	DefaultContext & { params: Record<string, string> }
>;

function requireCurrentInteraction(ctx: InteractionRouterContext, uid: string) {
	if (ctx.params.uid !== uid) {
		throw new AppError(
			404,
			ErrorCodes.interactionNotFound,
			"Interaction not found",
		);
	}
}

function requireSameOrigin(ctx: InteractionRouterContext) {
	const origin = ctx.get("Origin");
	if (origin !== Environments.issuer) {
		throw new AppError(
			403,
			ErrorCodes.crossOriginForbidden,
			"Cross-origin interaction submission is not allowed",
		);
	}
}

export function registerInteractionRoutes(router: Router, provider: Provider) {
	router.get("/api/interactions/:uid/context", async (ctx) => {
		const details = await provider.interactionDetails(ctx.req, ctx.res);
		requireCurrentInteraction(ctx, details.uid);
		const params = details.params as InteractionParams;
		const consentDetails = details.prompt.details as ConsentDetails;
		const client = await provider.Client.find(params.client_id);

		ctx.set("Cache-Control", "no-store");
		ctx.body = {
			uid: details.uid,
			prompt: details.prompt.name,
			client: {
				id: params.client_id,
				name: client?.clientName ?? client?.clientId ?? params.client_id,
			},
			scopes: (params.scope ?? "").split(" ").filter(Boolean),
			missingScopes:
				details.prompt.name === "consent"
					? (consentDetails.missingOIDCScope ?? [])
					: [],
			authMethod: Environments.authMethod,
		};
	});

	router.post("/api/interactions/:uid/login", async (ctx) => {
		requireSameOrigin(ctx);
		// TODO: WebAuthn assertion を検証し、その検証結果から accountId を決定する。
		// accountId をクライアントから受け取って interactionFinished を呼んではならない。
		throw new AppError(
			501,
			ErrorCodes.notImplemented,
			"Passkey assertion verification is not implemented yet",
			{ expose: true },
		);
	});

	router.post("/api/interactions/:uid/confirm", async (ctx) => {
		requireSameOrigin(ctx);
		const details = await provider.interactionDetails(ctx.req, ctx.res);
		requireCurrentInteraction(ctx, details.uid);
		if (details.prompt.name !== "consent") {
			throw new AppError(
				400,
				ErrorCodes.consentNotRequired,
				"The current interaction does not require consent",
			);
		}
		const params = details.params as InteractionParams;
		const consentDetails = details.prompt.details as ConsentDetails;
		const accountId = details.session?.accountId;
		if (!accountId) {
			throw new AppError(
				400,
				ErrorCodes.unauthenticatedConsent,
				"The consent interaction has no authenticated account",
			);
		}

		let grant = details.grantId
			? await provider.Grant.find(details.grantId)
			: undefined;
		if (!grant) {
			grant = new provider.Grant({
				accountId,
				clientId: params.client_id,
			});
		}

		if (consentDetails.missingOIDCScope) {
			grant.addOIDCScope(consentDetails.missingOIDCScope.join(" "));
		}
		if (consentDetails.missingOIDCClaims) {
			grant.addOIDCClaims(consentDetails.missingOIDCClaims);
		}
		if (consentDetails.missingResourceScopes) {
			for (const [indicator, scopes] of Object.entries(
				consentDetails.missingResourceScopes,
			)) {
				grant.addResourceScope(indicator, scopes.join(" "));
			}
		}

		await provider.interactionFinished(
			ctx.req,
			ctx.res,
			{ consent: { grantId: await grant.save() } },
			{ mergeWithLastSubmission: true },
		);
		ctx.respond = false;
	});
}
