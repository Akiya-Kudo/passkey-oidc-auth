import type { FindAccount } from "oidc-provider";
import type { UserRepository } from "@/domain/ports.js";

export async function createFindAccount(
	userRepository: UserRepository,
): Promise<FindAccount> {
	return async (_ctx, id) => {
		const user = await userRepository.findById(id);
		if (!user) {
			return undefined;
		}
		return {
			accountId: user.id,
			async claims(_use, scope) {
				const email = scope.includes("email")
					? user.email
						? { email: user.email }
						: {}
					: {};

				const name = scope.includes("profile")
					? user.displayName
						? { name: user.displayName }
						: {}
					: {};
				return {
					sub: user.id,
					...email,
					...name,
				};
			},
		};
	};
}
