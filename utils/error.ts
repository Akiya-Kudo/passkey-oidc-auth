export function parseEnv(type: "string", env?: string): string;
export function parseEnv(type: "number", env?: string): number;
export function parseEnv(
	type: "string" | "number",
	env?: string,
): string | number {
	if (env) {
		if (type === "number" && Number.isSafeInteger(Number(env))) {
			return Number(env);
		}
		if (type === "string") {
			return env;
		}
	}
	throw new Error(`Invalid ${env} environment variable`);
}
