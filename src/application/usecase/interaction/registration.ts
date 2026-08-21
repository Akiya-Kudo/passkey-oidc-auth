import type Provider from "oidc-provider";
import { readJsonBody } from "@/adapter/validation/json-body.js";
import { requireSameOrigin } from "@/adapter/validation/same-origin.js";
import { validateUidMatches } from "@/adapter/validation/uid.js";
import { parseRegistrationBody } from "@/application/dto/interaction/registration.js";
import type { InteractionRouterContext } from "@/application/type/context.js";
import { PasswordCredential } from "@/domain/credential/password/password.js";
import { Email } from "@/domain/user/email.js";
import { User } from "@/domain/user/user.js";
import { UserId } from "@/domain/user/user-id.js";
import { AppError, ErrorCodes } from "@/http/app-error.js";
import type { RuntimeDeps } from "@/infrastructure/dependency.js";

/**
 * Creates a password account from either a requested `create` prompt or a user-selected
 * sign-up mode inside an existing login Interaction, then resolves the OIDC login result.
 */
export const createInteractionRegistrationUseCase = (provider: Provider, deps: RuntimeDeps) => {
	const { registrationRepository, userRepository } = deps;

	return async (input: { ctx: InteractionRouterContext }) => {
		const { ctx } = input;
		requireSameOrigin(ctx);

		const body = parseRegistrationBody(await readJsonBody(ctx));
		const details = await provider.interactionDetails(ctx.req, ctx.res);
		validateUidMatches(details.uid, ctx.params.uid);

		if (details.prompt.name !== "create" && details.prompt.name !== "login") {
			throw new AppError(
				400,
				ErrorCodes.registrationNotAllowed,
				"The current interaction does not allow account creation",
			);
		}

		const now = new Date().toISOString();
		const user = new User({
			id: UserId.generate(),
			email: Email.from(body.email),
			displayName: body.displayName,
			createdAt: now,
			updatedAt: now,
		});
		if (!user.email) {
			throw new AppError(400, ErrorCodes.requestError, "An email address is required to register account");
		}

		const passwordCredential = await PasswordCredential.fromPlain({
			userId: user.id,
			password: body.password,
		});

		const existingUser = await userRepository.findByEmail(user.email);
		if (existingUser) {
			throw new AppError(409, ErrorCodes.emailAlreadyRegistered, "An account with this email address already exists");
		}

		await registrationRepository.createPasswordAccount({ user, passwordCredential });

		const redirectTo = await provider.interactionResult(
			ctx.req,
			ctx.res,
			{
				...(details.prompt.name === "create" ? { create: {} } : {}),
				login: {
					accountId: user.id.value,
					ts: Math.floor(Date.now() / 1000),
					amr: ["pwd"],
				},
			},
			{ mergeWithLastSubmission: true },
		);

		ctx.status = 201;
		ctx.body = { redirectTo };
	};
};
