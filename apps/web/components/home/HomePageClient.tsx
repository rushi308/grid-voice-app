"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveRaceFeedSocket } from "@/hooks/useLiveRaceFeedSocket";
import { demoLiveEvents } from "@/lib/demoLiveEvents";
import { season2026 } from "@/lib/season2026";
import type { RaceTrack } from "@grid-voice/types";
import { CompletedRaceStage } from "./CompletedRaceStage";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { SeasonRail } from "./SeasonRail";
import { TrackStage } from "./TrackStage";
import { UpcomingRaceInfoPanel } from "./UpcomingRaceInfoPanel";
import { UpcomingRaceTrackStage } from "./UpcomingRaceTrackStage";
import { deriveRaceStatus, toRaceMetrics } from "./homeState";
import { useAnimatedProgressMap } from "./hooks/useAnimatedProgressMap";
import { useDemoRaceData } from "./hooks/useDemoRaceData";
import { useCompletedRaceSummary } from "./hooks/useCompletedRaceSummary";
import { useEventCountdown } from "./hooks/useEventCountdown";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { useOpenF1MqttRaceData } from "./hooks/useOpenF1MqttRaceData";
import { useRaceClock } from "./hooks/useRaceClock";
import { useResolvedTrackPath } from "./hooks/useResolvedTrackPath";

/**
 * Orchestrates the home race view across completed, simulated demo, and live OpenF1 states.
 */
export function HomePageClient() {
  const [selectedRace, setSelectedRace] = useState<RaceTrack>(season2026[0]);
  const [raceStatus, setRaceStatus] = useState<"completed" | "upcoming">(
    "upcoming",
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const { raceClock, resetRaceClock } = useRaceClock();
  const { progressMap, resetProgressMap } = useAnimatedProgressMap();
  const isDemoRound = selectedRace.slug === "demo-live-round";
  const shouldUseOpenF1Live = !isDemoRound && raceStatus === "upcoming";
  const useHydratedDemoData = isDemoRound && isHydrated;

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setRaceStatus(deriveRaceStatus(selectedRace.date));
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [selectedRace.date]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setIsHydrated(true);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, []);

  const { completedSummary, completedSummaryLoading } = useCompletedRaceSummary(
    selectedRace,
    raceStatus,
  );

  const liveRaceContext = useMemo(
    () => ({
      season: Number(selectedRace.date.slice(0, 4)) || 2026,
      round: selectedRace.round,
      slug: selectedRace.slug,
      name: selectedRace.name,
      country: selectedRace.country,
      date: selectedRace.date,
    }),
    [
      selectedRace.country,
      selectedRace.date,
      selectedRace.name,
      selectedRace.round,
      selectedRace.slug,
    ],
  );

  const liveFeedSocket = useLiveRaceFeedSocket({
    enabled: isDemoRound,
    events: demoLiveEvents,
    race: liveRaceContext,
    wsUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
    sendIntervalMs: 4000,
  });
  const leaderboard = useLeaderboard(progressMap);
  const demoRaceData = useDemoRaceData({
    enabled: isDemoRound,
    raceClockSeconds: raceClock,
    totalLaps: selectedRace.laps,
  });
  const openF1MqttData = useOpenF1MqttRaceData({
    enabled: shouldUseOpenF1Live,
    totalLaps: selectedRace.laps,
    raceDate: selectedRace.date,
    circuitInfoUrl: selectedRace.circuitInfoUrl,
    preferredSessionKey: selectedRace.sessionKey,
  });
  const showUpcomingCircuitOnly =
    shouldUseOpenF1Live && !openF1MqttData.eventStarted;
  const upcomingRaceCountdown = useEventCountdown({
    targetIso: openF1MqttData.countdownTargetIso,
    enabled: shouldUseOpenF1Live && !openF1MqttData.eventStarted,
  });
  const resolvedTrackPath = useResolvedTrackPath(
    selectedRace,
    openF1MqttData.circuitInfoUrl,
  );
  const activeTrackPath = useHydratedDemoData
    ? (demoRaceData.trackPath ?? resolvedTrackPath)
    : resolvedTrackPath;
  const activeProgressMap = useHydratedDemoData
    ? (demoRaceData.progressMap ?? progressMap)
    : shouldUseOpenF1Live
      ? (openF1MqttData.progressMap ?? progressMap)
      : progressMap;
  const activeLeaderboard = useHydratedDemoData
    ? (demoRaceData.leaderboard ?? leaderboard)
    : shouldUseOpenF1Live
      ? (openF1MqttData.leaderboard ?? leaderboard)
      : leaderboard;
  const {
    currentLap: fallbackLap,
    trackTemp,
    airTemp,
  } = toRaceMetrics(raceClock, selectedRace.laps);
  const currentLap = useHydratedDemoData
    ? (demoRaceData.currentLap ?? fallbackLap)
    : shouldUseOpenF1Live
      ? (openF1MqttData.currentLap ?? fallbackLap)
      : fallbackLap;
  const renderedTrackPath = isHydrated ? activeTrackPath : selectedRace.path;
  const renderedProgressMap = showUpcomingCircuitOnly ? {} : activeProgressMap;
  const renderedLeaderboard = showUpcomingCircuitOnly ? [] : activeLeaderboard;

  const selectRace = (race: RaceTrack) => {
    setSelectedRace(race);
    resetRaceClock();
    resetProgressMap();
  };

  return (
    <div className="min-h-screen bg-(--carbon-900) text-(--text-primary)">
      <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[270px_1fr]">
        <SeasonRail
          races={season2026}
          selectedRaceSlug={selectedRace.slug}
          onSelectRace={selectRace}
        />

        {raceStatus === "completed" ? (
          <section className="min-h-screen">
            <CompletedRaceStage
              selectedRace={selectedRace}
              completedSummary={completedSummary}
              completedSummaryLoading={completedSummaryLoading}
            />
          </section>
        ) : (
          <section className="grid min-h-screen grid-cols-1 xl:grid-cols-[1fr_320px]">
            {raceStatus === "upcoming" && !isDemoRound ? (
              <div className="col-span-full border-b border-(--surface-mid) bg-(--surface-low) px-4 py-2.5 text-center text-xs text-(--text-secondary) sm:text-sm">
                <span className="font-semibold text-(--signal-mint)">
                  Coming soon:
                </span>{" "}
                Live race-day AI voice commentary during real sessions. Session timing
                and maps below are live today.
              </div>
            ) : null}
            {showUpcomingCircuitOnly ? (
              <>
                <UpcomingRaceTrackStage
                  selectedRace={selectedRace}
                  trackPath={renderedTrackPath}
                  upcomingCountdownLabel={upcomingRaceCountdown}
                />
                <UpcomingRaceInfoPanel selectedRace={selectedRace} />
              </>
            ) : (
              <>
                <TrackStage
                  selectedRace={selectedRace}
                  trackPath={renderedTrackPath}
                  currentLap={currentLap}
                  airTemp={airTemp}
                  trackTemp={trackTemp}
                  progressMap={renderedProgressMap}
                  leaderboard={renderedLeaderboard}
                  driverPositions={
                    useHydratedDemoData
                      ? demoRaceData.driverPositions
                      : shouldUseOpenF1Live
                        ? openF1MqttData.driverPositions
                        : null
                  }
                  startPoint={
                    useHydratedDemoData ? demoRaceData.startPoint : null
                  }
                  lapEndPoint={
                    useHydratedDemoData ? demoRaceData.lapEndPoint : null
                  }
                  isDemoRound={isDemoRound}
                  liveSocketStatus={
                    shouldUseOpenF1Live
                      ? openF1MqttData.status
                      : liveFeedSocket.status
                  }
                  liveSentCount={
                    shouldUseOpenF1Live
                      ? openF1MqttData.messageCount
                      : liveFeedSocket.sentCount
                  }
                  liveTotalCount={
                    shouldUseOpenF1Live
                      ? openF1MqttData.messageCount
                      : liveFeedSocket.totalCount
                  }
                  liveLastMessage={
                    shouldUseOpenF1Live
                      ? null
                      : liveFeedSocket.latestServerMessage
                  }
                  liveTranscript={
                    shouldUseOpenF1Live ? null : liveFeedSocket.latestTranscript
                  }
                  liveAudioUrl={
                    shouldUseOpenF1Live ? null : liveFeedSocket.latestAudioUrl
                  }
                  liveLastError={
                    shouldUseOpenF1Live
                      ? openF1MqttData.lastError
                      : liveFeedSocket.lastError
                  }
                  isHydrated={isHydrated}
                  showDemoCommentaryPanel={isHydrated && isDemoRound}
                  startCountdownValue={
                    useHydratedDemoData
                      ? (demoRaceData.startCountdownValue ?? null)
                      : null
                  }
                  upcomingCountdownLabel={null}
                  isUpcomingCircuitOnly={false}
                  suppressDriverTransition={
                    useHydratedDemoData
                      ? demoRaceData.suppressPositionTransition
                      : false
                  }
                  trackRotationDegrees={isDemoRound ? 120 : 0}
                />
                <LeaderboardPanel leaderboard={activeLeaderboard} />
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
