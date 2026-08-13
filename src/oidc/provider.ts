import {
	type AdapterFactory,
	type Configuration,
	type FindAccount,
	Provider,
} from "oidc-provider";
import type { KeyStore, UserRepository } from "@/domain/ports.js";
import { getStaticClients } from "./clients.js";
import { OidcRoutes } from "./routes.js";

export type CreateProviderOptions = {
	issuer: string;
	/** 未指定時は oidc-provider 内蔵 MemoryAdapter（ローカル専用） */
	adapter?: AdapterFactory;
	keyStore?: KeyStore;
	userRepository?: UserRepository;
	/** cookie 署名鍵。TODO: Secrets Manager / SSM から注入 */
	cookieKeys?: string[];
	clients?: Configuration["clients"];
};

async function createFindAccount(
	userRepository?: UserRepository,
): Promise<FindAccount> {
	return async (_ctx, id) => {
		if (userRepository) {
			const user = await userRepository.findById(id);
			if (!user) {
				return undefined;
			}
			return {
				accountId: user.id,
				async claims() {
					return {
						sub: user.id,
						...(user.email ? { email: user.email } : {}),
						...(user.displayName ? { name: user.displayName } : {}),
					};
				},
			};
		}

		// TODO: UserRepository 必須化。現状は学習用に accountId のみ返す
		return {
			accountId: id,
			async claims() {
				return { sub: id };
			},
		};
	};
}

export async function createProvider(
	options: CreateProviderOptions,
): Promise<Provider> {
	const {
		issuer,
		adapter,
		keyStore,
		userRepository,
		cookieKeys = (process.env.COOKIE_KEYS ?? "local-dev-cookie-key").split(","),
		clients = getStaticClients(),
	} = options;

	const configuration: Configuration = {
		clients,
		adapter,
		findAccount: await createFindAccount(userRepository),
		features: {
			devInteractions: { enabled: false },
			revocation: { enabled: true },
			introspection: { enabled: true },
		},
		routes: {
			authorization: OidcRoutes.authorization,
			token: OidcRoutes.token,
			userinfo: OidcRoutes.userinfo,
			jwks: OidcRoutes.jwks,
			revocation: OidcRoutes.revocation,
			introspection: OidcRoutes.introspection,
			end_session: OidcRoutes.endSession,
		},
		cookies: {
			keys: cookieKeys,
		},
	};

	if (keyStore) {
		configuration.jwks = await keyStore.getJwks();
	} else {
		// TODO: 本番では必ず KeyStore（Secrets Manager / KMS）を渡す。
		// 未指定時は oidc-provider が起動時に一時鍵を生成するが、
		// Lambda ではコールドスタート毎に鍵が変わり検証が壊れる。
	}

	return new Provider(issuer, configuration);
}
