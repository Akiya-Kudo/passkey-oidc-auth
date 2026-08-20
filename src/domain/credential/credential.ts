import type { UserId } from "../user/user-id.js";

/**
 * User に紐づくパスワード認証手段。Identity（誰か）ではなく「どう証明するか」。
 * Passkey は別型・別リポジトリ。Dynamo 上は同じテーブルの別 SK。
 */
export type PasswordCredential = {
	type: "password";
	userId: UserId;
	passwordHash: string;
	algorithm: "scrypt";
};
