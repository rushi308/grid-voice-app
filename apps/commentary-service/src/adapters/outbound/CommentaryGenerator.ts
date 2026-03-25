import type {
  CommentaryGeneratorPort,
  WsCommentaryRequest,
  WsCommentaryResponse,
} from "@grid-voice/types";

export class TemplateCommentaryGenerator implements CommentaryGeneratorPort {
  async generate(input: WsCommentaryRequest): Promise<WsCommentaryResponse> {
    const styleLead = this.buildStyleLead(input.tone);
    const telemetry = input.includeTelemetry
      ? "Telemetry indicates stable tire temperatures and consistent throttle modulation through the sector."
      : "";

    const message = [
      `${styleLead} ${input.driver} in season ${input.season}, round ${input.round}.`,
      `Key moment: ${input.event}.`,
      telemetry,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      message,
      generatedAt: new Date().toISOString(),
    };
  }

  private buildStyleLead(tone: WsCommentaryRequest["tone"]): string {
    switch (tone) {
      case "hyped":
        return "What a dramatic phase of the race!";
      case "technical":
        return "From a technical perspective,";
      case "neutral":
      default:
        return "Race update:";
    }
  }
}
