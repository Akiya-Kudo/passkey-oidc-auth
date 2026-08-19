export type InteractionPrompt = "login" | "consent";

export type AuthMethodType = "password" | "passkey";

export type InteractionContext = {
	uid: string;
	prompt: InteractionPrompt;
	client: { id: string; name?: string };
	scopes: string[];
	missingScopes: string[];
	authMethod: AuthMethodType[];
};
