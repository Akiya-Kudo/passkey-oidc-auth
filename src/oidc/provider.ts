import { Provider } from "oidc-provider";
import { createRuntimeDeps } from "@/infrastructure/index.js";
import { createConfiguration } from "./config.js";

export async function createProvider(): Promise<Provider> {
	const deps = createRuntimeDeps();
	const configuration = await createConfiguration(deps);
	return new Provider(deps.config.issuer, configuration);
}
