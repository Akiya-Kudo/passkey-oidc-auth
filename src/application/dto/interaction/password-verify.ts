import * as z from "zod";
import { AppError, ErrorCodes } from "@/http/app-error";

const passwordVerifyBodySchema = z.object(
	{
		email: z.string().trim().min(1, "email is required"),
		password: z.string().min(1, "password is required"),
	},
	{ error: "Request body must be a JSON object" },
);

export type PasswordVerifyBody = z.infer<typeof passwordVerifyBodySchema>;

export function parsePasswordVerifyBody(body: unknown): PasswordVerifyBody {
	const parsed = passwordVerifyBodySchema.safeParse(body);
	if (!parsed.success) {
		const message = parsed.error.issues[0]?.message ?? "Request body must be a JSON object";
		throw new AppError(400, ErrorCodes.requestError, message);
	}
	return parsed.data;
}
