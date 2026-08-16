import { Provider } from "oidc-provider";
import { createRuntimeDeps } from "@/infrastructure/dependency.js";
import { createConfiguration } from "./config.js";

export async function createProvider(): Promise<Provider> {
	const { adapter, userRepository, keyStore, cookieKeys, issuer } =
		createRuntimeDeps();

	const configuration = await createConfiguration(
		adapter,
		userRepository,
		keyStore,
		cookieKeys,
	);
	return new Provider(issuer, configuration);
}
