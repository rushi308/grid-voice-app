import { useMemo } from "react";
import circuitData from "@/data/china-26/circuit.json";
import intervalData from "@/data/china-26/interval.json";
import lapsData from "@/data/china-26/laps.json";
import driver3Locations from "@/data/china-26/driver-locations/3.json";
import driver6Locations from "@/data/china-26/driver-locations/6.json";
import driver10Locations from "@/data/china-26/driver-locations/10.json";
import driver11Locations from "@/data/china-26/driver-locations/11.json";
import driver12Locations from "@/data/china-26/driver-locations/12.json";
import driver16Locations from "@/data/china-26/driver-locations/16.json";
import driver27Locations from "@/data/china-26/driver-locations/27.json";
import driver30Locations from "@/data/china-26/driver-locations/30.json";
import driver31Locations from "@/data/china-26/driver-locations/31.json";
import driver41Locations from "@/data/china-26/driver-locations/41.json";
import driver43Locations from "@/data/china-26/driver-locations/43.json";
import driver44Locations from "@/data/china-26/driver-locations/44.json";
import driver55Locations from "@/data/china-26/driver-locations/55.json";
import driver63Locations from "@/data/china-26/driver-locations/63.json";
import driver77Locations from "@/data/china-26/driver-locations/77.json";
import { initialPointers } from "@/lib/season2026";
import type { DriverPointer } from "@grid-voice/types";
import type { LeaderboardRow } from "../types";

/** 15-car China demo grid (all drivers have `driver-locations/*.json` samples). */
const DEMO_DRIVER_NUMBERS = [
  3, 6, 10, 11, 12, 16, 27, 30, 31, 41, 43, 44, 55, 63, 77,
] as const;

/** Session numbers present in China data but not yet in `initialPointers`. */
const CHINA_ONLY_DEMO_DRIVERS: DriverPointer[] = [
  {
    code: "DOO",
    number: 11,
    fullName: "Jack Doohan",
    team: "Alpine",
    color: "#FF87BC",
    pace: 0.128,
    progress: 0.12,
  },
  {
    code: "MAL",
    number: 41,
    fullName: "Zane Maloney",
    team: "Kick Sauber",
    color: "#52E252",
    pace: 0.124,
    progress: 0.125,
  },
  {
    code: "BOT",
    number: 77,
    fullName: "Valtteri Bottas",
    team: "Kick Sauber",
    color: "#52E252",
    pace: 0.124,
    progress: 0.13,
  },
];
const DEMO_INTERVAL_START_ISO = "2026-03-15T07:04:06.055000+00:00";
const DEMO_START_COUNTDOWN_SECONDS = 10;
const DEMO_START_TRANSITION_SUPPRESS_SECONDS = 2;

type CircuitData = {
  x: number[];
  y: number[];
  trackPositionTime?: number[];
  candidateLap?: {
    lapStartSessionTime?: number;
  };
};

type IntervalEntry = {
  date: string;
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
};

type LocationEntry = {
  date: string;
  x: number;
  y: number;
  z: number;
  driver_number: number;
};

type LapEntry = {
  driver_number: number;
  lap_number: number;
  date_start: string | null;
};

type DriverPosition = {
  x: number;
  y: number;
};

type UseChinaDemoRaceDataArgs = {
  enabled: boolean;
  raceClockSeconds: number;
  totalLaps: number;
};

type UseChinaDemoRaceDataResult = {
  trackPath: string | null;
  progressMap: Record<string, number> | null;
  leaderboard: LeaderboardRow[] | null;
  driverPositions: Record<string, DriverPosition> | null;
  currentLap: number | null;
  startPoint: DriverPosition | null;
  lapEndPoint: DriverPosition | null;
  startCountdownValue: number | null;
  suppressPositionTransition: boolean;
};

const circuit = circuitData as CircuitData;
const intervals = intervalData as IntervalEntry[];
const laps = lapsData as LapEntry[];

const locationsByDriverNumber: Record<number, LocationEntry[]> = {
  3: driver3Locations as LocationEntry[],
  6: driver6Locations as LocationEntry[],
  10: driver10Locations as LocationEntry[],
  11: driver11Locations as LocationEntry[],
  12: driver12Locations as LocationEntry[],
  16: driver16Locations as LocationEntry[],
  27: driver27Locations as LocationEntry[],
  30: driver30Locations as LocationEntry[],
  31: driver31Locations as LocationEntry[],
  41: driver41Locations as LocationEntry[],
  43: driver43Locations as LocationEntry[],
  44: driver44Locations as LocationEntry[],
  55: driver55Locations as LocationEntry[],
  63: driver63Locations as LocationEntry[],
  77: driver77Locations as LocationEntry[],
};

const driverByNumber = new Map<number, DriverPointer>([
  ...initialPointers.map((driver) => [driver.number, driver] as const),
  ...CHINA_ONLY_DEMO_DRIVERS.map((driver) => [driver.number, driver] as const),
]);
const intervalStartMs = Date.parse(DEMO_INTERVAL_START_ISO);

const minCircuitX = Math.min(...circuit.x);
const maxCircuitX = Math.max(...circuit.x);
const minCircuitY = Math.min(...circuit.y);
const maxCircuitY = Math.max(...circuit.y);

let minTelemetryX = minCircuitX;
let maxTelemetryX = maxCircuitX;
let minTelemetryY = minCircuitY;
let maxTelemetryY = maxCircuitY;

for (const driverNumber of DEMO_DRIVER_NUMBERS) {
  const entries = locationsByDriverNumber[driverNumber] ?? [];
  for (const entry of entries) {
    if (entry.x === 0 && entry.y === 0) {
      continue;
    }
    if (entry.x < minTelemetryX) {
      minTelemetryX = entry.x;
    }
    if (entry.x > maxTelemetryX) {
      maxTelemetryX = entry.x;
    }
    if (entry.y < minTelemetryY) {
      minTelemetryY = entry.y;
    }
    if (entry.y > maxTelemetryY) {
      maxTelemetryY = entry.y;
    }
  }
}

const VIEWBOX_MIN = 8;
const VIEWBOX_MAX = 92;
const VIEWBOX_SPAN = VIEWBOX_MAX - VIEWBOX_MIN;
const circuitSpanX = Math.max(1, maxTelemetryX - minTelemetryX);
const circuitSpanY = Math.max(1, maxTelemetryY - minTelemetryY);
const circuitUniformSpan = Math.max(circuitSpanX, circuitSpanY);
const offsetX = (circuitUniformSpan - circuitSpanX) / 2;
const offsetY = (circuitUniformSpan - circuitSpanY) / 2;

/**
 * Normalizes a raw circuit X coordinate into SVG viewBox space (8..92).
 *
 * @param x - Raw telemetry X coordinate.
 * @returns Normalized X value for SVG rendering.
 * @example
 * normalizeX(1234.56); // 47.2
 */
function normalizeX(x: number): number {
  if (circuitUniformSpan <= 0) {
    return 50;
  }
  const shifted = x - minTelemetryX + offsetX;
  const scaled = VIEWBOX_MIN + (shifted / circuitUniformSpan) * VIEWBOX_SPAN;
  return Math.min(VIEWBOX_MAX, Math.max(VIEWBOX_MIN, scaled));
}

/**
 * Normalizes a raw circuit Y coordinate into SVG viewBox space (8..92).
 * Y is inverted so larger telemetry Y draws higher on the map.
 *
 * @param y - Raw telemetry Y coordinate.
 * @returns Normalized Y value for SVG rendering.
 * @example
 * normalizeY(987.65); // 61.4
 */
function normalizeY(y: number): number {
  if (circuitUniformSpan <= 0) {
    return 50;
  }
  const shifted = y - minTelemetryY + offsetY;
  const scaled = VIEWBOX_MAX - (shifted / circuitUniformSpan) * VIEWBOX_SPAN;
  return Math.min(VIEWBOX_MAX, Math.max(VIEWBOX_MIN, scaled));
}

/**
 * Converts raw telemetry location to normalized SVG coordinates.
 *
 * @param location - Driver telemetry location entry.
 * @returns Position usable by TrackStage.
 * @example
 * normalizeLocationPoint({ date: "...", x: 12, y: 34, z: 0, driver_number: 44 });
 */
function normalizeLocationPoint(location: LocationEntry): DriverPosition {
  return {
    x: normalizeX(location.x),
    y: normalizeY(location.y),
  };
}

const normalizedCircuitPoints: DriverPosition[] = (() => {
  const size = Math.min(circuit.x.length, circuit.y.length);
  const points: DriverPosition[] = [];
  for (let index = 0; index < size; index += 1) {
    points.push({
      x: normalizeX(circuit.x[index]),
      y: normalizeY(circuit.y[index]),
    });
  }
  return points;
})();

function projectPointToTrack(point: DriverPosition): DriverPosition {
  if (normalizedCircuitPoints.length === 0) {
    return point;
  }

  if (normalizedCircuitPoints.length === 1) {
    return normalizedCircuitPoints[0];
  }

  let bestPoint = normalizedCircuitPoints[0];
  let bestDistanceSquared = Number.POSITIVE_INFINITY;

  for (let index = 0; index < normalizedCircuitPoints.length - 1; index += 1) {
    const a = normalizedCircuitPoints[index];
    const b = normalizedCircuitPoints[index + 1];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const abLengthSquared = abx * abx + aby * aby;

    const t =
      abLengthSquared <= 0
        ? 0
        : Math.min(
            1,
            Math.max(
              0,
              ((point.x - a.x) * abx + (point.y - a.y) * aby) / abLengthSquared,
            ),
          );

    const projected = {
      x: a.x + abx * t,
      y: a.y + aby * t,
    };

    const dx = point.x - projected.x;
    const dy = point.y - projected.y;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared;
      bestPoint = projected;
    }
  }

  return bestPoint;
}

/**
 * Builds an SVG path string directly from circuit coordinates.
 * This is what allows the UI to display the circuit from `circuit.json`.
 *
 * @param xPoints - Circuit x array from dataset.
 * @param yPoints - Circuit y array from dataset.
 * @returns SVG path string (M/L commands).
 * @example
 * toTrackPath(circuit.x, circuit.y); // "M10.2,85.1 L10.5,84.8 ..."
 */
function toTrackPath(xPoints: number[], yPoints: number[]): string {
  const size = Math.min(xPoints.length, yPoints.length);
  if (size === 0) {
    return "";
  }

  let path = "";
  for (let index = 0; index < size; index += 1) {
    const command = index === 0 ? "M" : "L";
    path += `${command}${normalizeX(xPoints[index]).toFixed(2)},${normalizeY(
      yPoints[index],
    ).toFixed(2)} `;
  }
  return path.trim();
}

/**
 * Returns a normalized point on the circuit polyline for progress [0..1].
 *
 * @param progress - Relative progress around the lap.
 * @returns Normalized screen point for the circuit.
 * @example
 * getCircuitPointAtProgress(0.25); // { x: 42.3, y: 70.8 }
 */
function getCircuitPointAtProgress(progress: number): { x: number; y: number } {
  const size = Math.min(circuit.x.length, circuit.y.length);
  if (size === 0) {
    return { x: 50, y: 50 };
  }

  const clampedProgress = Math.min(1, Math.max(0, progress));
  const scaledIndex = clampedProgress * (size - 1);
  const startIndex = Math.floor(scaledIndex);
  const endIndex = Math.min(size - 1, startIndex + 1);
  const t = scaledIndex - startIndex;

  const interpolatedX =
    circuit.x[startIndex] + (circuit.x[endIndex] - circuit.x[startIndex]) * t;
  const interpolatedY =
    circuit.y[startIndex] + (circuit.y[endIndex] - circuit.y[startIndex]) * t;

  return {
    x: normalizeX(interpolatedX),
    y: normalizeY(interpolatedY),
  };
}

/**
 * Parses an ISO timestamp into epoch milliseconds.
 *
 * @param isoDate - ISO date string.
 * @returns Epoch milliseconds.
 * @example
 * parseDateMs("2026-03-15T07:04:06.055000+00:00");
 */
function parseDateMs(isoDate: string): number {
  return Date.parse(isoDate);
}

/**
 * Binary-searches for the latest entry at or before target time.
 *
 * @param entries - Time-ordered entries with `date`.
 * @param targetMs - Target timestamp in epoch ms.
 * @returns Latest matching entry or null.
 * @example
 * findLatestEntryAtOrBefore(intervals, Date.now());
 */
function findLatestEntryAtOrBefore<T extends { date: string }>(
  entries: T[],
  targetMs: number,
): T | null {
  let low = 0;
  let high = entries.length - 1;
  let resultIndex = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const midTime = parseDateMs(entries[mid].date);
    if (midTime <= targetMs) {
      resultIndex = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return resultIndex >= 0 ? entries[resultIndex] : null;
}

/**
 * Binary-searches the latest lap record started at or before target time.
 *
 * @param entries - Time-sorted lap entries.
 * @param targetMs - Target timestamp in epoch ms.
 * @returns Latest started lap or null.
 * @example
 * findLatestLapAtOrBefore(driverLaps, Date.now());
 */
function findLatestLapAtOrBefore(
  entries: LapEntry[],
  targetMs: number,
): LapEntry | null {
  let low = 0;
  let high = entries.length - 1;
  let resultIndex = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const dateStart = entries[mid].date_start;
    if (!dateStart) {
      low = mid + 1;
      continue;
    }
    const midTime = parseDateMs(dateStart);
    if (midTime <= targetMs) {
      resultIndex = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return resultIndex >= 0 ? entries[resultIndex] : null;
}

/**
 * Binary-searches for latest location index at or before target time.
 *
 * @param entries - Time-sorted location entries.
 * @param targetMs - Target timestamp in epoch ms.
 * @returns Matching index or -1 if not found.
 * @example
 * findLatestIndexAtOrBefore(locations, Date.now()); // 152
 */
function findLatestIndexAtOrBefore(
  entries: LocationEntry[],
  targetMs: number,
): number {
  let low = 0;
  let high = entries.length - 1;
  let resultIndex = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const midTime = parseDateMs(entries[mid].date);
    if (midTime <= targetMs) {
      resultIndex = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return resultIndex;
}

/**
 * Finds the first location index that is not (0,0).
 *
 * @param entries - Driver location samples.
 * @returns First non-zero index or -1.
 * @example
 * findFirstNonZeroIndex(driverLocations); // 8
 */
function findFirstNonZeroIndex(entries: LocationEntry[]): number {
  for (let index = 0; index < entries.length; index += 1) {
    if (entries[index].x !== 0 || entries[index].y !== 0) {
      return index;
    }
  }
  return -1;
}

/**
 * Finds a visible location sample for rendering at target time.
 * Falls back to first non-zero point if no earlier sample exists.
 *
 * @param entries - Driver location samples.
 * @param targetMs - Active timeline timestamp.
 * @returns Best renderable sample index or -1.
 * @example
 * findVisibleLocationIndex(driverLocations, Date.now()); // 305
 */
function findVisibleLocationIndex(
  entries: LocationEntry[],
  targetMs: number,
): number {
  const latestIndex = findLatestIndexAtOrBefore(entries, targetMs);
  if (latestIndex < 0) {
    return findFirstNonZeroIndex(entries);
  }

  for (let index = latestIndex; index >= 0; index -= 1) {
    if (entries[index].x !== 0 || entries[index].y !== 0) {
      return index;
    }
  }

  return findFirstNonZeroIndex(entries);
}

const intervalEntriesByDriver = new Map<number, IntervalEntry[]>();
for (const driverNumber of DEMO_DRIVER_NUMBERS) {
  intervalEntriesByDriver.set(
    driverNumber,
    intervals.filter((entry) => entry.driver_number === driverNumber),
  );
}

const lapEntriesByDriver = new Map<number, LapEntry[]>();
for (const driverNumber of DEMO_DRIVER_NUMBERS) {
  const series = laps
    .filter(
      (entry) =>
        entry.driver_number === driverNumber && entry.date_start !== null,
    )
    .sort((a, b) => {
      const aMs = parseDateMs(a.date_start ?? "");
      const bMs = parseDateMs(b.date_start ?? "");
      return aMs - bMs;
    });
  lapEntriesByDriver.set(driverNumber, series);
}

const firstNonZeroLocationIndexByDriver = new Map<number, number>();
for (const driverNumber of DEMO_DRIVER_NUMBERS) {
  const entries = locationsByDriverNumber[driverNumber] ?? [];
  firstNonZeroLocationIndexByDriver.set(
    driverNumber,
    findFirstNonZeroIndex(entries),
  );
}

/**
 * Finds first index where coordinates differ from initial stable point.
 *
 * @param entries - Driver location samples.
 * @param firstNonZeroIndex - First valid location index.
 * @returns Index of first motion sample or -1.
 * @example
 * findFirstCoordinateChangeIndex(driverLocations, 8); // 23
 */
function findFirstCoordinateChangeIndex(
  entries: LocationEntry[],
  firstNonZeroIndex: number,
): number {
  if (firstNonZeroIndex < 0 || firstNonZeroIndex >= entries.length) {
    return -1;
  }

  const base = entries[firstNonZeroIndex];
  for (let index = firstNonZeroIndex + 1; index < entries.length; index += 1) {
    if (entries[index].x !== base.x || entries[index].y !== base.y) {
      return index;
    }
  }

  return -1;
}

const firstCoordinateChangeIndexByDriver = new Map<number, number>();
for (const driverNumber of DEMO_DRIVER_NUMBERS) {
  const entries = locationsByDriverNumber[driverNumber] ?? [];
  const firstNonZeroIndex =
    firstNonZeroLocationIndexByDriver.get(driverNumber) ?? -1;
  firstCoordinateChangeIndexByDriver.set(
    driverNumber,
    findFirstCoordinateChangeIndex(entries, firstNonZeroIndex),
  );
}

const firstMovingPositionByDriver = new Map<number, DriverPosition>();
for (const driverNumber of DEMO_DRIVER_NUMBERS) {
  const entries = locationsByDriverNumber[driverNumber] ?? [];
  const firstNonZeroIndex =
    firstNonZeroLocationIndexByDriver.get(driverNumber) ?? -1;
  const firstCoordinateChangeIndex =
    firstCoordinateChangeIndexByDriver.get(driverNumber) ?? -1;
  const firstMovingIndex =
    firstCoordinateChangeIndex >= 0
      ? firstCoordinateChangeIndex
      : firstNonZeroIndex;

  if (firstMovingIndex < 0 || firstMovingIndex >= entries.length) {
    continue;
  }

  firstMovingPositionByDriver.set(
    driverNumber,
    projectPointToTrack(normalizeLocationPoint(entries[firstMovingIndex])),
  );
}

/**
 * Resolves race launch point from first moving telemetry samples.
 * Uses centroid of first moving point for each demo driver.
 */
function resolveRaceStartPoint(): DriverPosition {
  const movingPoints: DriverPosition[] = [];

  for (const driverNumber of DEMO_DRIVER_NUMBERS) {
    const entries = locationsByDriverNumber[driverNumber] ?? [];
    const firstNonZeroIndex =
      firstNonZeroLocationIndexByDriver.get(driverNumber) ?? -1;
    const firstMovingIndex =
      firstCoordinateChangeIndexByDriver.get(driverNumber) ?? -1;
    const index = firstMovingIndex >= 0 ? firstMovingIndex : firstNonZeroIndex;

    if (index < 0 || index >= entries.length) {
      continue;
    }

    movingPoints.push(
      projectPointToTrack(normalizeLocationPoint(entries[index])),
    );
  }

  if (!movingPoints.length) {
    return resolveFinishLinePoint();
  }

  const x =
    movingPoints.reduce((sum, point) => sum + point.x, 0) / movingPoints.length;
  const y =
    movingPoints.reduce((sum, point) => sum + point.y, 0) / movingPoints.length;

  return { x, y };
}

/**
 * Resolves finish/start marker from first circuit point in `circuit.json`.
 *
 * @returns Marker position in normalized SVG coordinates.
 * @example
 * resolveFinishLinePoint(); // { x: 13.4, y: 81.2 }
 */
function resolveFinishLinePoint(): DriverPosition {
  const xPoints = circuit.x;
  const yPoints = circuit.y;
  if (xPoints.length === 0 || yPoints.length === 0) {
    return getCircuitPointAtProgress(0);
  }

  const safeIndex = 0;
  return {
    x: normalizeX(xPoints[safeIndex]),
    y: normalizeY(yPoints[safeIndex]),
  };
}
/**
 * Builds demo replay state from China dataset (`circuit.json`, `interval.json`, locations, laps).
 *
 * @param args.enabled - Whether demo dataset should drive UI.
 * @param args.raceClockSeconds - Global UI race clock in seconds.
 * @param args.totalLaps - Configured race lap count.
 * @returns Derived track path, leaderboard, positions, lap marker, and countdown state.
 * @example
 * const demo = useChinaDemoRaceData({ enabled: true, raceClockSeconds: 12, totalLaps: 56 });
 */
export function useChinaDemoRaceData({
  enabled,
  raceClockSeconds,
  totalLaps,
}: UseChinaDemoRaceDataArgs): UseChinaDemoRaceDataResult {
  return useMemo(() => {
    if (
      !enabled ||
      Number.isNaN(intervalStartMs) ||
      Number.isNaN(minTelemetryX) ||
      Number.isNaN(minTelemetryY)
    ) {
      return {
        trackPath: null,
        progressMap: null,
        leaderboard: null,
        driverPositions: null,
        currentLap: null,
        startPoint: null,
        lapEndPoint: null,
        startCountdownValue: null,
        suppressPositionTransition: false,
      };
    }

    const raceRuntimeSeconds = Math.max(
      0,
      raceClockSeconds - DEMO_START_COUNTDOWN_SECONDS,
    );
    const activeIntervalMs = intervalStartMs + raceRuntimeSeconds * 1000;
    const startCountdownValue =
      raceClockSeconds < DEMO_START_COUNTDOWN_SECONDS
        ? DEMO_START_COUNTDOWN_SECONDS - raceClockSeconds
        : null;
    const startPoint = resolveRaceStartPoint();
    const lapEndPoint = resolveFinishLinePoint();
    const commonStartPoint = startPoint;
    const raceStarted = startCountdownValue === null;
    const suppressPositionTransition =
      raceStarted &&
      raceRuntimeSeconds < DEMO_START_TRANSITION_SUPPRESS_SECONDS;
    const trackPath = toTrackPath(circuit.x, circuit.y);

    const progressMap: Record<string, number> = {};
    const baseDriverPositions: Record<string, DriverPosition> = {};
    const leaderboardRows: LeaderboardRow[] = [];

    for (const driverNumber of DEMO_DRIVER_NUMBERS) {
      const driver = driverByNumber.get(driverNumber);
      if (!driver) {
        continue;
      }

      const firstMovingPoint =
        firstMovingPositionByDriver.get(driverNumber) ?? commonStartPoint;

      const locationSeries = locationsByDriverNumber[driverNumber] ?? [];
      const driverActiveMs = activeIntervalMs;
      const locationIndex = raceStarted
        ? findVisibleLocationIndex(locationSeries, driverActiveMs)
        : -1;
      if (
        raceStarted &&
        raceRuntimeSeconds < DEMO_START_TRANSITION_SUPPRESS_SECONDS
      ) {
        progressMap[driver.code] = 0;
        baseDriverPositions[driver.code] = firstMovingPoint;
      } else if (raceStarted && locationIndex >= 0) {
        const firstNonZeroIndex =
          firstNonZeroLocationIndexByDriver.get(driverNumber) ?? 0;
        const firstCoordinateChangeIndex =
          firstCoordinateChangeIndexByDriver.get(driverNumber) ?? -1;
        const effectiveStartIndex =
          firstCoordinateChangeIndex >= 0
            ? firstCoordinateChangeIndex
            : firstNonZeroIndex;

        const effectiveIndex = Math.max(locationIndex, effectiveStartIndex, 0);
        const indexSpan = Math.max(
          1,
          locationSeries.length - 1 - effectiveStartIndex,
        );
        const indexProgress = Math.min(
          1,
          Math.max(0, (effectiveIndex - effectiveStartIndex) / indexSpan),
        );

        // Use index-based progress for launch continuity so cars move out of
        // lapEndPoint smoothly instead of snapping to a projected next-corner point.
        const progress =
          locationIndex < effectiveStartIndex ? 0 : indexProgress;
        const renderIndex =
          locationIndex < effectiveStartIndex
            ? effectiveStartIndex
            : locationIndex;
        progressMap[driver.code] = progress;
        baseDriverPositions[driver.code] = projectPointToTrack(
          normalizeLocationPoint(locationSeries[renderIndex]),
        );
      } else {
        progressMap[driver.code] = 0;
        baseDriverPositions[driver.code] = firstMovingPoint;
      }

      const intervalSeries = intervalEntriesByDriver.get(driverNumber) ?? [];
      const intervalPoint = findLatestEntryAtOrBefore(
        intervalSeries,
        activeIntervalMs,
      );
      const gapToLeaderSeconds = intervalPoint?.gap_to_leader ?? null;
      const intervalSeconds = intervalPoint?.interval;

      leaderboardRows.push({
        ...driver,
        progress: progressMap[driver.code] ?? 0,
        position: 0,
        interval:
          gapToLeaderSeconds === 0
            ? "LEADER"
            : gapToLeaderSeconds === null
              ? "--"
              : `+${(intervalSeconds ?? gapToLeaderSeconds).toFixed(3)}s`,
        gapToLeaderSeconds: gapToLeaderSeconds ?? undefined,
      });
    }

    leaderboardRows.sort((a, b) => {
      const gapA = a.gapToLeaderSeconds ?? Number.POSITIVE_INFINITY;
      const gapB = b.gapToLeaderSeconds ?? Number.POSITIVE_INFINITY;
      return gapA - gapB;
    });

    const rankedRows = leaderboardRows.map((row, index) => ({
      ...row,
      position: index + 1,
      interval:
        startCountdownValue !== null
          ? "STARTING"
          : index === 0
            ? "LEADER"
            : row.interval,
    }));

    const driverPositions: Record<string, DriverPosition> = {};
    for (let index = 0; index < rankedRows.length; index += 1) {
      const row = rankedRows[index];
      const basePoint =
        baseDriverPositions[row.code] ?? getCircuitPointAtProgress(0);
      driverPositions[row.code] = projectPointToTrack(basePoint);
    }

    const safeTotalLaps = Math.max(1, totalLaps);
    const currentLap = raceStarted
      ? (() => {
          const leaderNumber = rankedRows[0]?.number;
          const leaderLapSeries =
            leaderNumber !== undefined
              ? (lapEntriesByDriver.get(leaderNumber) ?? [])
              : [];
          const leaderLapEntry = findLatestLapAtOrBefore(
            leaderLapSeries,
            activeIntervalMs,
          );
          return Math.min(
            safeTotalLaps,
            Math.max(1, leaderLapEntry?.lap_number ?? 1),
          );
        })()
      : 1;

    return {
      trackPath,
      progressMap,
      leaderboard: rankedRows,
      driverPositions,
      currentLap,
      startPoint,
      lapEndPoint,
      startCountdownValue,
      suppressPositionTransition,
    };
  }, [enabled, raceClockSeconds, totalLaps]);
}
