"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initialPointers } from "@/lib/season2026";
import type { LeaderboardRow } from "../types";

type DriverPosition = {
  x: number;
  y: number;
};

type MqttAuthPayload = {
  username: string;
  token: string;
};

type JapanSessionPayload = {
  sessionKey: number;
};

type LocationEvent = {
  driver_number?: unknown;
  session_key?: unknown;
  x?: unknown;
  y?: unknown;
  date?: unknown;
};

type IntervalEvent = {
  driver_number?: unknown;
  session_key?: unknown;
  gap_to_leader?: unknown;
  interval?: unknown;
};

type LapEvent = {
  driver_number?: unknown;
  session_key?: unknown;
  lap_number?: unknown;
};

type LiveRaceData = {
  progressMap: Record<string, number> | null;
  leaderboard: LeaderboardRow[] | null;
  driverPositions: Record<string, DriverPosition> | null;
  currentLap: number | null;
  status: "idle" | "loading" | "connecting" | "open" | "error" | "closed";
  messageCount: number;
  lastError: string | null;
};

type UseOpenF1MqttRaceDataArgs = {
  enabled: boolean;
  totalLaps: number;
};

const MQTT_WEBSOCKET_URL = "wss://mqtt.openf1.org:8084/mqtt";
const MQTT_TOPICS = [
  "v1/location",
  "v1/locations",
  "v1/laps",
  "v1/interval",
  "v1/intervals",
] as const;
const VIEWBOX_MIN = 8;
const VIEWBOX_MAX = 92;
const VIEWBOX_SPAN = VIEWBOX_MAX - VIEWBOX_MIN;
const FLUSH_INTERVAL_MS = 120;

const driversByNumber = new Map(
  initialPointers.map((driver) => [driver.number, driver]),
);

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJsonMessage(payload: Uint8Array): unknown[] {
  try {
    const text = new TextDecoder().decode(payload);
    const parsed = JSON.parse(text) as unknown;
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeLocation(
  x: number,
  y: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
): DriverPosition {
  const spanX = Math.max(1, bounds.maxX - bounds.minX);
  const spanY = Math.max(1, bounds.maxY - bounds.minY);
  const uniformSpan = Math.max(spanX, spanY);
  const offsetX = (uniformSpan - spanX) / 2;
  const offsetY = (uniformSpan - spanY) / 2;
  const shiftedX = x - bounds.minX + offsetX;
  const shiftedY = y - bounds.minY + offsetY;

  const mappedX = VIEWBOX_MIN + (shiftedX / uniformSpan) * VIEWBOX_SPAN;
  const mappedY = VIEWBOX_MAX - (shiftedY / uniformSpan) * VIEWBOX_SPAN;

  return {
    x: clamp(mappedX, VIEWBOX_MIN, VIEWBOX_MAX),
    y: clamp(mappedY, VIEWBOX_MIN, VIEWBOX_MAX),
  };
}

export function useOpenF1MqttRaceData({
  enabled,
  totalLaps,
}: UseOpenF1MqttRaceDataArgs): LiveRaceData {
  const [state, setState] = useState<LiveRaceData>({
    progressMap: null,
    leaderboard: null,
    driverPositions: null,
    currentLap: null,
    status: "idle",
    messageCount: 0,
    lastError: null,
  });

  const sessionKeyRef = useRef<number | null>(null);
  const locationByDriverRef = useRef<Map<number, { x: number; y: number }>>(
    new Map(),
  );
  const intervalByDriverRef = useRef<
    Map<number, { gapToLeader: number | null; interval: number | null }>
  >(new Map());
  const lapByDriverRef = useRef<Map<number, { lapNumber: number }>>(new Map());
  const messageCountRef = useRef(0);
  const flushTimerRef = useRef<number | null>(null);
  const boundsRef = useRef<{
    initialized: boolean;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }>({
    initialized: false,
    minX: 0,
    maxX: 1,
    minY: 0,
    maxY: 1,
  });

  const buildSnapshot = useCallback(
    (
      status: LiveRaceData["status"],
      lastError: string | null,
    ): LiveRaceData => {
      const safeTotalLaps = Math.max(1, totalLaps);
      const rows: Array<
        LeaderboardRow & {
          _lap: number;
          _gapToLeader: number | null;
        }
      > = [];
      const progressMap: Record<string, number> = {};
      const positions: Record<string, DriverPosition> = {};

      for (const [driverNumber, driver] of driversByNumber.entries()) {
        const location = locationByDriverRef.current.get(driverNumber);
        const interval = intervalByDriverRef.current.get(driverNumber);
        const lap = lapByDriverRef.current.get(driverNumber);

        if (!location && !interval && !lap) {
          continue;
        }

        const lapNumber = Math.max(1, lap?.lapNumber ?? 1);
        const lapBase = clamp((lapNumber - 1) / safeTotalLaps, 0, 1);
        const progress = lapBase;

        progressMap[driver.code] = progress;

        if (location && boundsRef.current.initialized) {
          positions[driver.code] = normalizeLocation(
            location.x,
            location.y,
            boundsRef.current,
          );
        }

        rows.push({
          ...driver,
          position: 0,
          progress,
          interval: "--",
          gapToLeaderSeconds: interval?.gapToLeader ?? undefined,
          _lap: lapNumber,
          _gapToLeader: interval?.gapToLeader ?? null,
        });
      }

      if (!rows.length) {
        return {
          progressMap: null,
          leaderboard: null,
          driverPositions: null,
          currentLap: null,
          status,
          messageCount: messageCountRef.current,
          lastError,
        };
      }

      rows.sort((a, b) => {
        const gapA = a._gapToLeader;
        const gapB = b._gapToLeader;
        const hasGapA = typeof gapA === "number" && Number.isFinite(gapA);
        const hasGapB = typeof gapB === "number" && Number.isFinite(gapB);

        if (hasGapA && hasGapB) {
          return (gapA as number) - (gapB as number);
        }

        if (hasGapA && !hasGapB) {
          return -1;
        }

        if (!hasGapA && hasGapB) {
          return 1;
        }

        if (b._lap !== a._lap) {
          return b._lap - a._lap;
        }

        return b.progress - a.progress;
      });

      const leaderboard = rows.map((row, index) => {
        const interval = intervalByDriverRef.current.get(row.number);
        const renderedInterval =
          index === 0
            ? "LEADER"
            : typeof interval?.interval === "number"
              ? `+${interval.interval.toFixed(3)}s`
              : typeof interval?.gapToLeader === "number"
                ? `+${interval.gapToLeader.toFixed(3)}s`
                : "--";

        return {
          ...row,
          position: index + 1,
          interval: renderedInterval,
        };
      });

      const leaderLap = Math.max(...rows.map((row) => row._lap));

      return {
        progressMap,
        leaderboard,
        driverPositions: Object.keys(positions).length ? positions : null,
        currentLap: leaderLap,
        status,
        messageCount: messageCountRef.current,
        lastError,
      };
    },
    [totalLaps],
  );

  useEffect(() => {
    if (!enabled) {
      setState({
        progressMap: null,
        leaderboard: null,
        driverPositions: null,
        currentLap: null,
        status: "idle",
        messageCount: 0,
        lastError: null,
      });
      return;
    }

    let isCancelled = false;

    const bootstrap = async () => {
      setState((previous) => ({
        ...previous,
        status: "loading",
        lastError: null,
      }));

      try {
        const [authResponse, sessionResponse] = await Promise.all([
          fetch("/api/openf1/mqtt-auth", { cache: "no-store" }),
          fetch("/api/openf1/japan-session", { cache: "no-store" }),
        ]);

        if (!authResponse.ok) {
          throw new Error("Unable to load MQTT auth credentials.");
        }
        if (!sessionResponse.ok) {
          throw new Error("Unable to resolve Japan session key.");
        }

        const auth = (await authResponse.json()) as MqttAuthPayload;
        const sessionData =
          (await sessionResponse.json()) as JapanSessionPayload;

        if (!auth.username || !auth.token) {
          throw new Error("Invalid MQTT auth payload.");
        }

        if (!sessionData.sessionKey) {
          throw new Error("Invalid Japan session payload.");
        }

        if (isCancelled) {
          return;
        }

        sessionKeyRef.current = sessionData.sessionKey;
        setState((previous) => ({
          ...previous,
          status: "connecting",
        }));

        const mqtt = await import("mqtt");
        if (isCancelled) {
          return;
        }

        const client = mqtt.connect(MQTT_WEBSOCKET_URL, {
          username: auth.username,
          password: auth.token,
          reconnectPeriod: 1500,
          connectTimeout: 10_000,
          keepalive: 30,
          clean: true,
          protocolVersion: 5,
        });

        console.log(client);

        const scheduleFlush = () => {
          if (flushTimerRef.current !== null) {
            return;
          }

          flushTimerRef.current = window.setTimeout(() => {
            flushTimerRef.current = null;
            setState((previous) => {
              const next = buildSnapshot(previous.status, previous.lastError);
              return {
                ...next,
                status: previous.status,
                lastError: previous.lastError,
              };
            });
          }, FLUSH_INTERVAL_MS);
        };

        client.on("connect", () => {
          setState((previous) => ({
            ...previous,
            status: "open",
            lastError: null,
          }));

          for (const topic of MQTT_TOPICS) {
            client.subscribe(topic);
          }
        });

        client.on("message", (topic, payload) => {
          const messages = parseJsonMessage(payload);
          if (!messages.length) {
            return;
          }

          messageCountRef.current += messages.length;

          for (const message of messages) {
            if (!isRecord(message)) {
              continue;
            }

            const candidateSessionKey = asNumber(message.session_key);
            if (
              candidateSessionKey !== null &&
              sessionKeyRef.current !== null &&
              candidateSessionKey !== sessionKeyRef.current
            ) {
              continue;
            }

            if (topic.includes("location")) {
              const data = message as LocationEvent;
              const driverNumber = asNumber(data.driver_number);
              const x = asNumber(data.x);
              const y = asNumber(data.y);

              if (
                driverNumber === null ||
                x === null ||
                y === null ||
                (x === 0 && y === 0)
              ) {
                continue;
              }

              locationByDriverRef.current.set(driverNumber, { x, y });
              if (!boundsRef.current.initialized) {
                boundsRef.current = {
                  initialized: true,
                  minX: x,
                  maxX: x,
                  minY: y,
                  maxY: y,
                };
              } else {
                boundsRef.current.minX = Math.min(boundsRef.current.minX, x);
                boundsRef.current.maxX = Math.max(boundsRef.current.maxX, x);
                boundsRef.current.minY = Math.min(boundsRef.current.minY, y);
                boundsRef.current.maxY = Math.max(boundsRef.current.maxY, y);
              }
              continue;
            }

            if (topic.includes("interval")) {
              const data = message as IntervalEvent;
              const driverNumber = asNumber(data.driver_number);
              if (driverNumber === null) {
                continue;
              }

              intervalByDriverRef.current.set(driverNumber, {
                gapToLeader: asNumber(data.gap_to_leader),
                interval: asNumber(data.interval),
              });
              continue;
            }

            if (topic.includes("laps")) {
              const data = message as LapEvent;
              const driverNumber = asNumber(data.driver_number);
              const lapNumber = asNumber(data.lap_number);
              if (driverNumber === null || lapNumber === null) {
                continue;
              }

              lapByDriverRef.current.set(driverNumber, {
                lapNumber,
              });
            }
          }

          scheduleFlush();
        });

        client.on("error", () => {
          setState((previous) => ({
            ...previous,
            status: "error",
            lastError: "MQTT connection error while streaming OpenF1 data.",
          }));
        });

        client.on("close", () => {
          setState((previous) => ({
            ...previous,
            status: "closed",
          }));
        });

        return () => {
          if (flushTimerRef.current !== null) {
            window.clearTimeout(flushTimerRef.current);
            flushTimerRef.current = null;
          }

          client.end(true);
        };
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to bootstrap OpenF1 MQTT data feed.";

        setState((previous) => ({
          ...previous,
          status: "error",
          lastError: message,
        }));
      }

      return undefined;
    };

    let cleanup: (() => void) | undefined;
    void bootstrap().then((fn) => {
      cleanup = fn;
    });

    return () => {
      isCancelled = true;
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      cleanup?.();
    };
  }, [buildSnapshot, enabled]);

  return state;
}
