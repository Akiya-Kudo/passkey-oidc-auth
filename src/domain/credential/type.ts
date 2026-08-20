import z from "zod";

export const credentialTypeSchema = z.enum(["password", "passkey"]);

export enum CredentialType {
	Password = "password",
	Passkey = "passkey",
}
