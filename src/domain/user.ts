export type UserId = string;

export class User {
	readonly id: UserId;
	readonly displayName?: string;
	readonly email?: string;
	readonly createdAt: string;
	readonly updatedAt: string;

	constructor(props: {
		id: UserId;
		displayName?: string;
		email?: string;
		createdAt: string;
		updatedAt: string;
	}) {
		this.id = props.id;
		this.displayName = props.displayName;
		this.email = props.email;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}
}
