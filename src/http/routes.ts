import Router from "@koa/router";
import type { Provider } from "oidc-provider";
import { registerHealthRoutes } from "./routes/healthcheck.js";
import { registerInteractionRoutes } from "./routes/interaction.js";

export function bindCustomRoutes(provider: Provider) {
	const router = new Router();
	registerHealthRoutes(router);
	registerInteractionRoutes(router, provider);
	return router;
}
