export type InteractionParams = {
	client_id: string;
	scope?: string;
};

export type ConsentDetails = {
	missingOIDCScope?: string[];
	missingOIDCClaims?: string[];
	missingResourceScopes?: Record<string, string[]>;
};
