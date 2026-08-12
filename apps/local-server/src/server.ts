import Koa from "koa";

const app = new Koa();
const port = Number(process.env.PORT ?? 3000);

app.use(async (ctx) => {
	if (ctx.path === "/health") {
		ctx.body = { status: "ok" };
		return;
	}

	ctx.status = 404;
	ctx.body = { error: "Not Found" };
});

app.listen(port, () => {
	console.log(`Local IdP server listening on http://localhost:${port}`);
});
