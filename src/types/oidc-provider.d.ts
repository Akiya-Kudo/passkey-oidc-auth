/**
 * Minimal ambient types for oidc-provider (package ships without .d.ts).
 * TODO: 公式型定義が付いたら削除し、パッケージ型に置き換える
 */
declare module "oidc-provider" {
	import type { IncomingMessage, ServerResponse } from "node:http";
	import type Koa from "koa";

	export type AdapterPayload = Record<string, unknown> & {
		jti?: string;
		kind?: string;
		exp?: number;
		iat?: number;
		uid?: string;
		userCode?: string;
		grantId?: string;
		consumed?: number;
	};

	export type Adapter = {
		upsert(
			id: string,
			payload: AdapterPayload,
			expiresIn?: number,
		): Promise<void>;
		find(id: string): Promise<AdapterPayload | undefined>;
		findByUserCode?(userCode: string): Promise<AdapterPayload | undefined>;
		findByUid?(uid: string): Promise<AdapterPayload | undefined>;
		destroy(id: string): Promise<void>;
		revokeByGrantId?(grantId: string): Promise<void>;
		consume?(id: string): Promise<void>;
	};

	export type AdapterFactory = (name: string) => Adapter;

	export type ClientMetadata = {
		client_id: string;
		client_secret?: string;
		redirect_uris: string[];
		grant_types?: string[];
		response_types?: string[];
		token_endpoint_auth_method?: string;
		[key: string]: unknown;
	};

	export type AccountClaims = Record<string, unknown> & { sub: string };

	export type Account = {
		accountId: string;
		claims: (
			use: string,
			scope: string,
			claims: Record<string, unknown>,
			rejected: string[],
		) => Promise<AccountClaims> | AccountClaims;
	};

	export type FindAccount = (
		ctx: Koa.Context,
		id: string,
		token?: unknown,
	) => Promise<Account | undefined>;

	export type Configuration = {
		adapter?: AdapterFactory | (new (name: string) => Adapter);
		clients?: ClientMetadata[];
		features?: Record<string, unknown>;
		findAccount?: FindAccount;
		jwks?: { keys: Record<string, unknown>[] };
		cookies?: { keys?: string[]; [key: string]: unknown };
		routes?: Partial<{
			authorization: string;
			token: string;
			userinfo: string;
			jwks: string;
			revocation: string;
			introspection: string;
			end_session: string;
		}>;
		pkce?: { required?: () => boolean; methods?: string[] };
		[key: string]: unknown;
	};

	export type InteractionResults = Record<string, unknown>;

	export class Provider extends Koa {
		constructor(issuer: string, configuration?: Configuration);
		callback(): (req: IncomingMessage, res: ServerResponse) => void;
		interactionDetails(
			req: IncomingMessage,
			res: ServerResponse,
		): Promise<{
			uid: string;
			prompt: {
				name: string;
				reasons: string[];
				details: Record<string, unknown>;
			};
			params: Record<string, unknown>;
			session?: { accountId?: string };
			[key: string]: unknown;
		}>;
		interactionFinished(
			req: IncomingMessage,
			res: ServerResponse,
			result: InteractionResults,
			options?: { mergeWithLastSubmission?: boolean },
		): Promise<void>;
		interactionResult(
			req: IncomingMessage,
			res: ServerResponse,
			result: InteractionResults,
			options?: { mergeWithLastSubmission?: boolean },
		): Promise<string>;
	}
}
