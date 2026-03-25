import { useMemo } from "react";
import type { LeaderboardRow } from "../types";
import { buildLeaderboard } from "../homeState";

export function useLeaderboard(
  progressMap: Record<string, number>,
): LeaderboardRow[] {
  return useMemo(() => buildLeaderboard(progressMap), [progressMap]);
}
