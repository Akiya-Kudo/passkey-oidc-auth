#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { IdpStack } from "../lib/idp.js";

const app = new cdk.App();

// TODO: account / region を context または環境変数から明示する
new IdpStack(app, "PasskeyOidcIdpStack", {
	env: {
		account: process.env.CDK_DEFAULT_ACCOUNT,
		region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
	},
	// TODO: カスタムドメイン導入後に issuer を固定値で渡す
	issuer: process.env.CDK_OIDC_ISSUER,
});
