import type { FindAccount } from "oidc-provider";
import type { UserRepository } from "@/domain/ports.js";
import { UserId } from "@/domain/user/user-id.js";

export async function createFindAccount(userRepository: UserRepository): Promise<FindAccount> {
	return async (_ctx, id) => {
		const user = await userRepository.findById(UserId.from(id));
		if (!user) {
			return undefined;
		}
		return {
			accountId: user.id.value,
			async claims(_use, scope) {
				const email = scope.includes("email") && user.email ? { email: user.email.value } : {};
				const name = scope.includes("profile") && user.displayName ? { name: user.displayName } : {};
				return {
					sub: user.id.value,
					...email,
					...name,
				};
			},
		};
	};
}
