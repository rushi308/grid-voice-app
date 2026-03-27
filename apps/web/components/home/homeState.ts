/**
 * @fileoverview
 * Pure helpers for race UI state: clock ticks, mock weather/lap metrics, leaderboard from
 * progress, OpenF1 HTTP fetch for circuit geometry and completed session results, and
 * calendar logic to mark races as upcoming vs completed.
 *
 * Used by client hooks and server/API-free `fetch` paths from components such as
 * `useResolvedTrackPath`, `useCompletedRaceSummary`, and `HomePageClient`.
 */

import { initialPointers } from "@/lib/season2026";
import type { RaceTrack } from "@grid-voice/types";
import type { CompletedRaceSummary, LeaderboardRow } from "./types";

type OpenF1CircuitInfoResponse = {
  x?: unknown;
  y?: unknown;
  corners?: Array<{
    trackPosition?: {
      x?: unknown;
      y?: unknown;
    };
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

/**
 * Parses loose JSON fields from OpenF1 into finite numbers.
 *
 * @param value - A number, numeric string, or anything else.
 * @returns A finite number, or `null` if parsing fails.
 * @example
 * asNumber("12.5"); // 12.5
 * asNumber(""); // null
 */
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

/**
 * Normalizes JSON string fields; non-strings become empty string.
 *
 * @param value - Arbitrary API payload field.
 * @returns Original string or `""`.
 * @example
 * asString(null); // ""
 * asString("VER"); // "VER"
 */
function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Reads boolean-ish flags (boolean or `"true"` string) from OpenF1 result rows.
 *
 * @param value - `boolean`, string, or other.
 * @returns Coerced boolean.
 * @example
 * asBoolean("true"); // true
 * asBoolean(1); // false
 */
function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
}

/**
 * Formats a race time for the results table (leader race time or stint duration).
 * Uses `mm:ss.mmm`, or `h:mm:ss.mmm` when an hour or more.
 *
 * @param seconds - Elapsed seconds (non-negative; negative clamped to 0).
 * @returns Human-readable duration string.
 * @example
 * formatDurationSeconds(65.432); // "1:05.432"
 * formatDurationSeconds(3665.1); // "1:01:05.100"
 */
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

/**
 * Advances the synthetic race clock by one second (demo / idle animation ticks).
 *
 * @param clock - Current integer second counter.
 * @returns `clock + 1`.
 * @example
 * nextRaceClock(41); // 42
 */
export function nextRaceClock(clock: number): number {
  return clock + 1;
}

/**
 * Seeds a per-driver progress map from {@link initialPointers} for placeholder animation.
 *
 * @returns Map of driver `code` → lap fraction in `[0, 1)`.
 * @example
 * buildInitialProgress(); // { VER: 0.12, NOR: 0.14, ... }
 */
export function buildInitialProgress(): Record<string, number> {
  const freshMap: Record<string, number> = {};
  initialPointers.forEach((driver, index) => {
    freshMap[driver.code] = (driver.progress + index * 0.02) % 1;
  });
  return freshMap;
}

/**
 * Fits arbitrary `[x, y]` world coordinates into the standard track SVG viewBox (8–92),
 * returning a compact SVG path (`M`/`L` commands). Latitude-like axis is inverted so
 * “north” maps visually upward like the demo/live hooks.
 *
 * @param coordinates - Polyline as `[lonOrX, latOrY][]`; first point opens the path.
 * @returns Space-separated SVG path fragment, or `""` if empty.
 * @example
 * mapGeoCoordinatesToTrackPath([[0, 0], [1, 0], [1, 1]]);
 * // "M8.00,92.00 L92.00,92.00 L92.00,8.00"
 */
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

/**
 * Compares wall-clock time to a race `date` string to decide archive vs upcoming UX.
 * Date-only strings use end-of-day UTC; timestamps add a four-hour session window.
 *
 * @param date - ISO date or datetime from {@link RaceTrack}.
 * @returns `"completed"` if the inferred session end is in the past, else `"upcoming"`.
 * @example
 * deriveRaceStatus("2020-01-01"); // likely "completed"
 */
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

/**
 * Cheap stand-in lap and temperature readouts when no MQTT row is available (demo clock only).
 *
 * @param raceClock - Tick counter from the UI clock.
 * @param laps - Total laps for modulo on synthetic current lap.
 * @returns `{ currentLap, trackTemp, airTemp }` derived deterministically from `raceClock`.
 * @example
 * toRaceMetrics(28, 58); // { currentLap: 3, trackTemp: 36, airTemp: 23 }
 */
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

/**
 * Orders drivers by progress fraction and fabricates pseudo gap strings for fallback UI.
 *
 * @param progressMap - Driver code → position around lap [0–1], from animation or MQTT.
 * @returns Sorted {@link LeaderboardRow} list with `LEADER` / `+X.XXXs` intervals.
 * @example
 * buildLeaderboard({ VER: 0.9, NOR: 0.85 });
 */
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

/**
 * Fetches circuit outline from OpenF1’s circuit info JSON when `circuitInfoUrl` is set.
 * Tries parallel `x`/`y` arrays first, then corner world positions, mapped via
 * {@link mapGeoCoordinatesToTrackPath}. Closes the loop with a duplicate first point.
 * On failure or missing URL, returns the static `race.path` from the season config.
 *
 * @param race - Selected round; uses `circuitInfoUrl` and fallback `path`.
 * @returns SVG `d` string suitable for the track stage.
 * @example
 * const d = await fetchTrackPath(season2026[3]);
 */
export async function fetchTrackPath(race: RaceTrack): Promise<string> {
  if (race.circuitInfoUrl) {
    try {
      const response = await fetch(race.circuitInfoUrl, { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as OpenF1CircuitInfoResponse;

        const xPoints = Array.isArray(data.x)
          ? data.x
              .map((value) => asNumber(value))
              .filter((value): value is number => value !== null)
          : [];
        const yPoints = Array.isArray(data.y)
          ? data.y
              .map((value) => asNumber(value))
              .filter((value): value is number => value !== null)
          : [];

        if (xPoints.length >= 2 && xPoints.length === yPoints.length) {
          const points = xPoints.map((x, index) => [x, yPoints[index]]);
          const closed = [...points, points[0]];
          const path = mapGeoCoordinatesToTrackPath(closed);
          if (path) {
            return path;
          }
        }

        const coordinates = (data.corners ?? [])
          .map((corner) => {
            const x = asNumber(corner.trackPosition?.x);
            const y = asNumber(corner.trackPosition?.y);
            return x !== null && y !== null ? [x, y] : null;
          })
          .filter((point): point is [number, number] => point !== null);

        if (coordinates.length >= 2) {
          const closed = [...coordinates, coordinates[0]];
          const path = mapGeoCoordinatesToTrackPath(closed);
          if (path) {
            return path;
          }
        }
      }
    } catch {
      // Fall back to configured static path.
    }
  }

  return race.path;
}

/**
 * Pulls classified results for a completed session from OpenF1 REST `session_result`.
 * Normalizes DNF/DNS/DSQ, formats gaps and winner race time, merges with `initialPointers`
 * for team/color fallbacks, and returns podium slice plus full table.
 *
 * @param race - Must include `sessionKey` for the API query.
 * @returns {@link CompletedRaceSummary} with `topThree` and `results`.
 * @throws If `sessionKey` is missing, HTTP errors, or payload empty.
 * @example
 * const summary = await fetchCompletedRaceSummary(selectedRace);
 * console.log(summary.topThree[0].code);
 */
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
