import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
	root: fileURLToPath(new URL(".", import.meta.url)),
	base: "/interaction/",
	server: {
		host: "127.0.0.1",
		port: 5000,
		strictPort: true,
		proxy: {
			"/.well-known": "http://localhost:3000",
			"/api": "http://localhost:3000",
			"/authorize": "http://localhost:3000",
			"/token": "http://localhost:3000",
			"/userinfo": "http://localhost:3000",
			"/jwks": "http://localhost:3000",
			"/session": "http://localhost:3000",
			"/health": "http://localhost:3000",
		},
	},
	build: {
		outDir: fileURLToPath(new URL("./dist", import.meta.url)),
		emptyOutDir: true,
	},
});
