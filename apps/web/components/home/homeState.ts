import { initialPointers } from "@/lib/season2026";
import type { RaceTrack } from "@grid-voice/types";
import type { CompletedRaceSummary, LeaderboardRow } from "./types";

type GeoFeatureCollection = {
  features?: Array<{
    geometry?: {
      type?: string;
      coordinates?: number[][];
    };
  }>;
};

type OpenF1CircuitInfoResponse = {
  corners?: Array<{
    x?: unknown;
    y?: unknown;
    number?: unknown;
  }>;
};

type OpenF1SessionResult = {
  position?: unknown;
  points?: unknown;
  abbreviation?: unknown;
  full_name?: unknown;
  team_name?: unknown;
  status?: unknown;
  classified_position?: unknown;
  driver_number?: unknown;
  duration?: unknown;
  gap_to_leader?: unknown;
  dnf?: unknown;
  dns?: unknown;
  dsq?: unknown;
};

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

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
}

function formatDurationSeconds(seconds: number): string {
  const safe = Math.max(0, seconds);
  const totalMilliseconds = Math.round(safe * 1000);
  const wholeSeconds = Math.floor(totalMilliseconds / 1000);
  const milliseconds = totalMilliseconds % 1000;
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const secs = wholeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

export function nextRaceClock(clock: number): number {
  return clock + 1;
}

export function buildInitialProgress(): Record<string, number> {
  const freshMap: Record<string, number> = {};
  initialPointers.forEach((driver, index) => {
    freshMap[driver.code] = (driver.progress + index * 0.02) % 1;
  });
  return freshMap;
}

export function mapGeoCoordinatesToTrackPath(coordinates: number[][]): string {
  if (!coordinates.length) {
    return "";
  }

  const lons = coordinates.map((point) => point[0]);
  const lats = coordinates.map((point) => point[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const mapX = (lon: number) => {
    if (maxLon === minLon) {
      return 50;
    }
    return 8 + ((lon - minLon) / (maxLon - minLon)) * 84;
  };

  const mapY = (lat: number) => {
    if (maxLat === minLat) {
      return 50;
    }
    return 92 - ((lat - minLat) / (maxLat - minLat)) * 84;
  };

  return coordinates
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${mapX(point[0]).toFixed(2)},${mapY(point[1]).toFixed(2)}`;
    })
    .join(" ");
}

export function deriveRaceStatus(date: string): "completed" | "upcoming" {
  const hasExplicitTime = date.includes("T");
  const startMs = Date.parse(date);

  if (Number.isFinite(startMs)) {
    const raceEndMs = hasExplicitTime
      ? startMs + 4 * 60 * 60 * 1000
      : Date.parse(`${date}T23:59:59Z`);
    return Date.now() > raceEndMs ? "completed" : "upcoming";
  }

  const fallbackEndMs = Date.parse(`${date}T23:59:59Z`);
  return Date.now() > fallbackEndMs ? "completed" : "upcoming";
}

export function toRaceMetrics(
  raceClock: number,
  laps: number,
): {
  currentLap: number;
  trackTemp: number;
  airTemp: number;
} {
  return {
    currentLap: (Math.floor(raceClock / 14) % laps || 0) + 1,
    trackTemp: 34 + (raceClock % 6),
    airTemp: 22 + (raceClock % 3),
  };
}

export function buildLeaderboard(
  progressMap: Record<string, number>,
): LeaderboardRow[] {
  const rows = initialPointers.map((driver) => ({
    ...driver,
    progress: progressMap[driver.code] ?? 0,
  }));

  rows.sort((a, b) => b.progress - a.progress);
  const leader = rows[0]?.progress ?? 0;

  return rows.map((row, index) => {
    const gap = index === 0 ? 0 : ((leader - row.progress + 1) % 1) * 95;
    return {
      ...row,
      position: index + 1,
      interval: index === 0 ? "LEADER" : `+${gap.toFixed(3)}s`,
    };
  });
}

export async function fetchTrackPath(race: RaceTrack): Promise<string> {
  if (race.circuitInfoUrl) {
    try {
      const response = await fetch(race.circuitInfoUrl, { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as OpenF1CircuitInfoResponse;
        const coordinates = (data.corners ?? [])
          .map((corner) => {
            const x = asNumber(corner.x);
            const y = asNumber(corner.y);
            return x !== null && y !== null ? [x, y] : null;
          })
          .filter((point): point is [number, number] => point !== null);

        if (coordinates.length >= 2) {
          const closed = [...coordinates, coordinates[0]];
          return mapGeoCoordinatesToTrackPath(closed);
        }
      }
    } catch {
      // Fall through to static fallback URLs.
    }
  }

  if (!race.circuitGeoJsonUrl) {
    return race.path;
  }

  const response = await fetch(race.circuitGeoJsonUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch GeoJSON: ${response.status}`);
  }

  const data = (await response.json()) as GeoFeatureCollection;
  const feature = data.features?.find(
    (item) => item.geometry?.type === "LineString",
  );
  const coordinates = feature?.geometry?.coordinates ?? [];
  return mapGeoCoordinatesToTrackPath(coordinates) || race.path;
}

export async function fetchCompletedRaceSummary(
  race: RaceTrack,
): Promise<CompletedRaceSummary> {
  if (!race.sessionKey) {
    throw new Error("Missing session key for selected race.");
  }

  const response = await fetch(
    `https://api.openf1.org/v1/session_result?session_key=${encodeURIComponent(String(race.sessionKey))}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Result unavailable");
  }

  const payload = (await response.json()) as OpenF1SessionResult[];
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("No completed result found");
  }

  const driverByNumber = new Map(
    initialPointers.map((driver) => [driver.number, driver]),
  );

  const results = payload
    .map((entry, index) => {
      const numericPosition = asNumber(entry.position);
      const fallbackPosition = asNumber(entry.classified_position);
      const resolvedPosition = numericPosition ?? fallbackPosition;
      const driverNumber = asNumber(entry.driver_number);
      const pointer =
        driverNumber !== null ? driverByNumber.get(driverNumber) : undefined;
      const fullName =
        asString(entry.full_name) || pointer?.fullName || "Unknown Driver";
      const abbreviation = asString(entry.abbreviation).trim();
      const code =
        abbreviation ||
        pointer?.code ||
        (Number.isFinite(driverNumber)
          ? String(driverNumber).padStart(2, "0")
          : fullName.slice(0, 3).toUpperCase());

      const isDsq = asBoolean(entry.dsq);
      const isDns = asBoolean(entry.dns);
      const isDnf = asBoolean(entry.dnf);
      const durationSeconds = asNumber(entry.duration);
      const gapToLeaderSeconds = asNumber(entry.gap_to_leader);

      let timeOrStatus = asString(entry.status) || "Finished";
      if (isDsq) {
        timeOrStatus = "DSQ";
      } else if (isDns) {
        timeOrStatus = "DNS";
      } else if (isDnf) {
        timeOrStatus = "DNF";
      } else if (resolvedPosition === 1 && durationSeconds !== null) {
        timeOrStatus = formatDurationSeconds(durationSeconds);
      } else if (
        gapToLeaderSeconds !== null &&
        Number.isFinite(gapToLeaderSeconds) &&
        gapToLeaderSeconds > 0
      ) {
        timeOrStatus = `+${gapToLeaderSeconds.toFixed(3)}s`;
      } else if (durationSeconds !== null) {
        timeOrStatus = formatDurationSeconds(durationSeconds);
      }

      return {
        position: resolvedPosition,
        sourceIndex: index,
        code,
        fullName,
        team: asString(entry.team_name) || pointer?.team || "Unknown Team",
        points: asNumber(entry.points) ?? 0,
        timeOrStatus,
      };
    })
    .sort((a, b) => {
      const positionA = a.position ?? Number.MAX_SAFE_INTEGER;
      const positionB = b.position ?? Number.MAX_SAFE_INTEGER;

      if (positionA !== positionB) {
        return positionA - positionB;
      }

      return a.sourceIndex - b.sourceIndex;
    })
    .map((entry, index) => ({
      position: entry.position ?? index + 1,
      code: entry.code,
      fullName: entry.fullName,
      team: entry.team,
      points: entry.points,
      timeOrStatus: entry.timeOrStatus,
    }));

  const topThree = results.slice(0, 3);

  return {
    raceName: race.name,
    round: race.round,
    topThree,
    results,
  };
}
