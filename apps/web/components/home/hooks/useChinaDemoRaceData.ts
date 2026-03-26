import { useMemo } from "react";
import circuitData from "@/data/china-26/circuit.json";
import intervalData from "@/data/china-26/interval.json";
import lapsData from "@/data/china-26/laps.json";
import driver12Locations from "@/data/china-26/driver-locations/12.json";
import driver16Locations from "@/data/china-26/driver-locations/16.json";
import driver44Locations from "@/data/china-26/driver-locations/44.json";
import driver63Locations from "@/data/china-26/driver-locations/63.json";
import { initialPointers } from "@/lib/season2026";
import type { LeaderboardRow } from "../types";

const DEMO_DRIVER_NUMBERS = [12, 16, 44, 63] as const;
const DEMO_INTERVAL_START_ISO = "2026-03-15T07:04:06.055000+00:00";
const DEMO_LOCATION_START_ISO = "2026-03-15T06:08:59.438000+00:00";

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
  lapEndPoint: DriverPosition | null;
};

const circuit = circuitData as CircuitData;
const intervals = intervalData as IntervalEntry[];
const laps = lapsData as LapEntry[];

const locationsByDriverNumber: Record<number, LocationEntry[]> = {
  12: driver12Locations as LocationEntry[],
  16: driver16Locations as LocationEntry[],
  44: driver44Locations as LocationEntry[],
  63: driver63Locations as LocationEntry[],
};

const driverByNumber = new Map(initialPointers.map((driver) => [driver.number, driver]));
const intervalStartMs = Date.parse(DEMO_INTERVAL_START_ISO);
const locationStartMs = Date.parse(DEMO_LOCATION_START_ISO);

const minCircuitX = Math.min(...circuit.x);
const maxCircuitX = Math.max(...circuit.x);
const minCircuitY = Math.min(...circuit.y);
const maxCircuitY = Math.max(...circuit.y);

function normalizeX(x: number): number {
  if (maxCircuitX === minCircuitX) {
    return 50;
  }
  const scaled = 8 + ((x - minCircuitX) / (maxCircuitX - minCircuitX)) * 84;
  return Math.min(92, Math.max(8, scaled));
}

function normalizeY(y: number): number {
  if (maxCircuitY === minCircuitY) {
    return 50;
  }
  const scaled = 92 - ((y - minCircuitY) / (maxCircuitY - minCircuitY)) * 84;
  return Math.min(92, Math.max(8, scaled));
}

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

  const interpolatedX = circuit.x[startIndex] + (circuit.x[endIndex] - circuit.x[startIndex]) * t;
  const interpolatedY = circuit.y[startIndex] + (circuit.y[endIndex] - circuit.y[startIndex]) * t;

  return {
    x: normalizeX(interpolatedX),
    y: normalizeY(interpolatedY),
  };
}

function getNearestCircuitProgress(location: LocationEntry): number {
  const size = Math.min(circuit.x.length, circuit.y.length);
  if (size <= 1) {
    return 0;
  }

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < size; index += 1) {
    const dx = circuit.x[index] - location.x;
    const dy = circuit.y[index] - location.y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared < closestDistance) {
      closestDistance = distanceSquared;
      closestIndex = index;
    }
  }

  return closestIndex / (size - 1);
}

function parseDateMs(isoDate: string): number {
  return Date.parse(isoDate);
}

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

function findLatestLapAtOrBefore(entries: LapEntry[], targetMs: number): LapEntry | null {
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

function findLatestIndexAtOrBefore(entries: LocationEntry[], targetMs: number): number {
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

function findFirstNonZeroIndex(entries: LocationEntry[]): number {
  for (let index = 0; index < entries.length; index += 1) {
    if (entries[index].x !== 0 || entries[index].y !== 0) {
      return index;
    }
  }
  return -1;
}

function findVisibleLocationIndex(entries: LocationEntry[], targetMs: number): number {
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
      (entry) => entry.driver_number === driverNumber && entry.date_start !== null,
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
  firstNonZeroLocationIndexByDriver.set(driverNumber, findFirstNonZeroIndex(entries));
}

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
  const firstNonZeroIndex = firstNonZeroLocationIndexByDriver.get(driverNumber) ?? -1;
  firstCoordinateChangeIndexByDriver.set(
    driverNumber,
    findFirstCoordinateChangeIndex(entries, firstNonZeroIndex),
  );
}

function findLocationTimelineStartMs(): number {
  let earliest = Number.POSITIVE_INFINITY;
  for (const driverNumber of DEMO_DRIVER_NUMBERS) {
    const entries = locationsByDriverNumber[driverNumber] ?? [];
    const firstNonZeroIndex = firstNonZeroLocationIndexByDriver.get(driverNumber) ?? -1;
    const firstCoordinateChangeIndex =
      firstCoordinateChangeIndexByDriver.get(driverNumber) ?? -1;
    const index =
      firstCoordinateChangeIndex >= 0 ? firstCoordinateChangeIndex : firstNonZeroIndex;
    if (index >= 0) {
      const ts = parseDateMs(entries[index].date);
      if (!Number.isNaN(ts)) {
        earliest = Math.min(earliest, ts);
      }
    }
  }
  return Number.isFinite(earliest) ? earliest : Number.NaN;
}

const locationTimelineStartMs = findLocationTimelineStartMs();

function resolveFinishLinePoint(): DriverPosition {
  const times = circuit.trackPositionTime ?? [];
  const xPoints = circuit.x;
  const yPoints = circuit.y;
  const startSessionTime = circuit.candidateLap?.lapStartSessionTime;

  if (
    typeof startSessionTime !== "number" ||
    times.length === 0 ||
    xPoints.length === 0 ||
    yPoints.length === 0
  ) {
    return getCircuitPointAtProgress(0);
  }

  let closestIndex = 0;
  let closestDelta = Number.POSITIVE_INFINITY;
  for (let index = 0; index < times.length; index += 1) {
    const delta = Math.abs(times[index] - startSessionTime);
    if (delta < closestDelta) {
      closestDelta = delta;
      closestIndex = index;
    }
  }

  const safeIndex = Math.min(closestIndex, xPoints.length - 1, yPoints.length - 1);
  return {
    x: normalizeX(xPoints[safeIndex]),
    y: normalizeY(yPoints[safeIndex]),
  };
}

export function useChinaDemoRaceData({
  enabled,
  raceClockSeconds,
  totalLaps,
}: UseChinaDemoRaceDataArgs): UseChinaDemoRaceDataResult {
  return useMemo(() => {
    if (
      !enabled ||
      Number.isNaN(intervalStartMs) ||
      Number.isNaN(locationStartMs) ||
      Number.isNaN(locationTimelineStartMs)
    ) {
      return {
        trackPath: null,
        progressMap: null,
        leaderboard: null,
        driverPositions: null,
        currentLap: null,
        lapEndPoint: null,
      };
    }

    const activeMs = locationTimelineStartMs + raceClockSeconds * 1000;
    const activeIntervalMs = intervalStartMs + raceClockSeconds * 1000;
    const trackPath = toTrackPath(circuit.x, circuit.y);

    const progressMap: Record<string, number> = {};
    const baseDriverPositions: Record<string, DriverPosition> = {};
    const leaderboardRows: LeaderboardRow[] = [];

    for (const driverNumber of DEMO_DRIVER_NUMBERS) {
      const driver = driverByNumber.get(driverNumber);
      if (!driver) {
        continue;
      }

      const locationSeries = locationsByDriverNumber[driverNumber] ?? [];
      const locationIndex = findVisibleLocationIndex(locationSeries, activeMs);
      if (locationIndex >= 0) {
        const firstNonZeroIndex = firstNonZeroLocationIndexByDriver.get(driverNumber) ?? 0;
        const firstCoordinateChangeIndex =
          firstCoordinateChangeIndexByDriver.get(driverNumber) ?? -1;
        const effectiveStartIndex =
          firstCoordinateChangeIndex >= 0 ? firstCoordinateChangeIndex : firstNonZeroIndex;

        const effectiveIndex = Math.max(locationIndex, effectiveStartIndex, 0);
        const indexSpan = Math.max(1, locationSeries.length - 1 - effectiveStartIndex);
        const indexProgress = Math.min(
          1,
          Math.max(0, (effectiveIndex - effectiveStartIndex) / indexSpan),
        );

        const locationPoint = locationSeries[locationIndex];
        const nearestProgress = getNearestCircuitProgress(locationPoint);
        const progress =
          locationIndex < effectiveStartIndex
            ? 0
            : nearestProgress > indexProgress
              ? nearestProgress
              : indexProgress;
        progressMap[driver.code] = progress;
        baseDriverPositions[driver.code] = getCircuitPointAtProgress(progress);
      } else {
        progressMap[driver.code] = 0;
        baseDriverPositions[driver.code] = getCircuitPointAtProgress(0);
      }

      const intervalSeries = intervalEntriesByDriver.get(driverNumber) ?? [];
      const intervalPoint = findLatestEntryAtOrBefore(intervalSeries, activeIntervalMs);
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
      interval: index === 0 ? "LEADER" : row.interval,
    }));

    const driverPositions: Record<string, DriverPosition> = {};
    for (let index = 0; index < rankedRows.length; index += 1) {
      const row = rankedRows[index];
      const basePoint = baseDriverPositions[row.code] ?? getCircuitPointAtProgress(0);
      driverPositions[row.code] = basePoint;
    }

    const safeTotalLaps = Math.max(1, totalLaps);
    const leaderCode = rankedRows[0]?.code;
    const leaderPointer = initialPointers.find((item) => item.code === leaderCode);
    const leaderLapSeries = leaderPointer
      ? (lapEntriesByDriver.get(leaderPointer.number) ?? [])
      : [];
    const leaderLapEntry = findLatestLapAtOrBefore(leaderLapSeries, activeIntervalMs);
    const currentLap = Math.min(
      safeTotalLaps,
      Math.max(1, leaderLapEntry?.lap_number ?? 1),
    );
    const lapEndPoint = resolveFinishLinePoint();

    return {
      trackPath,
      progressMap,
      leaderboard: rankedRows,
      driverPositions,
      currentLap,
      lapEndPoint,
    };
  }, [enabled, raceClockSeconds, totalLaps]);
}
