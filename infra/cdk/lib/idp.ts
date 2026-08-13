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
import { httpRoutes, type LambdaKind } from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, "../../..");

export type IdpStackProps = cdk.StackProps & {
	issuer?: string;
	tableNames?: {
		oidc: string;
		users: string;
		credentials: string;
	};
};

// TODO: カスタムドメイン導入後は https://auth.example.com 等に固定する
export class IdpStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: IdpStackProps = {}) {
		super(scope, id, props);

		const tableNames = props.tableNames ?? {
			oidc: "oidc-table",
			users: "users-table",
			credentials: "credentials-table",
		};

		const oidcTable = new dynamodb.Table(this, "OidcTable", {
			tableName: undefined, // TODO: 必要なら固定名を指定
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

		const httpApi = new apigwv2.HttpApi(this, "IdpHttpApi", {
			apiName: "passkey-oidc-idp",
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

		const issuer =
			props.issuer ??
			// デプロイ後に API endpoint を ISSUER にする場合のプレースホルダ
			// 実 URL は outputs の HttpApiUrl を見て Parameter/Env を更新する
			process.env.CDK_OIDC_ISSUER ??
			"https://example.invalid";

		const commonEnv: Record<string, string> = {
			ISSUER: issuer,
			OIDC_TABLE_NAME: oidcTable.tableName,
			OIDC_TRUST_PROXY: "true",
			// TODO: COOKIE_KEYS / JWKS_JSON / JWKS_SECRET_ARN を Secrets から注入
			COOKIE_KEYS: process.env.COOKIE_KEYS ?? "replace-me-in-prod",
		};

		const lambdas: Record<LambdaKind, NodejsFunction> = {
			metadata: this.createLambda("MetadataFn", "metadata", commonEnv),
			authorization: this.createLambda(
				"AuthorizationFn",
				"authorization",
				commonEnv,
			),
			token: this.createLambda("TokenFn", "token", commonEnv),
		};

		for (const fn of Object.values(lambdas)) {
			oidcTable.grantReadWriteData(fn);
		}

		const methodMap: Record<
			(typeof httpRoutes)[number]["methods"][number],
			apigwv2.HttpMethod
		> = {
			GET: apigwv2.HttpMethod.GET,
			POST: apigwv2.HttpMethod.POST,
			OPTIONS: apigwv2.HttpMethod.OPTIONS,
		};

		for (const route of httpRoutes) {
			const fn = lambdas[route.lambda];
			const integrationId = `${route.lambda}${route.path.replaceAll(/[^a-zA-Z0-9]/g, "-")}`;
			const integration = new apigwIntegrations.HttpLambdaIntegration(
				integrationId,
				fn,
			);

			for (const method of route.methods) {
				httpApi.addRoutes({
					path: route.path,
					methods: [methodMap[method]],
					integration,
				});
			}
		}

		new cdk.CfnOutput(this, "HttpApiUrl", {
			value: httpApi.apiEndpoint,
			description:
				"API Gateway endpoint. TODO: set ISSUER to this URL (or custom domain) after first deploy",
		});
		new cdk.CfnOutput(this, "OidcTableName", {
			value: oidcTable.tableName,
		});
		new cdk.CfnOutput(this, "ConfiguredIssuer", {
			value: issuer,
		});
	}

	private createLambda(
		id: string,
		entryName: LambdaKind,
		environment: Record<string, string>,
	): NodejsFunction {
		return new NodejsFunction(this, id, {
			entry: path.join(repoRoot, "apps/lambdas/src", `${entryName}.ts`),
			handler: "handler",
			runtime: lambda.Runtime.NODEJS_20_X,
			memorySize: 512,
			timeout: cdk.Duration.seconds(29),
			environment,
			logRetention: logs.RetentionDays.ONE_WEEK, // TODO: 本番の保持期間を決める
			projectRoot: repoRoot,
			depsLockFilePath: path.join(repoRoot, "pnpm-lock.yaml"),
			bundling: {
				minify: true,
				sourceMap: true,
				target: "node20",
				format: OutputFormat.ESM,
				mainFields: ["module", "main"],
				banner:
					"import { createRequire } from 'module';const require = createRequire(import.meta.url);",
				// AWS SDK v3 は Lambda ランタイムに無いためバンドルする
				externalModules: [],
			},
		});
	}
}
