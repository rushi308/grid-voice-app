import { initialPointers, type RaceTrack } from "@/lib/season2026";
import type { CompletedRaceSummary, LeaderboardRow } from "./types";

type GeoFeatureCollection = {
  features?: Array<{
    geometry?: {
      type?: string;
      coordinates?: number[][];
    };
  }>;
};

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
  const raceEnd = new Date(`${date}T23:59:59Z`).getTime();
  return Date.now() > raceEnd ? "completed" : "upcoming";
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
  const season = race.date.slice(0, 4);
  const response = await fetch(`/api/race-results/${season}/${race.round}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Result unavailable");
  }

  return (await response.json()) as CompletedRaceSummary;
}
