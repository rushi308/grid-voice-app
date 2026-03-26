import type { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import type {
  LiveRaceFeedEvent,
  WsCommentaryRequest,
  WsRaceContext,
} from "@grid-voice/types";
import { WebSocketEventParser } from "../adapters/inbound/WebSocketEventParser.js";
import { OpenAiCommentaryGenerator } from "../adapters/outbound/CommentaryGenerator.js";
import { OpenAiS3SpeechSynthesizer } from "../adapters/outbound/OpenAiS3SpeechSynthesizer.js";
import { WebSocketConnectionGateway } from "../adapters/outbound/WebSocketConnectionGateway.js";
import { GenerateCommentaryUseCase } from "../usecases/GenerateCommentaryUseCase.js";

const parser = new WebSocketEventParser();
const openAiApiKey = getRequiredEnv("OPENAI_API_KEY");
const audioBucketName = getRequiredEnv("GRID_VOICE_BUCKET");
const awsRegion = getRequiredEnv("AWS_REGION");

const commentaryTextGenerator = new OpenAiCommentaryGenerator(
  openAiApiKey,
  process.env.OPENAI_TEXT_MODEL,
);
const speechSynthesizer = new OpenAiS3SpeechSynthesizer({
  apiKey: openAiApiKey,
  bucketName: audioBucketName,
  region: awsRegion,
  ttsModel: process.env.OPENAI_TTS_MODEL,
  ttsVoice: process.env.OPENAI_TTS_VOICE,
  urlTtlSeconds: toNumber(process.env.COMMENTARY_AUDIO_URL_TTL_SECONDS, 900),
});
const generateCommentaryUseCase = new GenerateCommentaryUseCase(
  commentaryTextGenerator,
  speechSynthesizer,
);

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
      const envelope = parser.parseSendDataEnvelope(event);
      const liveEvent = envelope.payload;
      const generatedRequest = buildCommentaryRequestFromLiveEvent(
        liveEvent,
        envelope.race,
      );
      const generatedResponse =
        await generateCommentaryUseCase.execute(generatedRequest);

      await connectionGateway.sendJson(connectionId, {
        type: "commentary.generated",
        payload: {
          source: "live-feed",
          feedType: liveEvent.type,
          request: generatedRequest,
          commentary: generatedResponse,
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

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function buildCommentaryRequestFromLiveEvent(
  event: LiveRaceFeedEvent,
  race?: WsRaceContext,
): WsCommentaryRequest {
  const season =
    race?.season ?? toNumber(process.env.LIVE_FEED_DEFAULT_SEASON, 2026);
  const round = race?.round ?? toNumber(process.env.LIVE_FEED_DEFAULT_ROUND, 1);
  const raceLabel = race?.name ?? "Race";

  switch (event.type) {
    case "overtake":
      return {
        season,
        round,
        driver: String(event.overtaking_driver_number),
        event: `${raceLabel}: Overtake, ${event.overtaking_driver_number} passed ${event.overtaken_driver_number} for P${event.position}`,
        tone: "hyped",
        includeTelemetry: false,
      };
    case "race_control":
      return {
        season,
        round,
        driver: "race-control",
        event: `${raceLabel}: ${event.message} (${event.flag})`,
        tone: "technical",
        includeTelemetry: false,
      };
    case "location":
      return {
        season,
        round,
        driver: "field",
        event: `${raceLabel}: Location update for ${event.data.length} drivers`,
        tone: "neutral",
        includeTelemetry: false,
      };
    case "event":
    default:
      return {
        season,
        round,
        driver:
          event.type === "event" && "driver_number" in event
            ? String(event.driver_number)
            : "session",
        event:
          event.type === "event"
            ? `${raceLabel}: Session event ${event.event_type}`
            : `${raceLabel}: Session update`,
        tone: "neutral",
        includeTelemetry: false,
      };
  }
}
