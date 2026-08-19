import { consentActionUrl } from "../api/api";
import type { InteractionContext } from "../types/interaction";

export function Consent({ interaction }: { interaction: InteractionContext }) {
	const scopes = interaction.missingScopes.length ? interaction.missingScopes : interaction.scopes;

	return (
		<section>
			<p>次の情報へのアクセスを許可します。</p>
			<ul>
				{scopes.map((scope) => (
					<li key={scope}>{scope}</li>
				))}
			</ul>
			<form method="post" action={consentActionUrl(interaction.uid)}>
				<button type="submit">許可して続行</button>
			</form>
		</section>
	);
}
