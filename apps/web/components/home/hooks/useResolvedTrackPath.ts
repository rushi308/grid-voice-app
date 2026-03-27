import { useEffect, useState } from "react";
import type { RaceTrack } from "@grid-voice/types";
import { fetchTrackPath } from "../homeState";

/**
 * Resolves the SVG track path from OpenF1 circuit metadata first, then falls back
 * to the static GeoJSON/source path configured for the race.
 */
export function useResolvedTrackPath(
  selectedRace: RaceTrack,
  circuitInfoUrl?: string | null,
) {
  const [resolvedTrackPath, setResolvedTrackPath] = useState<string>(
    selectedRace.path,
  );

  useEffect(() => {
    let cancelled = false;

    const resolvePath = async () => {
      try {
        const nextPath = await fetchTrackPath({
          ...selectedRace,
          circuitInfoUrl: circuitInfoUrl ?? selectedRace.circuitInfoUrl,
        });
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
  }, [circuitInfoUrl, selectedRace]);

  return resolvedTrackPath;
}
