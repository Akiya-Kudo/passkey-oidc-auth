import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwIntegrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, "../../..");

export type IdpStackProps = cdk.StackProps & {
	issuer?: string;
	tableNames?: {
		oidc: string;
	};
};

// TODO: カスタムドメイン導入後は https://auth.example.com 等に固定する
export class IdpStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: IdpStackProps = {}) {
		super(scope, id, props);

		const tableNames = props.tableNames ?? {
			oidc: "oidc-table",
		};

		const oidcTable = new dynamodb.Table(this, "OidcTable", {
			tableName: tableNames.oidc,
			partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
			sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			timeToLiveAttribute: "expiresAt",
			removalPolicy: cdk.RemovalPolicy.DESTROY, // TODO: 本番は RETAIN
		});

		oidcTable.addGlobalSecondaryIndex({
			indexName: "grantIdIndex",
			partitionKey: { name: "grantId", type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL,
		});
		oidcTable.addGlobalSecondaryIndex({
			indexName: "uidIndex",
			partitionKey: { name: "uid", type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL,
		});
		oidcTable.addGlobalSecondaryIndex({
			indexName: "userCodeIndex",
			partitionKey: { name: "userCode", type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL,
		});

		// TODO: Users / Credentials 用テーブルを分離する場合はここに追加
		// TODO: JWKS 用 Secrets Manager Secret を作成し Lambda に読み取り権限を付与

		const issuer = props.issuer;

		const oidcFn = new NodejsFunction(this, "OidcFn", {
			entry: path.join(repoRoot, "apps/lambdas/src/handler.ts"),
			handler: "handler",
			runtime: lambda.Runtime.NODEJS_20_X,
			memorySize: 512,
			timeout: cdk.Duration.seconds(29),
			environment: {
				ISSUER: issuer ?? "",
				OIDC_TABLE_NAME: oidcTable.tableName,
				OIDC_TRUST_PROXY: "true",
				// TODO: COOKIE_KEYS / JWKS_JSON / JWKS_SECRET_ARN を Secrets から注入
				COOKIE_KEYS: process.env.COOKIE_KEYS ?? "replace-me-in-prod",
			},
			logRetention: logs.RetentionDays.ONE_WEEK,
			projectRoot: repoRoot,
			depsLockFilePath: path.join(repoRoot, "pnpm-lock.yaml"),
			bundling: {
				minify: true,
				sourceMap: true,
				target: "node20",
				// oidc-provider and its dependency tree use CommonJS dynamic requires.
				// Lambda's Node.js runtime supports CommonJS bundles directly.
				format: OutputFormat.CJS,
				mainFields: ["module", "main"],
				externalModules: [],
				// tsconfig paths の `@/*` -> `./src/*` と対応
				tsconfig: path.join(repoRoot, "tsconfig.json"),
				esbuildArgs: {
					// CDK は `--alias` を `--alias:OLD=NEW` 形式で渡す（projectRoot 基準）
					"--alias": "@=./src",
				},
			},
		});

		oidcTable.grantReadWriteData(oidcFn);

		const httpApi = new apigwv2.HttpApi(this, "IdpHttpApi", {
			apiName: "passkey-oidc-idp",
			defaultIntegration: new apigwIntegrations.HttpLambdaIntegration(
				"OidcIntegration",
				oidcFn,
			),
			corsPreflight: {
				// TODO: 許可 Origin を Client の実 URL に絞る
				allowHeaders: ["Content-Type", "Authorization", "Cookie"],
				allowMethods: [
					apigwv2.CorsHttpMethod.GET,
					apigwv2.CorsHttpMethod.POST,
					apigwv2.CorsHttpMethod.OPTIONS,
				],
				allowOrigins: ["*"],
				allowCredentials: false,
			},
		});

		new cdk.CfnOutput(this, "HttpApiUrl", {
			value: httpApi.apiEndpoint,
			description: "API Gateway endpoint.",
		});
		new cdk.CfnOutput(this, "OidcTableName", {
			value: oidcTable.tableName,
		});
		new cdk.CfnOutput(this, "ConfiguredIssuer", {
			value: issuer ?? "",
		});
	}
}
