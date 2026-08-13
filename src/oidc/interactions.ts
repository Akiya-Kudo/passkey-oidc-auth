import type { Provider } from "oidc-provider";

/**
 * login / consent interaction の結果組み立て。
 * TODO: Passkey 認証成功後に accountId を渡して login を完了させる
 * TODO: consent 画面・scope 同意 UI を実装する
 */
export function buildLoginInteractionResult(accountId: string) {
	return {
		login: {
			accountId,
		},
	};
}

export function buildConsentInteractionResult(grantId: string) {
	return {
		consent: {
			grantId,
		},
	};
}

export type InteractionDetails = Awaited<
	ReturnType<Provider["interactionDetails"]>
>;
