type EnvKind = "string" | "number";

type EnvValue<K extends EnvKind> = K extends "number" ? number : string;

type ParsedEnv<
	K extends EnvKind,
	Optional extends boolean,
> = Optional extends true ? EnvValue<K> | undefined : EnvValue<K>;

export function parseEnv<
	K extends EnvKind = "string",
	Optional extends boolean = false,
>(
	name: string,
	value: string | undefined,
	options?: { type?: K; optional?: Optional },
): ParsedEnv<K, Optional> {
	const type = (options?.type ?? "string") as K;
	const optional = (options?.optional ?? false) as boolean;

	if (!value) {
		if (optional) {
			return undefined as ParsedEnv<K, Optional>;
		}
		throw new Error(`${name} environment variable is required`);
	}

	if (type === "number") {
		const parsed = Number(value);
		if (!Number.isSafeInteger(parsed)) {
			throw new Error(`${name} environment variable must be a safe integer`);
		}
		return parsed as ParsedEnv<K, Optional>;
	}

	return value as ParsedEnv<K, Optional>;
}
