import type { Client } from "oidc-provider";
import { AppError, ErrorCodes } from "@/http/app-error";

export function validateClientExists(client?: Client | null): asserts client is Client {
	if (!client) {
		throw new AppError(404, ErrorCodes.interactionContextClientNotFound, "Requested client not found");
	}
}
