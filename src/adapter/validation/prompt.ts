import { AppError, ErrorCodes } from "@/http/app-error";

export const validatePrompt = (prompt: string) => {
	if (prompt !== "login" && prompt !== "consent") {
		throw new AppError(400, ErrorCodes.unsupportedInteractionPrompt, `Unsupported interaction prompt: ${prompt}`);
	}
};
