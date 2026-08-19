import { Provider } from "oidc-provider";
import { createRuntimeDeps, type RuntimeDeps } from "@/infrastructure/dependency.js";
import { Environments } from "@/infrastructure/env.js";
import { createConfiguration } from "./config.js";

export async function createProvider(deps: RuntimeDeps = createRuntimeDeps()): Promise<Provider> {
	const issuer = Environments.issuer;
	const configuration = await createConfiguration(deps);
	return new Provider(issuer, configuration);
}
