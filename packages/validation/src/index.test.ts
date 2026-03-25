import { describe, expect, it } from "vitest";
import { parseCommentaryRequest } from "./index.js";

describe("parseCommentaryRequest", () => {
  it("parses a valid request", () => {
    const parsed = parseCommentaryRequest({
      raceState: {
        grandPrix: "Australian Grand Prix",
        lap: 5,
        totalLaps: 58,
        weather: "Sunny",
        trackCondition: "dry",
        safetyCarDeployed: false,
        topDrivers: [
          {
            code: "RUS",
            position: 1,
            gapToLeaderSeconds: 0,
            tyreCompound: "soft",
          },
        ],
      },
      tone: "hype",
      maxWords: 60,
      includeStrategyInsights: true,
    });

    expect(parsed.tone).toBe("hype");
    expect(parsed.raceState.lap).toBe(5);
  });

  it("rejects when lap exceeds totalLaps", () => {
    expect(() =>
      parseCommentaryRequest({
        raceState: {
          grandPrix: "Australian Grand Prix",
          lap: 59,
          totalLaps: 58,
          weather: "Sunny",
          trackCondition: "dry",
          safetyCarDeployed: false,
          topDrivers: [
            {
              code: "RUS",
              position: 1,
              gapToLeaderSeconds: 0,
              tyreCompound: "soft",
            },
          ],
        },
        tone: "neutral",
        maxWords: 60,
        includeStrategyInsights: false,
      }),
    ).toThrow(/Lap cannot exceed totalLaps/);
  });
});
