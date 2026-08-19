import type Provider from "oidc-provider";
import { readJsonBody } from "@/adapter/validation/json-body.js";
import { requireSameOrigin } from "@/adapter/validation/same-origin.js";
import { validateUidMatches } from "@/adapter/validation/uid.js";
import { parsePasswordVerifyBody } from "@/application/dto/interaction/password-verify.js";
import { authenticateWithPassword } from "@/application/service/password-authenticate.js";
import type { InteractionRouterContext } from "@/application/type/context.js";
import { normalizeEmail } from "@/domain/email.js";
import { AppError, ErrorCodes } from "@/http/app-error.js";
import type { RuntimeDeps } from "@/infrastructure/dependency";

/**
 * Completes the login Interaction after email+password verification.
 */
export const createInteractionPasswordVerifyUseCase = (provider: Provider, deps: RuntimeDeps) => {
	const { userRepository, passwordCredentialRepository } = deps;

	return async (input: { ctx: InteractionRouterContext }) => {
		const { ctx } = input;
		requireSameOrigin(ctx);

		const body = parsePasswordVerifyBody(await readJsonBody(ctx));
		const details = await provider.interactionDetails(ctx.req, ctx.res);
		validateUidMatches(details.uid, ctx.params.uid);

		if (details.prompt.name !== "login") {
			throw new AppError(400, ErrorCodes.loginNotRequired, "The current interaction does not require login");
		}

		const user = await authenticateWithPassword({
			userRepository,
			passwordCredentialRepository,
			email: normalizeEmail(body.email),
			password: body.password,
		});
		if (!user) {
			throw new AppError(401, ErrorCodes.invalidCredentials, "Email or password is incorrect", {
				expose: true,
			});
		}

		const redirectTo = await provider.interactionResult(
			ctx.req,
			ctx.res,
			{
				login: {
					accountId: user.id,
					// TODO: FETUER ts amr acr などを設定する
				},
			},
			{ mergeWithLastSubmission: false },
		);

		ctx.status = 200;
		ctx.body = { redirectTo };
	};
};
