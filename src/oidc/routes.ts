/**
 * OIDC endpoint パス定義（API Gateway / local-server で共有）
 * oidc-provider の `routes` 設定と一致させること
 */
export const OidcRoutes = {
	authorization: "/authorize",
	token: "/token",
	userinfo: "/userinfo",
	jwks: "/jwks",
	revocation: "/token/revocation",
	introspection: "/token/introspection",
	endSession: "/session/end",
	interaction: "/interaction",
	discovery: "/.well-known/openid-configuration",
} as const;

export type OidcRouteName = keyof typeof OidcRoutes;

/** Lambda 分割用のルートグループ */
export const LambdaRouteGroups = {
	metadata: [OidcRoutes.discovery, OidcRoutes.jwks] as const,
	authorization: [
		OidcRoutes.authorization,
		OidcRoutes.interaction,
		OidcRoutes.endSession,
	] as const,
	token: [
		OidcRoutes.token,
		OidcRoutes.userinfo,
		OidcRoutes.revocation,
		OidcRoutes.introspection,
	] as const,
} as const;
