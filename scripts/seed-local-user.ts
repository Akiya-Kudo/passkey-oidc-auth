import { PasswordCredential } from "@/domain/credential/password/password.js";
import { Email } from "@/domain/user/email.js";
import { parseEnv } from "@/utils/env.js";
import { User } from "../src/domain/user/user.js";
import { UserId } from "../src/domain/user/user-id.js";
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
const email = Email.from(parseEnv("LOCAL_SEED_USER_EMAIL", process.env.LOCAL_SEED_USER_EMAIL));
const password = parseEnv("LOCAL_SEED_USER_PASSWORD", process.env.LOCAL_SEED_USER_PASSWORD);
const displayName = parseEnv("LOCAL_SEED_USER_DISPLAY_NAME", process.env.LOCAL_SEED_USER_DISPLAY_NAME);

const clientConfig = createDynamoDBClientConfig({ endpoint, region });
const users = new DynamoUserRepository({ tableName, clientConfig });
const passwords = new DynamoPasswordCredentialRepository({ tableName, clientConfig });

const now = new Date().toISOString();
const existing = await users.findByEmail(email);
const id = existing?.id ?? UserId.generate();

await users.save(
	new User({
		id,
		email,
		displayName,
		createdAt: existing?.createdAt ?? now,
		updatedAt: now,
	}),
);

await passwords.save(await PasswordCredential.fromPlain({ userId: id, password }));

console.log(`Seeded local user id=${id} email=${email}`);
