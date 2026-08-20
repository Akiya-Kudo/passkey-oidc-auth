import * as z from "zod";
import { User, type UserId } from "@/domain/user.js";

const userIdSchema = z.string().min(1);

const userProfileItemSchema = z.object({
	id: userIdSchema,
	displayName: z.string().optional(),
	email: z.string().optional(),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
});

const emailIndexItemSchema = z.object({
	userId: userIdSchema,
});

export function parseUserProfileItem(item: unknown): User | null {
	const parsed = userProfileItemSchema.safeParse(item);
	if (!parsed.success) {
		return null;
	}
	return new User(parsed.data);
}

export function parseEmailIndexUserId(item: unknown): UserId | null {
	const parsed = emailIndexItemSchema.safeParse(item);
	if (!parsed.success) {
		return null;
	}
	return parsed.data.userId;
}
