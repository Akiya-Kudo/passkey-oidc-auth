import z from "zod";
import { type UserId, userIdSchema } from "../../user/user-id.js";
import { CredentialType } from "../type.js";
import {
	defaultPasswordKdfName,
	type PasswordKdfName,
	passwordKdfFor,
	passwordKdfNameSchema,
} from "./algorithm/kdf.js";

export const plainPasswordSchema = z.string().min(12, "password must be at least 12 characters").max(1024);

export const PasswordCredentialSchema = z.object({
	type: z.literal(CredentialType.Password.toString()),
	userId: userIdSchema,
	passwordHash: z.string().min(1),
	algorithm: passwordKdfNameSchema,
});

/**
 * User に紐づくパスワード認証手段。Identity（誰か）ではなく「どう証明するか」。
 * Passkey は別型・別リポジトリ。Dynamo 上は同じテーブルの別 SK。
 */
export class PasswordCredential {
	readonly type: CredentialType.Password;
	readonly userId: UserId;
	readonly passwordHash: string;
	readonly algorithm: PasswordKdfName;

	constructor(props: {
		type: CredentialType.Password;
		userId: UserId;
		passwordHash: string;
		algorithm: PasswordKdfName;
	}) {
		this.type = props.type;
		this.userId = props.userId;
		this.passwordHash = props.passwordHash;
		this.algorithm = props.algorithm;
	}

	static fromHash(props: { userId: UserId; passwordHash: string; algorithm?: PasswordKdfName }): PasswordCredential {
		return new PasswordCredential({
			type: CredentialType.Password,
			userId: props.userId,
			passwordHash: props.passwordHash,
			algorithm: props.algorithm ?? defaultPasswordKdfName,
		});
	}

	static async fromPlain(props: {
		userId: UserId;
		password: string;
		algorithm?: PasswordKdfName;
	}): Promise<PasswordCredential> {
		const kdf = passwordKdfFor(props.algorithm ?? defaultPasswordKdfName);
		const passwordHash = await kdf.hash(props.password);
		return new PasswordCredential({
			type: CredentialType.Password,
			userId: props.userId,
			passwordHash,
			algorithm: kdf.name,
		});
	}

	verify(plain: string): Promise<boolean> {
		return passwordKdfFor(this.algorithm).verify(plain, this.passwordHash);
	}
}
