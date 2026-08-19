// TODO: RFC に準拠するように修正する
/** Login identifier: trim + lowercase. Not a proof of mailbox ownership. */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}
