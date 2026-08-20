import z from "zod";
import { AppError, ErrorCodes } from "@/http/app-error";
import { Email, emailSchema } from "./email";
import { UserId, userIdSchema } from "./user-id";

const userSchema = z.object({
	id: userIdSchema,
	displayName: z.string().optional(),
	email: emailSchema.optional(),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
});

export class User {
	readonly id: UserId;
	readonly displayName?: string;
	readonly email?: Email;
	readonly createdAt: string;
	readonly updatedAt: string;

	constructor(props: {
		id: UserId;
		displayName?: string;
		email?: Email;
		createdAt: string;
		updatedAt: string;
	}) {
		this.id = props.id;
		this.displayName = props.displayName;
		this.email = props.email;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}

	static from(props: { id: UserId; displayName?: string; email?: Email; createdAt: string; updatedAt: string }): User {
		return new User(props);
	}

	static parse(item: unknown): User {
		const parsed = userSchema.safeParse(item);
		if (!parsed.success) {
			throw new AppError(400, ErrorCodes.invalidUser, "Invalid user");
		}
		return new User({
			id: UserId.from(parsed.data.id),
			displayName: parsed.data.displayName,
			email: parsed.data.email ? Email.from(parsed.data.email) : undefined,
			createdAt: parsed.data.createdAt,
			updatedAt: parsed.data.updatedAt,
		});
	}
}
