import { useEffect, useState } from "react";
import { fetchInteractionContext } from "./api/interactions";
import { Consent } from "./components/Consent";
import { InteractionShell } from "./components/InteractionShell";
import { Login } from "./components/Login";
import { StatusCard } from "./components/StatusCard";
import { interactionUid } from "./lib/interaction-uid";
import type { InteractionContext } from "./types/interaction";

export function App() {
	const [interaction, setInteraction] = useState<InteractionContext>();
	const [error, setError] = useState<string>();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		try {
			const uid = interactionUid();
			void fetchInteractionContext(uid)
				.then((context) => {
					setInteraction(context);
				})
				.catch((cause: unknown) => {
					setError(cause instanceof Error ? cause.message : "予期しないエラーです。");
				})
				.finally(() => setIsLoading(false));
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "予期しないエラーです。");
			setIsLoading(false);
		}
	}, []);

	if (isLoading) {
		return <StatusCard>読み込み中…</StatusCard>;
	}
	if (error || !interaction) {
		return <StatusCard error>{error ?? "認証セッションがありません。"}</StatusCard>;
	}

	return (
		<InteractionShell
			title={interaction.prompt === "consent" ? "アクセスの確認" : "サインイン"}
			clientName={interaction.client.name}
		>
			{interaction.prompt === "consent" ? <Consent interaction={interaction} /> : <Login uid={interaction.uid} />}
		</InteractionShell>
	);
}
