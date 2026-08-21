import { interactionUrls, readApiError } from "./api";

type RegistrationInput = {
	email: string;
	displayName?: string;
	password: string;
};

export async function submitRegistration(uid: string, input: RegistrationInput) {
	const response = await fetch(interactionUrls.register(uid), {
		method: "POST",
		credentials: "same-origin",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!response.ok) {
		throw await readApiError(response, "Failed to create account.");
	}

	const { redirectTo } = (await response.json()) as { redirectTo: string };
	window.location.assign(redirectTo);
}

export async function cancelRegistration(uid: string) {
	const response = await fetch(interactionUrls.cancelRegistration(uid), {
		method: "POST",
		credentials: "same-origin",
	});
	if (!response.ok) {
		throw await readApiError(response, "Failed to cancel account creation.");
	}

	const { redirectTo } = (await response.json()) as { redirectTo: string };
	window.location.assign(redirectTo);
}
