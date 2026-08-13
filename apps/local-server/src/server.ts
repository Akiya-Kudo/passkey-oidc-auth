import { createOidcApp } from "@/http/koa.js";
import { Environments } from "@/infrastructure/env.js";

const { app } = await createOidcApp();
const issuer =
	process.env.ISSUER ?? `http://localhost:${Environments.localPort}`;

app.listen(Environments.localPort, () => {
	console.log(`Server is running on ${issuer}`);
});
