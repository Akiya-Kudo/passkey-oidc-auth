import { useState } from "react";
import { submitPasskeyLogin } from "../api/interactions";

type PasskeyLoginProps = { uid: string };

export function PasskeyLogin({ uid }: PasskeyLoginProps) {
	const [error, setError] = useState<string>();
	const [submitting, setSubmitting] = useState(false);

	async function signIn() {
		setSubmitting(true);
		setError(undefined);
		try {
			await submitPasskeyLogin(uid);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "パスキー認証に失敗しました。");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<section>
			<h2>パスキーでサインイン</h2>
			<p>この端末に保存されたパスキーで続行します。</p>
			<button type="button" onClick={() => void signIn()} disabled={submitting}>
				{submitting ? "確認中…" : "パスキーで続行"}
			</button>
			{error ? <p className="error">{error}</p> : null}
		</section>
	);
}
