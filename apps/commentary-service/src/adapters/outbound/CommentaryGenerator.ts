import OpenAI from "openai";
import type {
  CommentaryTextGeneratorPort,
  WsCommentaryRequest,
} from "@grid-voice/types";

const SYSTEM_PROMPT = `You are a professional Formula 1 commentator.

Your job is to generate short, exciting, and natural-sounding race commentary.

Rules:
- Maximum 5 words
- Be energetic and engaging
- Avoid repeating phrases
- Focus only on important events
- Use driver last names only
- Use this Drivers Number to get the correct name:
  44 - Lewis Hamilton
  63 - George Russell
  16 - Charles Leclerc
  1 - Lando Norris
  81 - Oscar Piastri
  31 - Esteban Ocon
  87 - Oliver Bearman
  3 - Max Verstappen
  6 - Isack Hadjar
  30 - Liam Lawson
  41 - Arvid Lindblad
  14 - Fernando Alonso
  18 - Lance Stroll
  23 - Alex Albon
  55 - Carlos Sainz
  10 - Pierre Gasly
  11 - Sergio Perez
  43 - Franco Colapinto
  27 - Nico Hulkenberg
  5 - Gabriel Bortoleto
  77 - Valtteri Bottas
- Mention corner or context if available
- Do NOT explain, just commentate
- DO NOT use driver numbers in the commentary, only use the names or short names above
- Before the race start wish a greeting only when Race Start event is triggered or when the message is "Race Start"(Good Morning or Good Afternoon)

Tone:
Like a live TV broadcast (excited but clear)

Vary your vocabulary. Avoid overusing phrases like "what a move".
Use different tones depending on the event:
- Overtake -> excitement
- Pit stop -> strategic
- Fast lap -> dominance`;

const FALLBACK_MESSAGE = "Lights out, and we are racing!";

export class OpenAiCommentaryGenerator implements CommentaryTextGeneratorPort {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model = "gpt-4.1-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateText(input: WsCommentaryRequest): Promise<string> {
    const completion = await this.client.responses.create({
      model: this.model,
      temperature: this.resolveTemperature(input),
      max_output_tokens: 80,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: SYSTEM_PROMPT }],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: this.buildUserPrompt(input),
            },
          ],
        },
      ],
    });

    const candidate = this.extractText(completion.output_text);
    return this.enforceWordLimit(candidate || FALLBACK_MESSAGE, 15);
  }

  private buildUserPrompt(input: WsCommentaryRequest): string {
    return [
      `Season ${input.season}, round ${input.round}.`,
      `Driver context: ${input.driver}.`,
      `Race event: ${input.event}.`,
      `Requested style tone: ${input.tone}.`,
      "Return one single line of commentary.",
    ].join(" ");
  }

  private resolveTemperature(input: WsCommentaryRequest): number {
    switch (input.tone) {
      case "hyped":
        return 0.95;
      case "technical":
        return 0.55;
      case "neutral":
      default:
        return 0.75;
    }
  }

  private extractText(outputText: unknown): string {
    if (typeof outputText === "string") {
      return outputText.trim();
    }

    if (Array.isArray(outputText)) {
      const joined = outputText
        .map((segment) => {
          if (!segment || typeof segment !== "object") {
            return "";
          }

          const text = (segment as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        })
        .filter(Boolean)
        .join(" ");

      return joined.trim();
    }

    return "";
  }

  private enforceWordLimit(text: string, limit: number): string {
    const normalized = text
      .replace(/\s+/g, " ")
      .replace(/[\r\n]+/g, " ")
      .trim();

    const words = normalized.split(" ").filter(Boolean);

    if (words.length <= limit) {
      return normalized;
    }

    return words.slice(0, limit).join(" ");
  }
}
