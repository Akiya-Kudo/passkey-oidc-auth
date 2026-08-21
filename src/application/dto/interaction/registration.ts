import * as z from "zod";
import { plainPasswordSchema } from "@/domain/credential/password/password.js";
import { emailSchema } from "@/domain/user/email.js";
import { optionalDisplayNameSchema } from "@/domain/user/user.js";
import { AppError, ErrorCodes } from "@/http/app-error.js";

const registrationBodySchema = z.object(
	{
		email: emailSchema,
		displayName: optionalDisplayNameSchema,
		password: plainPasswordSchema,
	},
	{ error: "Request body must be a JSON object" },
);

export type RegistrationBody = z.infer<typeof registrationBodySchema>;

export function parseRegistrationBody(body: unknown): RegistrationBody {
	const parsed = registrationBodySchema.safeParse(body);
	if (!parsed.success) {
		const message = parsed.error.issues[0]?.message ?? "Request body must be a JSON object";
		throw new AppError(400, ErrorCodes.requestError, message);
	}

	return parsed.data;
}
