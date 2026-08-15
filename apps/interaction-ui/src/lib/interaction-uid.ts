export function interactionUid() {
	const segments = window.location.pathname.split("/").filter(Boolean);
	const uid = segments.at(-1);
	if (!uid || segments.at(-2) !== "interaction") {
		throw new Error("The interaction URL is invalid");
	}
	return uid;
}
