import type { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import type {
  LiveRaceFeedEvent,
  WsCommentaryRequest,
  WsCommentaryTone,
  WsIncomingPayload,
} from "@grid-voice/types";

const allowedTones: WsCommentaryTone[] = ["neutral", "hyped", "technical"];

export class WebSocketEventParser {
  parseGenerateRequest(
    event: APIGatewayProxyWebsocketEventV2,
  ): WsCommentaryRequest {
    if (!event.body) {
      throw new Error("Request body is required.");
    }

    const payload = JSON.parse(event.body) as WsIncomingPayload;

    if (payload.action !== "generateCommentary") {
      throw new Error("Unsupported action. Use 'generateCommentary'.");
    }

    const season = this.toNumber(payload.season, "season");
    const round = this.toNumber(payload.round, "round");
    const driver = this.toNonEmptyString(payload.driver, "driver");
    const raceEvent = this.toNonEmptyString(payload.event, "event");

    const tone = this.toTone(payload.tone);
    const includeTelemetry = Boolean(payload.includeTelemetry);

    return {
      season,
      round,
      driver,
      event: raceEvent,
      tone,
      includeTelemetry,
    };
  }

  parseSendDataEvent(event: APIGatewayProxyWebsocketEventV2): LiveRaceFeedEvent {
    if (!event.body) {
      throw new Error("Request body is required.");
    }

    const body = JSON.parse(event.body) as Record<string, unknown>;
    const action = body.action;

    if (action !== "SendData") {
      throw new Error("Unsupported action. Use 'SendData'.");
    }

    const candidate = this.toObject(body.payload ?? body, "payload");
    const type = this.toNonEmptyString(candidate.type, "type");

    switch (type) {
      case "race_control":
        return {
          type: "race_control",
          date: this.toNonEmptyString(candidate.date, "date"),
          meeting_key: this.toNumber(candidate.meeting_key, "meeting_key"),
          session_key: this.toNumber(candidate.session_key, "session_key"),
          message: this.toNonEmptyString(candidate.message, "message"),
          flag: this.toNonEmptyString(candidate.flag, "flag"),
        };
      case "location":
        return {
          type: "location",
          date: this.toNonEmptyString(candidate.date, "date"),
          meeting_key: this.toNumber(candidate.meeting_key, "meeting_key"),
          session_key: this.toNumber(candidate.session_key, "session_key"),
          data: this.toLocationPoints(candidate.data),
        };
      case "overtake":
        return {
          type: "overtake",
          date: this.toNonEmptyString(candidate.date, "date"),
          overtaking_driver_number: this.toNumber(
            candidate.overtaking_driver_number,
            "overtaking_driver_number",
          ),
          overtaken_driver_number: this.toNumber(
            candidate.overtaken_driver_number,
            "overtaken_driver_number",
          ),
          position: this.toNumber(candidate.position, "position"),
        };
      case "event": {
        const eventType = this.toNonEmptyString(candidate.event_type, "event_type");

        if (eventType === "RACE_FINISH") {
          return {
            type: "event",
            date: this.toNonEmptyString(candidate.date, "date"),
            event_type: "RACE_FINISH",
            results: this.toResults(candidate.results),
          };
        }

        return {
          type: "event",
          date: this.toNonEmptyString(candidate.date, "date"),
          event_type: eventType,
          driver_number: this.toOptionalNumber(candidate.driver_number),
          lap: this.toOptionalNumber(candidate.lap),
          sector: this.toOptionalNumber(candidate.sector),
        };
      }
      default:
        throw new Error("Unsupported feed type.");
    }
  }

  private toNumber(value: unknown, field: string): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new Error(`${field} must be a valid number.`);
    }
    return value;
  }

  private toNonEmptyString(value: unknown, field: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`${field} must be a non-empty string.`);
    }
    return value.trim();
  }

  private toTone(value: unknown): WsCommentaryTone {
    if (
      typeof value !== "string" ||
      !allowedTones.includes(value as WsCommentaryTone)
    ) {
      return "neutral";
    }

    return value as WsCommentaryTone;
  }

  private toObject(value: unknown, field: string): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`${field} must be an object.`);
    }

    return value as Record<string, unknown>;
  }

  private toOptionalNumber(value: unknown): number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    return this.toNumber(value, "optional number");
  }

  private toLocationPoints(value: unknown): Array<{
    driver_number: number;
    x: number;
    y: number;
    z: number;
  }> {
    if (!Array.isArray(value)) {
      throw new Error("data must be an array.");
    }

    return value.map((point, index) => {
      const obj = this.toObject(point, `data[${index}]`);
      return {
        driver_number: this.toNumber(obj.driver_number, "driver_number"),
        x: this.toNumber(obj.x, "x"),
        y: this.toNumber(obj.y, "y"),
        z: this.toNumber(obj.z, "z"),
      };
    });
  }

  private toResults(value: unknown): Array<{ position: number; driver_number: number }> {
    if (!Array.isArray(value)) {
      throw new Error("results must be an array.");
    }

    return value.map((entry, index) => {
      const obj = this.toObject(entry, `results[${index}]`);
      return {
        position: this.toNumber(obj.position, "position"),
        driver_number: this.toNumber(obj.driver_number, "driver_number"),
      };
    });
  }
}
