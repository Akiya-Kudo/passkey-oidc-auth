import type Router from "@koa/router";
import type { Provider } from "oidc-provider";
import { OidcRoutes } from "@/oidc/routes.js";

// TODO: Passkey ログイン・登録 UI を実装する（HTML or SPA）
// TODO: login 完了後に interactionFinished で accountId を返す
// TODO: consent フローを実装する
export function registerInteractionRoutes(router: Router, provider: Provider) {
	router.get(`${OidcRoutes.interaction}/:uid`, async (ctx) => {
		const details = await provider.interactionDetails(ctx.req, ctx.res);
		ctx.body = {
			uid: details.uid,
			prompt: details.prompt,
			params: details.params,
			// TODO: フロント向けに Passkey options エンドポイント情報を返す
		};
	});

	router.post(`${OidcRoutes.interaction}/:uid/login`, async (ctx) => {
		// TODO: Passkey verify 成功後の accountId を body から受け取り login を完了
		ctx.status = 501;
		ctx.body = {
			error: "not_implemented",
			message: "Passkey login interaction is not implemented yet",
		};
	});

	router.post(`${OidcRoutes.interaction}/:uid/confirm`, async (ctx) => {
		// TODO: consent 承認処理
		ctx.status = 501;
		ctx.body = {
			error: "not_implemented",
			message: "Consent interaction is not implemented yet",
		};
	});
}
