export type UserId = string;

export type User = {
	id: UserId;
	/** TODO: Passkey 登録時に設定する表示名 */
	displayName?: string;
	/** TODO: 必要なら email 等のクレームを追加 */
	email?: string;
	createdAt: string;
	updatedAt: string;
};
