import { Provider } from "oidc-provider";
import { Environments } from "@/infrastructure/env.js";
import { createConfiguration } from "./config.js";

export async function createProvider(): Promise<Provider> {
	const issuer = Environments.issuer;
	const configuration = await createConfiguration();
	return new Provider(issuer, configuration);
}
