import { requireCurrentInteraction } from "@/adapter/validation/uid";
import { InteractionRouterContext } from "@/application/type/context";
import { ConsentDetails, InteractionParams } from "@/application/dto/interaction/interaction";
import { AuthMethod } from "@/domain/auth-method";
import Provider from "oidc-provider";

export const interactionContextUseCase = async (input: {
	provider: Provider,
	ctx: InteractionRouterContext,
	authMethod: AuthMethod,
}) => {
  const { provider, ctx, authMethod } = input;

	const details = await provider.interactionDetails(ctx.req, ctx.res);

	requireCurrentInteraction(ctx, details.uid);

	const params = details.params as InteractionParams;
	const consentDetails = details.prompt.details as ConsentDetails;
	const client = await provider.Client.find(params.client_id);

	ctx.set("Cache-Control", "no-store");
	ctx.body = {
		uid: details.uid,
		prompt: details.prompt.name,
		client: {
			id: params.client_id,
			name: client?.clientName ?? client?.clientId ?? params.client_id,
		},
		scopes: (params.scope ?? "").split(" ").filter(Boolean),
		missingScopes: details.prompt.name === "consent" ? (consentDetails.missingOIDCScope ?? []) : [],
		authMethod: authMethod.toJSON(),
	};
};
