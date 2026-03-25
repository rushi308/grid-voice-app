import { describe, expect, it } from "vitest";
import { ProcessLiveFeedEventUseCase } from "./ProcessLiveFeedEventUseCase.js";

describe("ProcessLiveFeedEventUseCase", () => {
  const useCase = new ProcessLiveFeedEventUseCase();

  it("summarizes race control events", () => {
    const result = useCase.execute({
      type: "race_control",
      date: "2026-03-22T12:00:00Z",
      meeting_key: 1,
      session_key: 2,
      message: "Safety car deployed",
      flag: "YELLOW",
    });

    expect(result).toEqual({
      summary: "Safety car deployed (YELLOW)",
      eventType: "race_control",
      eventDate: "2026-03-22T12:00:00Z",
    });
  });

  it("summarizes overtake events", () => {
    const result = useCase.execute({
      type: "overtake",
      date: "2026-03-22T12:01:00Z",
      overtaking_driver_number: 63,
      overtaken_driver_number: 4,
      position: 1,
    });

    expect(result.summary).toContain("63 passed 4 for P1");
    expect(result.eventType).toBe("overtake");
  });
});
