import type { ReactNode } from "react";

type InteractionShellProps = {
	title: string;
	clientName: string;
	children: ReactNode;
};

export function InteractionShell({ title, clientName, children }: InteractionShellProps) {
	return (
		<main className="card">
			<p className="eyebrow">PASSKEY OIDC</p>
			<h1>{title}</h1>
			<p className="client-name">{clientName}</p>
			{children}
		</main>
	);
}
