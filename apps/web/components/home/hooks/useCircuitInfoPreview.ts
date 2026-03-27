import { useEffect, useState } from "react";

type CircuitTrackPoint = {
  x?: unknown;
  y?: unknown;
};

type CircuitCorner = {
  trackPosition?: CircuitTrackPoint;
};

type CircuitInfoPayload = {
  circuitName?: unknown;
  location?: unknown;
  countryName?: unknown;
  raceDate?: unknown;
  round?: unknown;
  year?: unknown;
  corners?: unknown;
  marshalLights?: unknown;
  marshalSectors?: unknown;
  x?: unknown;
  y?: unknown;
};

type CircuitInfoSummary = {
  circuitName: string;
  location: string;
  countryName: string;
  raceDate: string;
  round: number | null;
  year: number | null;
  corners: number;
  marshalLights: number;
  marshalSectors: number;
};

type UseCircuitInfoPreviewArgs = {
  circuitInfoUrl?: string;
};

type UseCircuitInfoPreviewResult = {
  summary: CircuitInfoSummary | null;
  loading: boolean;
  error: string | null;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toSummary(payload: CircuitInfoPayload): CircuitInfoSummary {
  const corners = asArray<CircuitCorner>(payload.corners);
  const marshalLights = asArray<CircuitCorner>(payload.marshalLights);
  const marshalSectors = asArray<CircuitCorner>(payload.marshalSectors);

  return {
    circuitName: asString(payload.circuitName),
    location: asString(payload.location),
    countryName: asString(payload.countryName),
    raceDate: asString(payload.raceDate),
    round: asNumber(payload.round),
    year: asNumber(payload.year),
    corners: corners.length,
    marshalLights: marshalLights.length,
    marshalSectors: marshalSectors.length,
  };
}

/**
 * Loads and normalizes circuit metadata from a circuitInfoUrl for preview UIs.
 */
export function useCircuitInfoPreview({
  circuitInfoUrl,
}: UseCircuitInfoPreviewArgs): UseCircuitInfoPreviewResult {
  const [summary, setSummary] = useState<CircuitInfoSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!circuitInfoUrl) {
      setSummary(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(circuitInfoUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load circuit metadata.");
        }

        const payload = (await response.json()) as CircuitInfoPayload;
        if (!cancelled) {
          setSummary(toSummary(payload));
        }
      } catch {
        if (!cancelled) {
          setSummary(null);
          setError("Circuit metadata unavailable.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [circuitInfoUrl]);

  return {
    summary,
    loading,
    error,
  };
}
