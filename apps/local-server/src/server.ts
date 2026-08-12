import Koa from "koa";
import mount from "koa-mount";
import { parseEnv } from "../../../utils/error.js";
import { createProvider } from "./provider.js";
import { createAppRouter } from "./routes/index.js";

const port = parseEnv("number", process.env.PORT);
const issuer = `http://localhost:${port}`;

const provider = createProvider(issuer);
const router = createAppRouter(provider);

const app = new Koa();

app.use(router.routes());
app.use(router.allowedMethods());
// issuer に path が無いので Provider もルートにマウントする
// koa-mount の型が @types/koa@2 前提のため、実行時の Provider(Koa app) を通す
app.use(mount(provider as unknown as Koa));

app.listen(port, () => {
	console.log(`Server is running on ${issuer}`);
});
