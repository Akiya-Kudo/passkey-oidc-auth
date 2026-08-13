import { createOidcApp } from "@/http/koa.js";

const port = parsePort(process.env.PORT);

const { app } = await createOidcApp();
const issuer =
	process.env.ISSUER ?? process.env.OIDC_ISSUER ?? `http://localhost:${port}`;

app.listen(port, () => {
	console.log(`Server is running on ${issuer}`);
});

function parsePort(value: string | undefined): number {
	if (value && Number.isSafeInteger(Number(value))) {
		return Number(value);
	}
	throw new Error(`Invalid PORT environment variable: ${value}`);
}
