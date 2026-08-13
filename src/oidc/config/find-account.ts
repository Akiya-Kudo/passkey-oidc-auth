import type { FindAccount } from "oidc-provider";
import type { UserRepository } from "@/domain/ports.js";

export async function createFindAccount(
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
