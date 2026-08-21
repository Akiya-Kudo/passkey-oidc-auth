import type { AuthMethodType } from "../types/interaction";
import { PasskeyLogin } from "./PasskeyLogin";
import { PasswordLogin } from "./PasswordLogin";

export function Login({
	uid,
	authMethod,
	onCreateAccount,
}: {
	uid: string;
	authMethod: AuthMethodType[];
	onCreateAccount: () => void;
}) {
	const hasPasskeyLogin = authMethod.includes("passkey");
	const hasPasswordLogin = authMethod.includes("password");

	return (
		<>
			{hasPasskeyLogin ? <PasskeyLogin uid={uid} /> : null}
			{hasPasskeyLogin && hasPasswordLogin ? <p className="separator">または</p> : null}
			{hasPasswordLogin ? <PasswordLogin uid={uid} /> : null}
			<p className="account-action">
				Don't have an account?
				<button type="button" className="link-button" onClick={onCreateAccount}>
					Create Account
				</button>
			</p>
		</>
	);
}
