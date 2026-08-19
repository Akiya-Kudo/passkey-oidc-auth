import { getDummyPasswordHash, verifyPassword } from "@/domain/password.js";
import type { PasswordCredentialRepository, UserRepository } from "@/domain/ports.js";
import type { User } from "@/domain/user.js";

export async function authenticateWithPassword(input: {
	userRepository: UserRepository;
	passwordCredentialRepository: PasswordCredentialRepository;
	email: string;
	password: string;
}): Promise<User | null> {
	const user = await input.userRepository.findByEmail(input.email);
	const stored = user ? await input.passwordCredentialRepository.findByUserId(user.id) : null;
	const ok = await verifyPassword(input.password, stored?.passwordHash ?? (await getDummyPasswordHash()));
	if (!user || !stored || !ok) {
		return null;
	}
	return user;
}
