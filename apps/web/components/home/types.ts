import type { DriverPointer } from "@grid-voice/types";

export type LeaderboardRow = DriverPointer & {
  position: number;
  interval: string;
  progress: number;
  gapToLeaderSeconds?: number;
};

export type CompletedRaceEntry = {
  position: number;
  code: string;
  fullName: string;
  team: string;
  points: number;
  timeOrStatus: string;
};

export type CompletedRaceSummary = {
  raceName: string;
  round: number;
  topThree: CompletedRaceEntry[];
  results: CompletedRaceEntry[];
};
