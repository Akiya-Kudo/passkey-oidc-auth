import type { Client } from "oidc-provider";
import { AppError, ErrorCodes } from "@/http/app-error";

export const validateClientExists = (client?: Client | null) => {
	if (!client) {
		throw new AppError(404, ErrorCodes.interactionContextClientNotFound, "Requested client not found");
	}
};
