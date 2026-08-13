import Router from "@koa/router";
import type { Provider } from "oidc-provider";
import { registerHealthRoutes } from "./healthcheck.js";
import { registerInteractionRoutes } from "./interaction.js";

export function createAppRouter(provider: Provider) {
	const router = new Router();
	registerHealthRoutes(router);
	registerInteractionRoutes(router, provider);
	return router;
}
