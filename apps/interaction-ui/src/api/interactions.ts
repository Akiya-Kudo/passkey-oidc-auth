import type { InteractionContext } from "../types/interaction";

function interactionApiUrl(uid: string, action?: "login" | "confirm") {
	const encodedUid = encodeURIComponent(uid);
	const base = `/api/interactions/${encodedUid}`;
	return action ? `${base}/${action}` : `${base}/context`;
}

async function readErrorMessage(response: Response, fallback: string) {
	try {
		const body = (await response.json()) as { message?: string };
		return body.message ?? fallback;
	} catch {
		return fallback;
	}
}

export async function fetchInteractionContext(uid: string) {
	const response = await fetch(interactionApiUrl(uid), {
		credentials: "same-origin",
	});
	if (!response.ok) {
		throw new Error("認証セッションを読み込めませんでした。");
	}
	return (await response.json()) as InteractionContext;
}

export async function submitLogin(uid: string) {
	const response = await fetch(interactionApiUrl(uid, "login"), {
		method: "POST",
		credentials: "same-origin",
	});
	if (!response.ok) {
		throw new Error(
			await readErrorMessage(response, "パスキー認証に失敗しました。"),
		);
	}
}

export function consentActionUrl(uid: string) {
	return interactionApiUrl(uid, "confirm");
}
