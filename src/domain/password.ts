import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

function scryptDerive(
	password: string,
	salt: Buffer,
	keylen: number,
	n: number,
	r: number,
	p: number,
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scrypt(password, salt, keylen, { N: n, r, p }, (error, derivedKey) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(derivedKey);
		});
	});
}

/**
 * Encoded form: scrypt$N$r$p$salt$derived (salt/derived are base64url).
 * TODO: Learning-use only; prefer argon2id in production-oriented builds.
 */
export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const derived = await scryptDerive(password, salt, KEY_LEN, SCRYPT_N, SCRYPT_R, SCRYPT_P);
	return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
	const parts = encoded.split("$");
	if (parts.length !== 6 || parts[0] !== "scrypt") {
		return false;
	}
	const n = Number(parts[1]);
	const r = Number(parts[2]);
	const p = Number(parts[3]);
	const salt = Buffer.from(parts[4] ?? "", "base64url");
	const expected = Buffer.from(parts[5] ?? "", "base64url");
	if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p) || salt.length === 0 || expected.length === 0) {
		return false;
	}

	const actual = await scryptDerive(password, salt, expected.length, n, r, p);
	if (actual.length !== expected.length) {
		return false;
	}
	return timingSafeEqual(actual, expected);
}

let dummyHashPromise: Promise<string> | undefined;

/** Used when the account is missing so verify cost stays similar. */
export function getDummyPasswordHash(): Promise<string> {
	dummyHashPromise ??= hashPassword("timing-dummy-not-a-real-password");
	return dummyHashPromise;
}
