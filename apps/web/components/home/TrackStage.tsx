import type { RaceTrack } from "@/lib/season2026";
import type { LeaderboardRow } from "./types";

type TrackStageProps = {
  selectedRace: RaceTrack;
  trackPath: string;
  currentLap: number;
  airTemp: number;
  trackTemp: number;
  progressMap: Record<string, number>;
  leaderboard: LeaderboardRow[];
  isDemoRound: boolean;
  liveSocketStatus: string;
  liveSentCount: number;
  liveTotalCount: number;
  liveLastMessage: string | null;
  liveLastError: string | null;
};

export function TrackStage({
  selectedRace,
  trackPath,
  currentLap,
  airTemp,
  trackTemp,
  progressMap,
  leaderboard,
  isDemoRound,
  liveSocketStatus,
  liveSentCount,
  liveTotalCount,
  liveLastMessage,
  liveLastError,
}: TrackStageProps) {
  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_15%,#34343E_0%,#15151E_45%,#13131B_100%)] p-5 sm:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-headline text-xs font-bold uppercase tracking-[0.22em] text-(--signal-mint)">
            Live Track Session
          </p>
          <h1 className="font-headline text-3xl font-black italic tracking-tight sm:text-4xl">
            {selectedRace.name}
          </h1>
        </div>
        <div className="glass-panel rounded-sm px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-(--text-secondary)">
            Lap {currentLap} / {selectedRace.laps}
          </p>
          <p className="font-headline text-lg font-bold italic text-(--signal-mint)">
            Track Clear
          </p>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-3 text-xs uppercase tracking-widest">
        <div className="glass-panel rounded-sm px-3 py-2">
          <span className="text-(--text-secondary)">Air </span>
          <strong>{airTemp}C</strong>
        </div>
        <div className="glass-panel rounded-sm px-3 py-2">
          <span className="text-(--text-secondary)">Track </span>
          <strong>{trackTemp}C</strong>
        </div>
        <div className="glass-panel rounded-sm px-3 py-2">
          <span className="text-(--text-secondary)">DRS </span>
          <strong>{selectedRace.drsZones} Zones</strong>
        </div>
      </div>

      <div className="glass-panel relative h-105 rounded-sm border border-[rgb(175_178_195/20%)] p-4 sm:h-130">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <linearGradient id="trackGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00E9C7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#E10600" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <path
            d={trackPath}
            fill="none"
            stroke="#525567"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={trackPath}
            fill="none"
            stroke="url(#trackGlow)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {leaderboard.map((driver, index) => {
            const duration = Math.max(20, 60 / (driver.pace * 14));
            const phaseOffset = (progressMap[driver.code] ?? 0) * duration;

            return (
              <g key={driver.code}>
                <circle
                  cx="0"
                  cy="0"
                  r="3.2"
                  fill="#13131B"
                  stroke={driver.color}
                  strokeWidth="1.8"
                />
                <animateMotion
                  path={trackPath}
                  begin={`-${phaseOffset + index * 0.2}s`}
                  dur={`${duration}s`}
                  rotate="auto"
                  repeatCount="indefinite"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="glass-panel mt-6 rounded-sm px-4 py-3 text-sm italic text-[rgb(228_225_238/84%)]">
        {isDemoRound
          ? `Live Demo Socket: ${liveSocketStatus.toUpperCase()} | Sent ${liveSentCount}/${liveTotalCount}${liveLastError ? ` | ${liveLastError}` : ""}${liveLastMessage ? ` | Last Ack ${liveLastMessage}` : ""}`
          : "AI Insight: Tire delta suggests an undercut window in approximately 4 laps for P2-P4."}
      </div>
    </div>
  );
}
