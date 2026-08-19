import Router from "@koa/router";
import type { Provider } from "oidc-provider";
import { interactionConsentUseCase } from "@/application/usecase/interaction/concent.js";
import { interactionContextUseCase } from "@/application/usecase/interaction/context.js";
import { interactionPasswordVerifyUseCase } from "@/application/usecase/interaction/password-verify.js";
import { AuthMethod } from "@/domain/auth-method.js";
import { Environments } from "@/infrastructure/env.js";

/**
 * Resister IDP application routes
 * @param provider
 * @returns Router
 */
export function bindCustomRoutes(provider: Provider) {
	const router = new Router();
	/**
	 * Interaction context API
	 */
	router.get("/api/interactions/:uid/context", async (ctx) => {
		await interactionContextUseCase({ provider, ctx, authMethod: AuthMethod.fromString(Environments.authMethod) });
	});

	/**
	 * Interaction password login API
	 */
	router.post("/api/interactions/:uid/password/verify", async (ctx) => {
		await interactionPasswordVerifyUseCase({ provider, ctx });
	});

	/**
	 * Interaction consent API
	 */
	router.post("/api/interactions/:uid/confirm", async (ctx) => {
		await interactionConsentUseCase({ provider, ctx });
	});

	/**
	 * Health check API
	 */
	router.get("/health", async (ctx) => {
		ctx.body = { status: "ok" };
	});
	return router;
}
