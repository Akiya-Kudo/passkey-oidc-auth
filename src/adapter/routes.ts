import Router from "@koa/router";
import type { Provider } from "oidc-provider";
import { createInteractionConsentUseCase } from "@/application/usecase/interaction/concent.js";
import { createInteractionContextUseCase } from "@/application/usecase/interaction/context";
import { createInteractionPasswordVerifyUseCase } from "@/application/usecase/interaction/password-verify.js";
import { AuthMethod } from "@/domain/oidc/auth-method.js";
import type { RuntimeDeps } from "@/infrastructure/dependency.js";
import { Environments } from "@/infrastructure/env.js";

/**
 * Resister IDP application routes
 * @param provider
 * @returns Router
 */
export function bindCustomRoutes(provider: Provider, deps: RuntimeDeps) {
	const router = new Router();
	const interactionContext = createInteractionContextUseCase(provider);
	const interactionPasswordVerify = createInteractionPasswordVerifyUseCase(provider, deps);
	const interactionConsent = createInteractionConsentUseCase(provider);

	/**
	 * Interaction context API
	 */
	router.get("/api/interactions/:uid/context", async (ctx) => {
		await interactionContext({ ctx, authMethod: AuthMethod.fromString(Environments.authMethod) });
	});

	/**
	 * Interaction password login API
	 */
	router.post("/api/interactions/:uid/password/verify", async (ctx) => {
		await interactionPasswordVerify({
			ctx,
		});
	});

	/**
	 * Interaction consent API
	 */

	router.post("/api/interactions/:uid/confirm", async (ctx) => {
		await interactionConsent({ ctx });
	});

	/**
	 * Health check API
	 */
	router.get("/health", async (ctx) => {
		ctx.body = { status: "ok" };
	});
	return router;
}
