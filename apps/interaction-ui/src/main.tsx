import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type InteractionContext = {
	uid: string;
	prompt: "login" | "consent" | string;
	client: { id: string; name: string };
	scopes: string[];
	missingScopes: string[];
};

function interactionUid() {
	const segments = window.location.pathname.split("/").filter(Boolean);
	const uid = segments.at(-1);
	if (!uid || segments.at(-2) !== "interaction") {
		throw new Error("The interaction URL is invalid");
	}
	return uid;
}

function App() {
	const [interaction, setInteraction] = useState<InteractionContext>();
	const [error, setError] = useState<string>();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const uid = interactionUid();
		void fetch(`/api/interactions/${encodeURIComponent(uid)}/context`, {
			credentials: "same-origin",
		})
			.then(async (response) => {
				if (!response.ok) {
					throw new Error("認証セッションを読み込めませんでした。");
				}
				return (await response.json()) as InteractionContext;
			})
			.then(setInteraction)
			.catch((cause: unknown) => {
				setError(
					cause instanceof Error ? cause.message : "予期しないエラーです。",
				);
			})
			.finally(() => setIsLoading(false));
	}, []);

	if (isLoading) {
		return <main className="card">読み込み中…</main>;
	}
	if (error || !interaction) {
		return (
			<main className="card error">
				{error ?? "認証セッションがありません。"}
			</main>
		);
	}

	return (
		<main className="card">
			<p className="eyebrow">PASSKEY OIDC</p>
			<h1>
				{interaction.prompt === "consent" ? "アクセスの確認" : "サインイン"}
			</h1>
			<p className="client-name">{interaction.client.name}</p>
			{interaction.prompt === "consent" ? (
				<Consent interaction={interaction} />
			) : (
				<Login uid={interaction.uid} />
			)}
		</main>
	);
}

function Login({ uid }: { uid: string }) {
	const [error, setError] = useState<string>();
	const [submitting, setSubmitting] = useState(false);

	async function signIn() {
		setSubmitting(true);
		setError(undefined);
		try {
			const response = await fetch(
				`/api/interactions/${encodeURIComponent(uid)}/login`,
				{
					method: "POST",
					credentials: "same-origin",
				},
			);
			if (!response.ok) {
				const body = (await response.json()) as { message?: string };
				throw new Error(body.message ?? "パスキー認証に失敗しました。");
			}
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "パスキー認証に失敗しました。",
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<section>
			<p>この端末に保存されたパスキーで続行します。</p>
			<button type="button" onClick={() => void signIn()} disabled={submitting}>
				{submitting ? "確認中…" : "パスキーで続行"}
			</button>
			{error ? <p className="error">{error}</p> : null}
		</section>
	);
}

function Consent({ interaction }: { interaction: InteractionContext }) {
	const uid = encodeURIComponent(interaction.uid);
	const scopes = interaction.missingScopes.length
		? interaction.missingScopes
		: interaction.scopes;

	return (
		<section>
			<p>次の情報へのアクセスを許可します。</p>
			<ul>
				{scopes.map((scope) => (
					<li key={scope}>{scope}</li>
				))}
			</ul>
			<form method="post" action={`/api/interactions/${uid}/confirm`}>
				<button type="submit">許可して続行</button>
			</form>
		</section>
	);
}

const root = document.getElementById("root");
if (!root) {
	throw new Error("Interaction UI root element is missing");
}

createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
