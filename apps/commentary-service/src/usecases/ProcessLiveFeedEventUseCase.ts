import type { LiveRaceFeedEvent } from "@grid-voice/types";

export interface LiveFeedProcessResult {
  summary: string;
  eventType: LiveRaceFeedEvent["type"];
  eventDate: string;
}

export class ProcessLiveFeedEventUseCase {
  execute(event: LiveRaceFeedEvent): LiveFeedProcessResult {
    switch (event.type) {
      case "race_control":
        return {
          summary: `${event.message} (${event.flag})`,
          eventType: event.type,
          eventDate: event.date,
        };
      case "location":
        return {
          summary: `Location update for ${event.data.length} drivers`,
          eventType: event.type,
          eventDate: event.date,
        };
      case "overtake":
        return {
          summary: `${event.overtaking_driver_number} passed ${event.overtaken_driver_number} for P${event.position}`,
          eventType: event.type,
          eventDate: event.date,
        };
      case "event":
      default:
        return {
          summary: `Session event: ${event.event_type}`,
          eventType: event.type,
          eventDate: event.date,
        };
    }
  }
}
