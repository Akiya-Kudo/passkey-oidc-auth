import { randomUUID } from "node:crypto";
import { Email } from "@/domain/user/email.js";
import { parseEnv } from "@/utils/env.js";
import { hashPassword } from "../src/domain/password.js";
import { User } from "../src/domain/user/user.js";
import { createDynamoDBClientConfig } from "../src/infrastructure/dynamodb/config.js";
import { DynamoPasswordCredentialRepository } from "../src/infrastructure/dynamodb/password-credential-repository.js";
import { DynamoUserRepository } from "../src/infrastructure/dynamodb/user-repository.js";

/**
 * Seeds a local demo user for password login.
 *
 * Usage:
 *   OIDC_TABLE_NAME=passkey-oidc-local LOCAL_DYNAMODB_ENDPOINT=http://localhost:8000 \
 *   AWS_REGION=ap-northeast-1 pnpm seed:local-user
 *
 * Defaults: demo@example.com / password
 */
const tableName = parseEnv("OIDC_TABLE_NAME", process.env.OIDC_TABLE_NAME);
const endpoint = parseEnv("LOCAL_DYNAMODB_ENDPOINT", process.env.LOCAL_DYNAMODB_ENDPOINT);
const region = parseEnv("AWS_REGION", process.env.AWS_REGION);
const email = Email.fromString(parseEnv("LOCAL_SEED_USER_EMAIL", process.env.LOCAL_SEED_USER_EMAIL));
const password = parseEnv("LOCAL_SEED_USER_PASSWORD", process.env.LOCAL_SEED_USER_PASSWORD);
const displayName = parseEnv("LOCAL_SEED_USER_DISPLAY_NAME", process.env.LOCAL_SEED_USER_DISPLAY_NAME);
const userId = randomUUID();

const clientConfig = createDynamoDBClientConfig({ endpoint, region });
const users = new DynamoUserRepository({ tableName, clientConfig });
const passwords = new DynamoPasswordCredentialRepository({ tableName, clientConfig });

const now = new Date().toISOString();
const existing = await users.findByEmail(email);
const id = existing?.id ?? userId;

await users.save(
	new User({
		id,
		email: Email.fromString(email.value),
		displayName,
		createdAt: existing?.createdAt ?? now,
		updatedAt: now,
	}),
);

await passwords.save({
	type: "password",
	userId: id,
	passwordHash: await hashPassword(password),
	algorithm: "scrypt",
});

console.log(`Seeded local user id=${id} email=${email}`);
