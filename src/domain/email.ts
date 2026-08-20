import z from "zod";
import { AppError, ErrorCodes } from "@/http/app-error";

export const emailSchema = z.email();

export class Email {
	readonly value: string;

	constructor(value: string) {
		this.value = value;
	}

	static from(value: string): Email {
		return Email.parse(value);
	}

	static parse(value: string): Email {
		const parsed = emailSchema.safeParse(value);
		if (!parsed.success) {
			throw new AppError(400, ErrorCodes.invalidEmail, "Invalid email");
		}
		return new Email(parsed.data);
	}
}
