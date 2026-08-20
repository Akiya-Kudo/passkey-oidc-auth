import z from "zod";
import { scryptKdf } from "./scrypt.js";

export const PASSWORD_KDF_NAMES = ["scrypt"] as const;

/** Key Derivation Function name stored on the credential. */
export type PasswordKdfName = (typeof PASSWORD_KDF_NAMES)[number];

export const passwordKdfNameSchema = z.enum(PASSWORD_KDF_NAMES);

export const defaultPasswordKdfName: PasswordKdfName = "scrypt";

/**
 * Password hashing strategy. Implementations live under `algorithm/`.
 */
export interface PasswordKdf {
	readonly name: PasswordKdfName;
	hash(plain: string): Promise<string>;
	verify(plain: string, encoded: string): Promise<boolean>;
}

export function passwordKdfFor(name: PasswordKdfName): PasswordKdf {
	switch (name) {
		case "scrypt":
			return scryptKdf;
		default: {
			const _exhaustive: never = name;
			return _exhaustive;
		}
	}
}

export function defaultPasswordKdf(): PasswordKdf {
	return passwordKdfFor(defaultPasswordKdfName);
}
