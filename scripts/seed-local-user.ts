import { randomUUID } from "node:crypto";
import { normalizeEmail } from "../src/domain/email.js";
import { hashPassword } from "../src/domain/password.js";
import { createDynamoDBClientConfig } from "../src/infrastructure/dynamodb/config.js";
import { DynamoPasswordCredentialRepository } from "../src/infrastructure/dynamodb/password-credential-repository.js";
import { DynamoUserRepository } from "../src/infrastructure/dynamodb/user-repository.js";

/**
 * Seeds a local demo user for password login.
 *
 * Usage:
 *   OIDC_TABLE_NAME=passkey-oidc-local DYNAMODB_ENDPOINT=http://localhost:8000 \
 *   AWS_REGION=ap-northeast-1 pnpm seed:local-user
 *
 * Defaults: demo@example.com / password
 */
const tableName = requireEnv("OIDC_TABLE_NAME");
const endpoint = process.env.DYNAMODB_ENDPOINT;
const region = requireEnv("AWS_REGION");
const email = normalizeEmail(process.env.SEED_USER_EMAIL ?? "demo@example.com");
const password = process.env.SEED_USER_PASSWORD ?? "password";
const displayName = process.env.SEED_USER_DISPLAY_NAME ?? "Demo User";
const userId = randomUUID();

const clientConfig = createDynamoDBClientConfig({ endpoint, region });
const users = new DynamoUserRepository({ tableName, clientConfig });
const passwords = new DynamoPasswordCredentialRepository({ tableName, clientConfig });

const now = new Date().toISOString();
const existing = await users.findByEmail(email);
const id = existing?.id ?? userId;

await users.save({
	id,
	email,
	displayName,
	createdAt: existing?.createdAt ?? now,
	updatedAt: now,
});
await passwords.save({
	type: "password",
	userId: id,
	passwordHash: await hashPassword(password),
	algorithm: "scrypt",
});

console.log(`Seeded local user id=${id} email=${email}`);

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} is required`);
	}
	return value;
}
