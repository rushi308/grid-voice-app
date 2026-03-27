import { useEffect, useMemo, useState } from "react";

type UseEventCountdownArgs = {
  targetIso: string | null;
  enabled: boolean;
};

/**
 * Creates a live countdown label (DDd HHh MMm SSs) to a target UTC timestamp.
 */
export function useEventCountdown({
  targetIso,
  enabled,
}: UseEventCountdownArgs): string | null {
  const [now, setNow] = useState(() => Date.now());

  const targetMs = useMemo(() => {
    if (!enabled || !targetIso) {
      return null;
    }

    const parsed = Date.parse(targetIso);
    return Number.isFinite(parsed) ? parsed : null;
  }, [enabled, targetIso]);

  useEffect(() => {
    if (targetMs === null) {
      return;
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [targetMs]);

  const label = useMemo(() => {
    if (targetMs === null) {
      return null;
    }

    const deltaMs = Math.max(0, targetMs - now);
    if (deltaMs <= 0) {
      return "Starting now";
    }

    const totalSeconds = Math.floor(deltaMs / 1000);
    const days = Math.floor(totalSeconds / 86_400);
    const hours = Math.floor((totalSeconds % 86_400) / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }, [now, targetMs]);

  return label;
}
