"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveRaceFeedSocket } from "@/hooks/useLiveRaceFeedSocket";
import { demoLiveEvents } from "@/lib/demoLiveEvents";
import { season2026, type RaceTrack } from "@/lib/season2026";
import { CompletedRaceStage } from "./CompletedRaceStage";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { SeasonRail } from "./SeasonRail";
import { TrackStage } from "./TrackStage";
import { deriveRaceStatus, toRaceMetrics } from "./homeState";
import { useAnimatedProgressMap } from "./hooks/useAnimatedProgressMap";
import { useCompletedRaceSummary } from "./hooks/useCompletedRaceSummary";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { useRaceClock } from "./hooks/useRaceClock";
import { useResolvedTrackPath } from "./hooks/useResolvedTrackPath";

export function HomePageClient() {
  const [selectedRace, setSelectedRace] = useState<RaceTrack>(season2026[0]);
  const [raceStatus, setRaceStatus] = useState<"completed" | "upcoming">(
    "upcoming",
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const { raceClock, resetRaceClock } = useRaceClock();
  const { progressMap, resetProgressMap } = useAnimatedProgressMap();
  const isDemoRound = selectedRace.slug === "demo-live-round";
  const resolvedTrackPath = useResolvedTrackPath(selectedRace);

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
  const { currentLap, trackTemp, airTemp } = toRaceMetrics(
    raceClock,
    selectedRace.laps,
  );

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
            <TrackStage
              selectedRace={selectedRace}
              trackPath={resolvedTrackPath}
              currentLap={currentLap}
              airTemp={airTemp}
              trackTemp={trackTemp}
              progressMap={progressMap}
              leaderboard={leaderboard}
              isDemoRound={isDemoRound}
              liveSocketStatus={liveFeedSocket.status}
              liveSentCount={liveFeedSocket.sentCount}
              liveTotalCount={liveFeedSocket.totalCount}
              liveLastMessage={liveFeedSocket.latestServerMessage}
              liveTranscript={liveFeedSocket.latestTranscript}
              liveAudioUrl={liveFeedSocket.latestAudioUrl}
              liveLastError={liveFeedSocket.lastError}
              showDemoCommentaryPanel={isHydrated && isDemoRound}
            />
            <LeaderboardPanel leaderboard={leaderboard} />
          </section>
        )}
      </main>
    </div>
  );
}
