import { defaultPasswordKdf } from "@/domain/credential/password/algorithm/kdf.js";
import type { PasswordCredentialRepository, UserRepository } from "@/domain/ports.js";
import type { Email } from "@/domain/user/email.js";
import type { User } from "@/domain/user/user.js";

let dummyHashPromise: Promise<string> | undefined;

/** Used when the account is missing so verify cost stays similar. */
function getDummyPasswordHash(): Promise<string> {
	dummyHashPromise ??= defaultPasswordKdf().hash("timing-dummy-not-a-real-password");
	return dummyHashPromise;
}

export async function authenticateWithPassword(input: {
	userRepository: UserRepository;
	passwordCredentialRepository: PasswordCredentialRepository;
	email: Email;
	password: string;
}): Promise<User | null> {
	const user = await input.userRepository.findByEmail(input.email);
	const stored = user ? await input.passwordCredentialRepository.findByUserId(user.id) : null;
	const dummyHash = await getDummyPasswordHash();
	const ok = stored
		? await stored.verify(input.password)
		: await defaultPasswordKdf().verify(input.password, dummyHash);
	if (!user || !stored || !ok) {
		return null;
	}
	return user;
}
