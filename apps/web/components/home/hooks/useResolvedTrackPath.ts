import { useEffect, useState } from "react";
import type { RaceTrack } from "@/lib/season2026";
import { fetchTrackPath } from "../homeState";

export function useResolvedTrackPath(selectedRace: RaceTrack) {
  const [resolvedTrackPath, setResolvedTrackPath] = useState<string>(
    selectedRace.path,
  );

  useEffect(() => {
    let cancelled = false;

    const resolvePath = async () => {
      try {
        const nextPath = await fetchTrackPath(selectedRace);
        if (!cancelled) {
          setResolvedTrackPath(nextPath);
        }
      } catch {
        if (!cancelled) {
          setResolvedTrackPath(selectedRace.path);
        }
      }
    };

    resolvePath();
    return () => {
      cancelled = true;
    };
  }, [selectedRace]);

  return resolvedTrackPath;
}
