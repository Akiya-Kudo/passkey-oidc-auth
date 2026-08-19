import type { ReactNode } from "react";

type InteractionShellProps = {
	title: string;
	/** OIDC client_name when registered; omit or undefined if the client has no display name. */
	clientName?: string;
	children: ReactNode;
};

export function InteractionShell({ title, clientName, children }: InteractionShellProps) {
	return (
		<main className="card">
			<p className="eyebrow">PASSKEY OIDC</p>
			<h1>{title}</h1>
			<p className="client-name">{clientName?.trim() || "連携アプリ"}</p>
			{children}
		</main>
	);
}
