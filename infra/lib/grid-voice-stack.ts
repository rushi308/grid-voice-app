import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { resolve } from "node:path";

export class GridVoiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const websocketCommentaryHandler = new NodejsFunction(
      this,
      "WebsocketCommentaryHandler",
      {
        entry: resolve(
          process.cwd(),
          "../apps/commentary-service/src/handlers/websocketHandler.ts",
        ),
        handler: "handler",
        runtime: Runtime.NODEJS_22_X,
        architecture: Architecture.ARM_64,
        timeout: Duration.seconds(10),
        memorySize: 256,
        environment: {
          NODE_OPTIONS: "--enable-source-maps",
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: "node22",
        },
      },
    );

    const websocketApi = new WebSocketApi(this, "CommentaryWebSocketApi", {
      apiName: "grid-voice-commentary-ws",
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "ConnectIntegration",
          websocketCommentaryHandler,
        ),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "DisconnectIntegration",
          websocketCommentaryHandler,
        ),
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "DefaultIntegration",
          websocketCommentaryHandler,
        ),
      },
      routeSelectionExpression: "$request.body.action",
    });

    websocketApi.addRoute("generateCommentary", {
      integration: new WebSocketLambdaIntegration(
        "GenerateCommentaryIntegration",
        websocketCommentaryHandler,
      ),
    });

    websocketApi.addRoute("SendData", {
      integration: new WebSocketLambdaIntegration(
        "SendDataIntegration",
        websocketCommentaryHandler,
      ),
    });

    const websocketStage = new WebSocketStage(
      this,
      "CommentaryWebSocketStage",
      {
        webSocketApi: websocketApi,
        stageName: "prod",
        autoDeploy: true,
      },
    );

    websocketCommentaryHandler.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["execute-api:ManageConnections"],
        resources: [
          `arn:aws:execute-api:${this.region}:${this.account}:${websocketApi.apiId}/${websocketStage.stageName}/POST/@connections/*`,
        ],
      }),
    );

    const requestsTable = new Table(this, "CommentaryRequestsTable", {
      partitionKey: {
        name: "requestId",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const commentaryQueue = new Queue(this, "CommentaryJobsQueue", {
      queueName: "grid-voice-commentary-jobs",
    });

    new CfnOutput(this, "RequestsTableName", {
      value: requestsTable.tableName,
    });

    new CfnOutput(this, "CommentaryQueueUrl", {
      value: commentaryQueue.queueUrl,
    });

    new CfnOutput(this, "CommentaryWebSocketEndpoint", {
      value: websocketStage.url,
    });
  }
}
