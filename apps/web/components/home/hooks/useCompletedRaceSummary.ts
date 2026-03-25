import { useEffect, useState } from "react";
import type { RaceTrack } from "@/lib/season2026";
import type { CompletedRaceSummary } from "../types";
import { fetchCompletedRaceSummary } from "../homeState";

export function useCompletedRaceSummary(
  selectedRace: RaceTrack,
  raceStatus: "completed" | "upcoming",
) {
  const [completedSummary, setCompletedSummary] =
    useState<CompletedRaceSummary | null>(null);
  const [completedSummaryLoading, setCompletedSummaryLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      if (raceStatus !== "completed") {
        setCompletedSummary(null);
        setCompletedSummaryLoading(false);
        return;
      }

      setCompletedSummaryLoading(true);

      try {
        const data = await fetchCompletedRaceSummary(selectedRace);
        if (!cancelled) {
          setCompletedSummary(data);
        }
      } catch {
        if (!cancelled) {
          setCompletedSummary(null);
        }
      } finally {
        if (!cancelled) {
          setCompletedSummaryLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [raceStatus, selectedRace]);

  return {
    completedSummary,
    completedSummaryLoading,
  };
}
