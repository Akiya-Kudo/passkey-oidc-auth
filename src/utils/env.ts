type EnvKind = "string" | "number";

type EnvValue<K extends EnvKind> = K extends "number" ? number : string;

type ParsedEnv<K extends EnvKind, Optional extends boolean> = Optional extends true
	? EnvValue<K> | undefined
	: EnvValue<K>;

export function parseEnv<K extends EnvKind = "string", Optional extends boolean = false>(
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

/**
 * カンマ区切りを許可リテラル配列へ。呼び出し時に `parseCsvEnum<T>(...)` で型を指定する。
 * @param raw - カンマ区切りの文字列
 * @param allowed - 許可されたリテラル配列
 * @param options - オプション
 * @returns パースされたリテラル配列
 */
export function parseCsvEnum<T extends string>(raw: string, allowed: readonly T[], options?: { name?: string }): T[] {
	const label = options?.name ?? "value";
	const parsed: T[] = [];

	for (const part of raw.split(",").map((token) => token.trim())) {
		if (part.length === 0) {
			continue;
		}
		const match = allowed.find((candidate) => candidate === part);
		if (match === undefined) {
			throw new Error(`Invalid ${label}: ${part}`);
		}
		parsed.push(match);
	}

	if (parsed.length === 0) {
		throw new Error(`Invalid ${label}: empty`);
	}

	return parsed;
}
