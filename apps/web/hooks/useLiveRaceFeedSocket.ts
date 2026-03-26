"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LiveRaceFeedEvent, WsRaceContext } from "@grid-voice/types";

type SocketStatus = "idle" | "connecting" | "open" | "closed" | "error";

type UseLiveRaceFeedSocketOptions = {
  enabled: boolean;
  events: LiveRaceFeedEvent[];
  race?: WsRaceContext;
  wsUrl: string | undefined;
  sendIntervalMs?: number;
};

type UseLiveRaceFeedSocketResult = {
  status: SocketStatus;
  sentCount: number;
  totalCount: number;
  latestServerMessage: string | null;
  latestTranscript: string | null;
  latestAudioUrl: string | null;
  lastError: string | null;
};

type CommentaryPayload = {
  message?: unknown;
  audioUrl?: unknown;
};

type ServerEnvelope = {
  type?: unknown;
  payload?: unknown;
};

function logSocketDebug(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[live-feed-socket]", ...args);
  }
}

export function useLiveRaceFeedSocket({
  enabled,
  events,
  race,
  wsUrl,
  sendIntervalMs = 4000,
}: UseLiveRaceFeedSocketOptions): UseLiveRaceFeedSocketResult {
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [sentCount, setSentCount] = useState(0);
  const [latestServerMessage, setLatestServerMessage] = useState<string | null>(
    null,
  );
  const [latestTranscript, setLatestTranscript] = useState<string | null>(null);
  const [latestAudioUrl, setLatestAudioUrl] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const nextSendTimerRef = useRef<number | null>(null);
  const awaitingServerRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isAudioPlayingRef = useRef(false);
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
    setLatestTranscript(null);
    setLatestAudioUrl(null);
    setLastError(null);
    indexRef.current = 0;
    awaitingServerRef.current = false;
    audioQueueRef.current = [];
    isAudioPlayingRef.current = false;

    const socket = new WebSocket(wsUrl as string);
    socketRef.current = socket;

    const ensureAudioElement = (): HTMLAudioElement => {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = "auto";
      }

      return audioRef.current;
    };

    const playNextQueuedAudio = async () => {
      if (isAudioPlayingRef.current) {
        return;
      }

      const nextUrl = audioQueueRef.current.shift();
      if (!nextUrl) {
        return;
      }

      const audio = ensureAudioElement();
      isAudioPlayingRef.current = true;
      setLatestAudioUrl(nextUrl);

      try {
        audio.src = nextUrl;
        await audio.play();
      } catch {
        isAudioPlayingRef.current = false;
        setLastError(
          "Audio autoplay was blocked by the browser. Tap the page, then it will play.",
        );
      }
    };

    const queueCommentaryAudio = (audioUrl: string) => {
      audioQueueRef.current.push(audioUrl);
      void playNextQueuedAudio();
    };

    const audio = ensureAudioElement();
    audio.onended = () => {
      isAudioPlayingRef.current = false;
      void playNextQueuedAudio();
    };
    audio.onerror = () => {
      isAudioPlayingRef.current = false;
      setLastError("Could not play generated commentary audio.");
      void playNextQueuedAudio();
    };

    const sendNextEvent = () => {
      if (socket.readyState !== WebSocket.OPEN || awaitingServerRef.current) {
        return;
      }

      const nextEvent = events[indexRef.current];
      if (!nextEvent) {
        return;
      }

      socket.send(
        JSON.stringify({
          action: "SendData",
          payload: nextEvent,
          race,
        }),
      );

      awaitingServerRef.current = true;
      indexRef.current += 1;
      setSentCount(indexRef.current);
    };

    const queueNextEvent = () => {
      if (nextSendTimerRef.current !== null) {
        window.clearTimeout(nextSendTimerRef.current);
      }

      nextSendTimerRef.current = window.setTimeout(() => {
        sendNextEvent();
      }, sendIntervalMs);
    };

    socket.onopen = () => {
      logSocketDebug("WebSocket connection opened.");
      setStatus("open");
      sendNextEvent();
    };

    socket.onmessage = (message) => {
      logSocketDebug("Received message from server:", message.data);
      const rawData =
        typeof message.data === "string"
          ? message.data
          : JSON.stringify(message.data);
      setLatestServerMessage(rawData);

      let envelope: ServerEnvelope | null = null;
      try {
        envelope = JSON.parse(rawData) as ServerEnvelope;
      } catch {
        envelope = null;
      }

      if (envelope?.type === "commentary.generated") {
        const payload = envelope.payload;
        const commentary = extractCommentaryPayload(payload);

        if (commentary.message) {
          setLatestTranscript(commentary.message);
        }

        if (commentary.audioUrl) {
          queueCommentaryAudio(commentary.audioUrl);
        }

        awaitingServerRef.current = false;
        queueNextEvent();
        return;
      }

      if (
        envelope?.type === "live.event.error" ||
        envelope?.type === "commentary.error"
      ) {
        const errorMessage = extractErrorMessage(envelope.payload);
        if (errorMessage) {
          setLastError(errorMessage);
        }
        awaitingServerRef.current = false;
        queueNextEvent();
      }
    };

    socket.onerror = () => {
      setStatus("error");
      setLastError("WebSocket error while sending live feed events.");
    };

    socket.onclose = () => {
      setStatus("closed");
      awaitingServerRef.current = false;
    };

    return () => {
      if (nextSendTimerRef.current !== null) {
        window.clearTimeout(nextSendTimerRef.current);
        nextSendTimerRef.current = null;
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }

      audioQueueRef.current = [];
      isAudioPlayingRef.current = false;
    };
  }, [canConnect, events, race, sendIntervalMs, wsUrl]);

  return {
    status,
    sentCount,
    totalCount,
    latestServerMessage,
    latestTranscript,
    latestAudioUrl,
    lastError,
  };
}

function extractCommentaryPayload(payload: unknown): {
  message: string | null;
  audioUrl: string | null;
} {
  const direct = toCommentaryPayload(payload);
  if (
    direct &&
    (typeof direct.message === "string" || typeof direct.audioUrl === "string")
  ) {
    return {
      message: typeof direct.message === "string" ? direct.message : null,
      audioUrl: typeof direct.audioUrl === "string" ? direct.audioUrl : null,
    };
  }

  if (payload && typeof payload === "object") {
    const nested = (payload as { commentary?: unknown }).commentary;
    const nestedCommentary = toCommentaryPayload(nested);
    if (nestedCommentary) {
      return {
        message:
          typeof nestedCommentary.message === "string"
            ? nestedCommentary.message
            : null,
        audioUrl:
          typeof nestedCommentary.audioUrl === "string"
            ? nestedCommentary.audioUrl
            : null,
      };
    }
  }

  return {
    message: null,
    audioUrl: null,
  };
}

function toCommentaryPayload(value: unknown): CommentaryPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as CommentaryPayload;
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = (payload as { message?: unknown }).message;
  return typeof candidate === "string" ? candidate : null;
}
