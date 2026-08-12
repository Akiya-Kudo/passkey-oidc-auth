import type Router from "@koa/router";
import type { Provider } from "oidc-provider";

export function registerInteractionRoutes(router: Router, provider: Provider) {
	router.get("/interaction/:uid", async (ctx) => {
		const details = await provider.interactionDetails(ctx.req, ctx.res);
		ctx.body = details;
		// TODO: handle interaction
	});
}
