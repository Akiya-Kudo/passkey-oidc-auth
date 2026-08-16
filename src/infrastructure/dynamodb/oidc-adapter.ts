import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import type { Adapter, AdapterPayload } from "oidc-provider";
import type { DynamoOidcAdapterOptions } from "./factory.js";

const GRANTABLE = new Set([
	"AccessToken",
	"AuthorizationCode",
	"RefreshToken",
	"DeviceCode",
	"BackchannelAuthenticationRequest",
	"PreAuthorizedCode",
]);

type StoredItem = {
	pk: string;
	sk: string;
	model: string;
	id: string;
	payload: AdapterPayload;
	expiresAt?: number;
	grantId?: string;
	userCode?: string;
	uid?: string;
};

export class DynamoOidcAdapter implements Adapter {
	readonly #name: string;
	readonly #tableName: string;
	readonly #doc: DynamoDBDocument;

	constructor(name: string, options: DynamoOidcAdapterOptions) {
		this.#name = name;
		this.#tableName = options.tableName;
		this.#doc = DynamoDBDocument.from(
			new DynamoDBClient(options.clientConfig ?? {}),
			{
				marshallOptions: { removeUndefinedValues: true },
			},
		);
	}

	#pk(id: string) {
		return `${this.#name}:${id}`;
	}

	#sk() {
		return "OIDC";
	}

	async upsert(
		id: string,
		payload: AdapterPayload,
		expiresIn?: number,
	): Promise<void> {
		const item: StoredItem = {
			pk: this.#pk(id),
			sk: this.#sk(),
			model: this.#name,
			id,
			payload,
		};

		if (typeof expiresIn === "number") {
			item.expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
		}
		if (typeof payload.grantId === "string" && GRANTABLE.has(this.#name)) {
			item.grantId = payload.grantId;
		}
		if (typeof payload.userCode === "string") {
			item.userCode = payload.userCode;
		}
		if (typeof payload.uid === "string") {
			item.uid = payload.uid;
		}

		await this.#doc.put({
			TableName: this.#tableName,
			Item: item,
		});
	}

	async find(id: string): Promise<AdapterPayload | undefined> {
		const result = await this.#doc.get({
			TableName: this.#tableName,
			Key: { pk: this.#pk(id), sk: this.#sk() },
		});
		const item = result.Item as StoredItem | undefined;
		if (!item) {
			return undefined;
		}
		if (item.expiresAt && item.expiresAt < Math.floor(Date.now() / 1000)) {
			return undefined;
		}
		return item.payload;
	}

	async findByUid(uid: string): Promise<AdapterPayload | undefined> {
		const result = await this.#doc.query({
			TableName: this.#tableName,
			IndexName: "uidIndex",
			KeyConditionExpression: "uid = :uid",
			ExpressionAttributeValues: { ":uid": uid },
			Limit: 1,
		});
		const item = result.Items?.[0] as StoredItem | undefined;
		if (!item) {
			return undefined;
		}
		return this.find(item.id);
	}

	async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
		const result = await this.#doc.query({
			TableName: this.#tableName,
			IndexName: "userCodeIndex",
			KeyConditionExpression: "userCode = :userCode",
			ExpressionAttributeValues: { ":userCode": userCode },
			Limit: 1,
		});
		const item = result.Items?.[0] as StoredItem | undefined;
		if (!item) {
			return undefined;
		}
		return this.find(item.id);
	}

	async destroy(id: string): Promise<void> {
		await this.#doc.delete({
			TableName: this.#tableName,
			Key: { pk: this.#pk(id), sk: this.#sk() },
		});
	}

	async revokeByGrantId(grantId: string): Promise<void> {
		const result = await this.#doc.query({
			TableName: this.#tableName,
			IndexName: "grantIdIndex",
			KeyConditionExpression: "grantId = :grantId",
			ExpressionAttributeValues: { ":grantId": grantId },
		});

		const items = (result.Items ?? []) as StoredItem[];
		await Promise.all(
			items.map((item) =>
				this.#doc.delete({
					TableName: this.#tableName,
					Key: { pk: item.pk, sk: item.sk },
				}),
			),
		);
	}

	async consume(id: string): Promise<void> {
		await this.#doc.update({
			TableName: this.#tableName,
			Key: { pk: this.#pk(id), sk: this.#sk() },
			UpdateExpression: "SET payload.consumed = :consumed",
			ExpressionAttributeValues: {
				":consumed": Math.floor(Date.now() / 1000),
			},
		});
	}
}
