import { type ApiErrorBody, userMessageFor } from "../types/api-error";
import type { InteractionContext } from "../types/interaction";

function interactionApiUrl(uid: string, action?: "login" | "password/verify" | "confirm") {
	const encodedUid = encodeURIComponent(uid);
	const base = `/api/interactions/${encodedUid}`;
	return action ? `${base}/${action}` : `${base}/context`;
}

async function readApiError(response: Response, fallback: string): Promise<Error> {
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
	const response = await fetch(interactionApiUrl(uid), {
		credentials: "same-origin",
	});
	if (!response.ok) {
		throw await readApiError(response, "認証セッションを読み込めませんでした。");
	}
	return (await response.json()) as InteractionContext;
}

export async function submitPasskeyLogin(uid: string) {
	const response = await fetch(interactionApiUrl(uid, "login"), {
		method: "POST",
		credentials: "same-origin",
	});
	if (!response.ok) {
		throw await readApiError(response, "パスキー認証に失敗しました。");
	}
}

export async function submitPasswordLogin(uid: string, credentials: { email: string; password: string }) {
	const response = await fetch(interactionApiUrl(uid, "password/verify"), {
		method: "POST",
		credentials: "same-origin",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(credentials),
	});
	if (!response.ok) {
		throw await readApiError(response, "パスワード認証に失敗しました。");
	}
}

export function consentActionUrl(uid: string) {
	return interactionApiUrl(uid, "confirm");
}
