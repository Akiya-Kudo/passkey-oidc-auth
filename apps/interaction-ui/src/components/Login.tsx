import type { AuthMethodType } from "../types/interaction";
import { PasskeyLogin } from "./PasskeyLogin";
import { PasswordLogin } from "./PasswordLogin";

export function Login({ uid, authMethod }: { uid: string; authMethod: AuthMethodType[] }) {
	const hasPasskey = authMethod.includes("passkey");
	const hasPassword = authMethod.includes("password");

	return (
		<>
			{hasPasskey ? <PasskeyLogin uid={uid} /> : null}
			{hasPasskey && hasPassword ? <p className="separator">または</p> : null}
			{hasPassword ? <PasswordLogin uid={uid} /> : null}
		</>
	);
}
