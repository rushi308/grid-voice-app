import type { RaceTrack } from "@grid-voice/types";
import type { LeaderboardRow } from "./types";

type TrackStageProps = {
  selectedRace: RaceTrack;
  trackPath: string;
  currentLap: number;
  airTemp: number;
  trackTemp: number;
  progressMap: Record<string, number>;
  leaderboard: LeaderboardRow[];
  driverPositions: Record<string, { x: number; y: number }> | null;
  startPoint: { x: number; y: number } | null;
  lapEndPoint: { x: number; y: number } | null;
  isDemoRound: boolean;
  liveSocketStatus: string;
  liveSentCount: number;
  liveTotalCount: number;
  liveLastMessage: string | null;
  liveTranscript: string | null;
  liveAudioUrl: string | null;
  liveLastError: string | null;
  showDemoCommentaryPanel: boolean;
  isHydrated: boolean;
  startCountdownValue: number | null;
  upcomingCountdownLabel: string | null;
  isUpcomingCircuitOnly?: boolean;
  suppressDriverTransition: boolean;
  trackRotationDegrees?: number;
};

/**
 * Renders the main live track visualization, overlays, and live feed status panel.
 */
export function TrackStage({
  selectedRace,
  trackPath,
  currentLap,
  airTemp,
  trackTemp,
  progressMap,
  leaderboard,
  driverPositions,
  startPoint,
  lapEndPoint,
  isDemoRound,
  liveSocketStatus,
  liveSentCount,
  liveTotalCount,
  liveLastMessage,
  liveTranscript,
  liveAudioUrl,
  liveLastError,
  showDemoCommentaryPanel,
  isHydrated,
  startCountdownValue,
  upcomingCountdownLabel,
  isUpcomingCircuitOnly = false,
  suppressDriverTransition,
  trackRotationDegrees = 0,
}: TrackStageProps) {
  const liveStatusText =
    isDemoRound || liveSocketStatus !== "idle"
      ? `Live Feed: ${liveSocketStatus.toUpperCase()} | Events ${liveSentCount}/${liveTotalCount}${liveLastError ? ` | ${liveLastError}` : ""}${liveLastMessage ? ` | Last Ack ${liveLastMessage}` : ""}`
      : "AI Insight: Tire delta suggests an undercut window in approximately 4 laps for P2-P4.";
  const startLabelOnLeft = (startPoint?.x ?? 0) > 74;
  const lapLabelOnLeft = (lapEndPoint?.x ?? 0) > 74;

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_15%,#34343E_0%,#15151E_45%,#13131B_100%)] p-5 sm:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-headline text-xs font-bold uppercase tracking-[0.22em] text-(--signal-mint)">
            {isUpcomingCircuitOnly ? "Upcoming Race" : "Live Track Session"}
          </p>
          <h1 className="font-headline text-3xl font-black italic tracking-tight sm:text-4xl">
            {selectedRace.name}
          </h1>
        </div>
        {isUpcomingCircuitOnly ? (
          <div className="glass-panel rounded-sm px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-(--text-secondary)">
              Round {selectedRace.round}
            </p>
            <p className="font-headline text-lg font-bold italic text-(--signal-mint)">
              {selectedRace.country}
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-sm px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-(--text-secondary)">
              Lap {currentLap} / {selectedRace.laps}
            </p>
            <p className="font-headline text-lg font-bold italic text-(--signal-mint)">
              Track Clear
            </p>
          </div>
        )}
      </header>

      {isUpcomingCircuitOnly ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="glass-panel rounded-sm px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-(--text-secondary)">
              Race Start
            </p>
            <p className="font-headline text-sm font-bold italic text-(--signal-mint)">
              {selectedRace.date}
            </p>
          </div>
          <div className="glass-panel rounded-sm px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-(--text-secondary)">
              Total Laps
            </p>
            <p className="font-headline text-sm font-bold italic text-(--signal-mint)">
              {selectedRace.laps}
            </p>
          </div>
          <div className="glass-panel rounded-sm px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-(--text-secondary)">
              Status
            </p>
            <p className="font-headline text-sm font-bold italic text-(--signal-mint)">
              Circuit Preview
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap gap-3 text-xs uppercase tracking-widest">
          <div className="glass-panel rounded-sm px-3 py-2">
            <span className="text-(--text-secondary)">Air </span>
            <strong>{airTemp}C</strong>
          </div>
          <div className="glass-panel rounded-sm px-3 py-2">
            <span className="text-(--text-secondary)">Track </span>
            <strong>{trackTemp}C</strong>
          </div>
        </div>
      )}

      <div className="glass-panel relative h-105 rounded-sm border border-[rgb(175_178_195/20%)] p-4 sm:h-130">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <linearGradient id="trackGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00E9C7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#E10600" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <g transform={`rotate(${trackRotationDegrees} 50 50)`}>
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
            {startPoint ? (
              <g>
                <circle
                  cx={startPoint.x}
                  cy={startPoint.y}
                  r="1.9"
                  fill="#00E9C7"
                  stroke="#13131B"
                  strokeWidth="0.7"
                />
                <circle
                  cx={startPoint.x}
                  cy={startPoint.y}
                  r="3.1"
                  fill="none"
                  stroke="#00E9C7"
                  strokeOpacity="0.55"
                  strokeWidth="0.6"
                />
                <text
                  x={startPoint.x + (startLabelOnLeft ? -3.8 : 3.8)}
                  y={startPoint.y - 2.6}
                  fill="#00E9C7"
                  fontSize="2.1"
                  fontWeight="700"
                  letterSpacing="0.08em"
                  textAnchor={startLabelOnLeft ? "end" : "start"}
                >
                  START
                </text>
              </g>
            ) : null}

            {lapEndPoint ? (
              <g>
                <line
                  x1={lapEndPoint.x}
                  y1={lapEndPoint.y}
                  x2={lapEndPoint.x}
                  y2={lapEndPoint.y - 5.5}
                  stroke="#F6F7FB"
                  strokeWidth="0.8"
                />
                <path
                  d={`M${lapEndPoint.x},${lapEndPoint.y - 5.5} L${lapEndPoint.x + 3.4},${lapEndPoint.y - 4.4} L${lapEndPoint.x},${lapEndPoint.y - 3.2} Z`}
                  fill="#F6F7FB"
                />
                <text
                  x={lapEndPoint.x + (lapLabelOnLeft ? -4.4 : 4.4)}
                  y={lapEndPoint.y - 5.1}
                  fill="#F6F7FB"
                  fontSize="2.1"
                  fontWeight="700"
                  letterSpacing="0.08em"
                  textAnchor={lapLabelOnLeft ? "end" : "start"}
                >
                  S/F
                </text>
              </g>
            ) : null}

            {leaderboard.map((driver, index) => {
              const staticPosition = driverPositions?.[driver.code];
              if (staticPosition) {
                return (
                  <g
                    key={driver.code}
                    transform={`translate(${staticPosition.x} ${staticPosition.y})`}
                    style={{
                      transition:
                        isDemoRound || suppressDriverTransition
                          ? "none"
                          : "transform 850ms linear",
                    }}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="3.2"
                      fill="#13131B"
                      stroke={driver.color}
                      strokeWidth="1.8"
                    />
                    <text
                      x="4"
                      y="-4"
                      fill={driver.color}
                      fontSize="3.4"
                      fontWeight="700"
                      letterSpacing="0.04em"
                    >
                      {driver.code}
                    </text>
                  </g>
                );
              }

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
                  <text
                    x="4.2"
                    y="-4.2"
                    fill={driver.color}
                    fontSize="3.4"
                    fontWeight="700"
                    letterSpacing="0.04em"
                  >
                    {driver.code}
                  </text>
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
          </g>
        </svg>
        {isDemoRound && startCountdownValue !== null ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-sm border border-[rgb(175_178_195/25%)] bg-[rgb(19_19_27/82%)] px-6 py-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-(--text-secondary)">
                Race Starts In
              </p>
              <p className="font-headline text-5xl font-black italic text-(--signal-mint)">
                {startCountdownValue}
              </p>
            </div>
          </div>
        ) : null}

        {!isDemoRound && upcomingCountdownLabel ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-sm border border-[rgb(175_178_195/25%)] bg-[rgb(19_19_27/82%)] px-6 py-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-(--text-secondary)">
                Session Starts In
              </p>
              <p className="font-headline text-xl font-black italic text-(--signal-mint)">
                {upcomingCountdownLabel}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div
        suppressHydrationWarning
        className="glass-panel mt-6 rounded-sm px-4 py-3 text-sm italic text-[rgb(228_225_238/84%)]"
      >
        {isUpcomingCircuitOnly
          ? "Circuit blueprint loaded from the selected race profile. Live telemetry and race order will appear when the event starts."
          : isHydrated
            ? liveStatusText
            : "AI Insight: Tire delta suggests an undercut window in approximately 4 laps for P2-P4."}
      </div>

      {showDemoCommentaryPanel ? (
        <div className="glass-panel mt-3 rounded-sm px-4 py-3 text-sm text-[rgb(228_225_238/90%)]">
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-(--text-secondary)">
            Live Commentary Transcript
          </p>
          <p className="min-h-6 font-medium italic text-(--signal-mint)">
            {liveTranscript ?? "Waiting for first generated commentary..."}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-(--text-secondary)">
            Audio{" "}
            {liveAudioUrl ? "playing from generated URL" : "not available yet"}
          </p>
          {liveAudioUrl ? (
            <audio className="mt-3 w-full" controls src={liveAudioUrl} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
