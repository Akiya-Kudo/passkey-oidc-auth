import { type ApiErrorBody, userMessageFor } from "../types/api-error";
import type { InteractionContext } from "../types/interaction";

const interactionBaseUrl = (uid: string) => `/api/interactions/${encodeURIComponent(uid)}`;
export const interactionUrls = {
	context: (uid: string) => `${interactionBaseUrl(uid)}/context`,
	login: (uid: string) => `${interactionBaseUrl(uid)}/login`,
	passwordVerify: (uid: string) => `${interactionBaseUrl(uid)}/password/verify`,
	register: (uid: string) => `${interactionBaseUrl(uid)}/register`,
	cancelRegistration: (uid: string) => `${interactionBaseUrl(uid)}/register/cancel`,
	confirm: (uid: string) => `${interactionBaseUrl(uid)}/confirm`,
};

export async function readApiError(response: Response, fallback: string): Promise<Error> {
	let body: ApiErrorBody | undefined;
	try {
		body = (await response.json()) as ApiErrorBody;
	} catch {
		body = undefined;
	}
	if (import.meta.env.DEV && body?.debug) {
		console.debug("interaction api error", body);
	}
	return new Error(userMessageFor(body, fallback));
}

export async function fetchInteractionContext(uid: string) {
	const response = await fetch(interactionUrls.context(uid), {
		credentials: "same-origin",
	});
	if (!response.ok) {
		throw await readApiError(response, "認証セッションを読み込めませんでした。");
	}
	return (await response.json()) as InteractionContext;
}

export async function submitPasskeyLogin(uid: string) {
	const response = await fetch(interactionUrls.login(uid), {
		method: "POST",
		credentials: "same-origin",
	});
	if (!response.ok) {
		throw await readApiError(response, "パスキー認証に失敗しました。");
	}
}

export function consentActionUrl(uid: string) {
	return interactionUrls.confirm(uid);
}
