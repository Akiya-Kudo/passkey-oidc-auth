import { createOidcApp } from "@/http/koa.js";
import { Environments } from "@/infrastructure/env.js";

const { app } = await createOidcApp();

app.listen(Environments.localIdpPort, () => {
	console.log(`Server is running on ${Environments.issuer}`);
});
