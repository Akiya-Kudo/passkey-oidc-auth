/**
 * API Gateway に載せるルートと、割り当てる Lambda 論理名
 * packages/oidc の OidcRoutes / LambdaRouteGroups と同期させること
 */
export type LambdaKind = "metadata" | "authorization" | "token";

export type HttpRouteDef = {
	/** API Gateway HTTP API の path（パラメータ含む） */
	path: string;
	/** 許可メソッド。ANY は使わず明示する */
	methods: Array<"GET" | "POST" | "OPTIONS">;
	lambda: LambdaKind;
};

export const httpRoutes: HttpRouteDef[] = [
	// metadata
	{
		path: "/.well-known/openid-configuration",
		methods: ["GET"],
		lambda: "metadata",
	},
	{
		path: "/jwks",
		methods: ["GET"],
		lambda: "metadata",
	},

	// authorization / interaction
	{
		path: "/authorize",
		methods: ["GET", "POST"],
		lambda: "authorization",
	},
	{
		path: "/interaction/{uid}",
		methods: ["GET"],
		lambda: "authorization",
	},
	{
		path: "/interaction/{uid}/login",
		methods: ["POST"],
		lambda: "authorization",
	},
	{
		path: "/interaction/{uid}/confirm",
		methods: ["POST"],
		lambda: "authorization",
	},
	{
		path: "/session/end",
		methods: ["GET", "POST"],
		lambda: "authorization",
	},

	// token
	{
		path: "/token",
		methods: ["POST"],
		lambda: "token",
	},
	{
		path: "/userinfo",
		methods: ["GET", "POST"],
		lambda: "token",
	},
	{
		path: "/token/revocation",
		methods: ["POST"],
		lambda: "token",
	},
	{
		path: "/token/introspection",
		methods: ["POST"],
		lambda: "token",
	},

	// health（authorization に寄せる。TODO: 必要なら専用 Lambda に分離）
	{
		path: "/health",
		methods: ["GET"],
		lambda: "authorization",
	},
];
