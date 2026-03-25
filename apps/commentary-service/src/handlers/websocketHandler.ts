import type { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { WebSocketEventParser } from "../adapters/inbound/WebSocketEventParser.js";
import { TemplateCommentaryGenerator } from "../adapters/outbound/CommentaryGenerator.js";
import { WebSocketConnectionGateway } from "../adapters/outbound/WebSocketConnectionGateway.js";
import { GenerateCommentaryUseCase } from "../usecases/GenerateCommentaryUseCase.js";
import { ProcessLiveFeedEventUseCase } from "../usecases/ProcessLiveFeedEventUseCase.js";

const parser = new WebSocketEventParser();
const generateCommentaryUseCase = new GenerateCommentaryUseCase(
  new TemplateCommentaryGenerator(),
);
const processLiveFeedEventUseCase = new ProcessLiveFeedEventUseCase();

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<{ statusCode: number; body: string }> => {
  const routeKey = event.requestContext.routeKey;

  if (routeKey === "$connect" || routeKey === "$disconnect") {
    return {
      statusCode: 200,
      body: "ok",
    };
  }

  if (routeKey !== "generateCommentary" && routeKey !== "SendData") {
    return {
      statusCode: 400,
      body: "Unsupported route.",
    };
  }

  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const connectionId = event.requestContext.connectionId;

  if (!domainName || !stage || !connectionId) {
    return {
      statusCode: 400,
      body: "Missing websocket connection context.",
    };
  }

  const gatewayEndpoint = `https://${domainName}/${stage}`;
  const connectionGateway = new WebSocketConnectionGateway(gatewayEndpoint);

  if (routeKey === "SendData") {
    try {
      const liveEvent = parser.parseSendDataEvent(event);
      const processed = processLiveFeedEventUseCase.execute(liveEvent);

      await connectionGateway.sendJson(connectionId, {
        type: "live.event.accepted",
        payload: {
          ...processed,
          receivedAt: new Date().toISOString(),
        },
      });

      return {
        statusCode: 200,
        body: "live-event-accepted",
      };
    } catch (error) {
      await connectionGateway.sendJson(connectionId, {
        type: "live.event.error",
        payload: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        statusCode: 200,
        body: "live-event-error",
      };
    }
  }

  try {
    const request = parser.parseGenerateRequest(event);
    const response = await generateCommentaryUseCase.execute(request);

    await connectionGateway.sendJson(connectionId, {
      type: "commentary.generated",
      payload: response,
    });

    return {
      statusCode: 200,
      body: "sent",
    };
  } catch (error) {
    await connectionGateway.sendJson(connectionId, {
      type: "commentary.error",
      payload: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      statusCode: 200,
      body: "handled-error",
    };
  }
};
