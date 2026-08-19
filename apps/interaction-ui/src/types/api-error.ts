export type PublicErrorKind = "server_error" | "request_error";

export type ApiErrorBody = {
	error: PublicErrorKind;
	code: string;
	message: string;
	debug?: {
		name: string;
		message: string;
		error_description?: string;
	};
};

const USER_MESSAGES: Record<string, string> = {
	server_error: "予期しないエラーです。",
	request_error: "リクエストを処理できませんでした。",
	interaction_not_found: "認証セッションがありません。",
	interaction_session_not_found: "認証セッションを読み込めませんでした。",
	cross_origin_forbidden: "不正なリクエストです。",
	consent_not_required: "この操作は現在必要ありません。",
	login_not_required: "この操作は現在必要ありません。",
	unauthenticated_consent: "先にサインインしてください。",
	invalid_credentials: "メールアドレスまたはパスワードが正しくありません。",
	not_implemented: "この認証方法はまだ利用できません。",
	invalid_interaction_url: "認証用の URL が正しくありません。",
	interaction_context_client_not_found: "連携アプリが見つかりませんでした。",
	unsupported_interaction_prompt: "この認証手順には対応していません。",
};

export function userMessageFor(body: ApiErrorBody | undefined, fallback: string): string {
	if (!body) {
		return fallback;
	}
	if (body.error === "server_error") {
		return USER_MESSAGES.server_error ?? fallback;
	}
	return USER_MESSAGES[body.code] ?? fallback;
}
