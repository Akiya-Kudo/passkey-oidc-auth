export type PromptType = "login" | "consent" | "create";

export const PROMPT_TYPES = ["login", "consent", "create"] as const satisfies readonly PromptType[];
