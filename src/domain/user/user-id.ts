import z from "zod";
import { AppError, ErrorCodes } from "@/http/app-error";

export const userIdSchema = z.uuid();

export class UserId {
	readonly value: string;

	constructor(value: string) {
		this.value = value;
	}

	static from(value: string): UserId {
		return UserId.parse(value);
	}

	static parse(value: string): UserId {
		const parsed = userIdSchema.safeParse(value);
		if (!parsed.success) {
			throw new AppError(400, ErrorCodes.invalidUserId, "Invalid user ID");
		}
		return new UserId(parsed.data);
	}

	static generate(): UserId {
		return new UserId(crypto.randomUUID());
	}

	toString(): string {
		return this.value;
	}

	toJSON(): string {
		return this.value;
	}
}
