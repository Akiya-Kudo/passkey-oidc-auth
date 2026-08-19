import type { AuthMethodType } from "../types/interaction";
import { PasskeyLogin } from "./PasskeyLogin";
import { PasswordLogin } from "./PasswordLogin";

export function Login({ uid, authMethod }: { uid: string; authMethod: AuthMethodType[] }) {
	const hasPasskeyLogin = authMethod.includes("passkey");
	const hasPasswordLogin = authMethod.includes("password");

	return (
		<>
			{hasPasskeyLogin ? <PasskeyLogin uid={uid} /> : null}
			{hasPasskeyLogin && hasPasswordLogin ? <p className="separator">または</p> : null}
			{hasPasswordLogin ? <PasswordLogin uid={uid} /> : null}
		</>
	);
}
