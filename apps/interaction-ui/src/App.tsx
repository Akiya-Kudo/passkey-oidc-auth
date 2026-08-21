import { useEffect, useState } from "react";
import { fetchInteractionContext } from "./api/api";
import { Consent } from "./components/Consent";
import { InteractionShell } from "./components/InteractionShell";
import { Login } from "./components/Login";
import { Registration } from "./components/Registration";
import { StatusCard } from "./components/StatusCard";
import { interactionUid } from "./lib/interaction-uid";
import type { InteractionContext } from "./types/interaction";

export function App() {
	const [interaction, setInteraction] = useState<InteractionContext>();
	const [error, setError] = useState<string>();
	const [isLoading, setIsLoading] = useState(true);
	const [isRegisteringFromLogin, setIsRegisteringFromLogin] = useState(false);

	useEffect(() => {
		try {
			const uid = interactionUid();
			void fetchInteractionContext(uid)
				.then((context) => {
					setInteraction(context);
				})
				.catch((cause: unknown) => {
					setError(cause instanceof Error ? cause.message : "An unexpected error occurred.");
				})
				.finally(() => setIsLoading(false));
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "An unexpected error occurred.");
			setIsLoading(false);
		}
	}, []);

	if (isLoading) {
		return <StatusCard>Loading...</StatusCard>;
	}
	if (error || !interaction) {
		return <StatusCard error>{error ?? "Authentication session not found."}</StatusCard>;
	}

	if (interaction.prompt === "consent") {
		return (
			<InteractionShell title="Conform Access" clientName={interaction.client.name}>
				<Consent interaction={interaction} />
			</InteractionShell>
		);
	}
	if (interaction.prompt === "create" || isRegisteringFromLogin) {
		return (
			<InteractionShell title="Create Account" clientName={interaction.client.name}>
				<Registration
					uid={interaction.uid}
					canCancel={interaction.prompt === "create"}
					onReturnToLogin={interaction.prompt === "login" ? () => setIsRegisteringFromLogin(false) : undefined}
				/>
			</InteractionShell>
		);
	}

	if (interaction.authMethod.length === 0) {
		return <StatusCard error>No sign in methods available.</StatusCard>;
	}

	return (
		<InteractionShell title="Sign In" clientName={interaction.client.name}>
			<Login
				uid={interaction.uid}
				authMethod={interaction.authMethod}
				onCreateAccount={() => setIsRegisteringFromLogin(true)}
			/>
		</InteractionShell>
	);
}
