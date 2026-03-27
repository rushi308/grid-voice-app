import type { UpcomingRaceTrackStageProps } from "@grid-voice/types";

/**
 * Focused pre-race track stage that renders only the real circuit preview.
 */
export function UpcomingRaceTrackStage({
  selectedRace,
  trackPath,
  upcomingCountdownLabel,
}: UpcomingRaceTrackStageProps) {
  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_15%,#34343E_0%,#15151E_45%,#13131B_100%)] p-5 sm:p-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="font-headline text-xs font-bold uppercase tracking-[0.22em] text-(--signal-mint)">
            Upcoming Race
          </p>
          <h1 className="font-headline text-3xl font-black italic tracking-tight sm:text-4xl">
            {selectedRace.name}
          </h1>
        </div>
      </header>

      <div className="glass-panel relative h-105 rounded-sm border border-[rgb(175_178_195/20%)] p-4 sm:h-130">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <linearGradient id="upcomingTrackGlow" x1="0" y1="0" x2="1" y2="1">
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
            stroke="url(#upcomingTrackGlow)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {upcomingCountdownLabel ? (
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
    </div>
  );
}
