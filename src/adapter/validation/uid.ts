import { AppError, ErrorCodes } from "@/http/app-error";

export function validateUidMatches(cookieUid: string, paramsUid?: string) {
	if (paramsUid !== cookieUid) {
		throw new AppError(404, ErrorCodes.interactionNotFound, "Interaction not found");
	}
}
