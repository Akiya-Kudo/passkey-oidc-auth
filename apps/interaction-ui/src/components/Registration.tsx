import { useState } from "react";
import { cancelRegistration, submitRegistration } from "../api/registration";

type RegistrationProps = {
	uid: string;
	onReturnToLogin?: () => void;
	canCancel: boolean;
};

export function Registration({ uid, onReturnToLogin, canCancel }: RegistrationProps) {
	const [email, setEmail] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string>();
	const [submitting, setSubmitting] = useState(false);

	async function register(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError(undefined);
		try {
			await submitRegistration(uid, {
				email,
				displayName: displayName || undefined,
				password,
			});
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Failed to create account.");
		} finally {
			setSubmitting(false);
		}
	}

	async function cancel() {
		setSubmitting(true);
		setError(undefined);
		try {
			await cancelRegistration(uid);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Failed to cancel account creation.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<section>
			<h2>Create Account</h2>
			<form onSubmit={(event) => void register(event)}>
				<label className="field" htmlFor="registration-email">
					Email
					<input
						id="registration-email"
						type="email"
						name="email"
						autoComplete="email"
						required
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
				</label>
				<label className="field" htmlFor="registration-display-name">
					Display Name (Optional)
					<input
						id="registration-display-name"
						type="text"
						name="displayName"
						autoComplete="name"
						value={displayName}
						onChange={(event) => setDisplayName(event.target.value)}
					/>
				</label>
				<label className="field" htmlFor="registration-password">
					Password (12 characters or longer)
					<input
						id="registration-password"
						type="password"
						name="password"
						autoComplete="new-password"
						minLength={12}
						required
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
				</label>
				<button type="submit" disabled={submitting}>
					{submitting ? "Creating..." : "Create Account"}
				</button>
			</form>
			{onReturnToLogin ? (
				<button type="button" className="secondary-button" onClick={onReturnToLogin} disabled={submitting}>
					Return to Sign In
				</button>
			) : null}
			{canCancel ? (
				<button type="button" className="secondary-button" onClick={() => void cancel()} disabled={submitting}>
					Cancel
				</button>
			) : null}
			{error ? <p className="error">{error}</p> : null}
		</section>
	);
}
