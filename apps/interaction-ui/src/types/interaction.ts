export type InteractionPrompt = "login" | "consent" | string;

export type InteractionContext = {
	uid: string;
	prompt: InteractionPrompt;
	client: { id: string; name: string };
	scopes: string[];
	missingScopes: string[];
};
