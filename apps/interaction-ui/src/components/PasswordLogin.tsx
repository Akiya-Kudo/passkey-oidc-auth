import { useState } from "react";
import { submitPasswordLogin } from "../api/password";

type PasswordLoginProps = { uid: string };

export function PasswordLogin({ uid }: PasswordLoginProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string>();
	const [submitting, setSubmitting] = useState(false);

	async function signIn(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError(undefined);
		try {
			await submitPasswordLogin(uid, { email, password });
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "パスワード認証に失敗しました。");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<section>
			<h2>Password Login</h2>
			<form onSubmit={(event) => void signIn(event)}>
				<label className="field" htmlFor="login-email">
					Email
					<input
						id="login-email"
						type="email"
						name="email"
						autoComplete="username"
						required
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
				</label>
				<label className="field" htmlFor="login-password">
					Password
					<input
						id="login-password"
						type="password"
						name="password"
						autoComplete="current-password"
						required
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
				</label>
				<button type="submit" disabled={submitting}>
					{submitting ? "Confirming..." : "Login"}
				</button>
			</form>
			{error ? <p className="error">{error}</p> : null}
		</section>
	);
}
