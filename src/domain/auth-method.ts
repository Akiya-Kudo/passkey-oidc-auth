import { parseCsvEnum } from "../utils/env.js";

export type AuthMethodType = "password" | "passkey";

const AUTH_METHOD_TYPES = ["password", "passkey"] as const satisfies readonly AuthMethodType[];

/**
 * 認証方法を管理するVO
 * - 認証基盤のログイン方式を環境変数から受け取り、提供するための判定に利用する
 */
export class AuthMethod {
	readonly methods: AuthMethodType[];

	constructor(methods: AuthMethodType[]) {
		this.methods = methods;
	}

	hasPassword(): boolean {
		return this.methods.includes("password");
	}

	hasPasskey(): boolean {
		return this.methods.includes("passkey");
	}

	static validateString(methods: string): AuthMethodType[] {
		return parseCsvEnum<AuthMethodType>(methods, AUTH_METHOD_TYPES, {
			name: "auth method",
		});
	}

	static fromString(methods: string): AuthMethod {
		return new AuthMethod(AuthMethod.validateString(methods));
	}
}
