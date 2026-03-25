"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LiveRaceFeedEvent } from "@grid-voice/types";

type SocketStatus = "idle" | "connecting" | "open" | "closed" | "error";

type UseLiveRaceFeedSocketOptions = {
  enabled: boolean;
  events: LiveRaceFeedEvent[];
  wsUrl: string | undefined;
  sendIntervalMs?: number;
};

type UseLiveRaceFeedSocketResult = {
  status: SocketStatus;
  sentCount: number;
  totalCount: number;
  latestServerMessage: string | null;
  lastError: string | null;
};

function logSocketDebug(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[live-feed-socket]", ...args);
  }
}

export function useLiveRaceFeedSocket({
  enabled,
  events,
  wsUrl,
  sendIntervalMs = 4000,
}: UseLiveRaceFeedSocketOptions): UseLiveRaceFeedSocketResult {
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [sentCount, setSentCount] = useState(0);
  const [latestServerMessage, setLatestServerMessage] = useState<string | null>(
    null,
  );
  const [lastError, setLastError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<number | null>(null);
  const indexRef = useRef(0);

  const totalCount = events.length;

  const canConnect = useMemo(() => {
    return enabled && typeof wsUrl === "string" && wsUrl.length > 0;
  }, [enabled, wsUrl]);

  useEffect(() => {
    if (!canConnect) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("connecting");
    setSentCount(0);
    setLatestServerMessage(null);
    setLastError(null);
    indexRef.current = 0;

    const socket = new WebSocket(wsUrl as string);
    socketRef.current = socket;

    socket.onopen = () => {
      logSocketDebug("WebSocket connection opened.");
      setStatus("open");

      timerRef.current = window.setInterval(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          return;
        }

        const nextEvent = events[indexRef.current];
        if (!nextEvent) {
          if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return;
        }

        socket.send(
          JSON.stringify({
            action: "SendData",
            payload: nextEvent,
          }),
        );

        indexRef.current += 1;
        setSentCount(indexRef.current);
      }, sendIntervalMs);
    };

    socket.onmessage = (message) => {
      logSocketDebug("Received message from server:", message.data);
      setLatestServerMessage(message.data);
    };

    socket.onerror = () => {
      setStatus("error");
      setLastError("WebSocket error while sending live feed events.");
    };

    socket.onclose = () => {
      setStatus("closed");
    };

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [canConnect, events, sendIntervalMs, wsUrl]);

  return {
    status,
    sentCount,
    totalCount,
    latestServerMessage,
    lastError,
  };
}
