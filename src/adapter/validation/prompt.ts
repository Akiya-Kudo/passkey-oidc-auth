import { PROMPT_TYPES, type PromptType } from "@/domain/oidc/prompt";
import { AppError, ErrorCodes } from "@/http/app-error";

export const validatePrompt = (prompt: string) => {
	if (!PROMPT_TYPES.includes(prompt as unknown as PromptType)) {
		throw new AppError(400, ErrorCodes.unsupportedInteractionPrompt, `Unsupported interaction prompt: ${prompt}`);
	}
};
