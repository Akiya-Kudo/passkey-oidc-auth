import { createOidcApp } from "../../../src/http/index.js";

function parsePort(value: string | undefined): number {
	if (value && Number.isSafeInteger(Number(value))) {
		return Number(value);
	}
	throw new Error(`Invalid PORT environment variable: ${value}`);
}

const port = parsePort(process.env.PORT);
// ローカル既定。本番は ISSUER を API Gateway のカスタムドメイン等に合わせる
if (!process.env.ISSUER && !process.env.OIDC_ISSUER) {
	process.env.ISSUER = `http://localhost:${port}`;
}

const { app } = await createOidcApp();
const issuer = process.env.ISSUER ?? process.env.OIDC_ISSUER;

app.listen(port, () => {
	console.log(`Server is running on ${issuer}`);
});
