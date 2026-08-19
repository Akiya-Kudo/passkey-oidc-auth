import { interactionUrls, readApiError } from "./api";

export async function submitPasswordLogin(uid: string, credentials: { email: string; password: string }) {
	const response = await fetch(interactionUrls.passwordVerify(uid), {
		method: "POST",
		credentials: "same-origin",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(credentials),
	});
	if (!response.ok) {
		throw await readApiError(response, "パスワード認証に失敗しました。");
	}

	const { redirectTo } = await response.json();
	window.location.href = redirectTo;
}
