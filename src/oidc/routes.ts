/**
 * OIDC endpoint パス定義。
 * oidc-provider の `routes` 設定と一致させること。
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
