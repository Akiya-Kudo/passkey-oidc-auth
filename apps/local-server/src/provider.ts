import { Provider } from "oidc-provider";

export function createProvider(issuer: string) {
	return new Provider(issuer, {
		clients: [
			{
				client_id: "foo",
				client_secret: "bar",
				redirect_uris: ["http://localhost:8080/cb"],
			},
		],
		features: {
			devInteractions: { enabled: false },
		},
		findAccount: async (ctx) => {},
	});
}
