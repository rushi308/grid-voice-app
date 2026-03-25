import type { LeaderboardRow } from "./types";

type LeaderboardPanelProps = {
  leaderboard: LeaderboardRow[];
};

export function LeaderboardPanel({ leaderboard }: LeaderboardPanelProps) {
  return (
    <aside className="bg-(--surface-low) p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-headline text-xl font-black italic tracking-tight">
          Live Leaderboard
        </h2>
        <span className="h-2 w-2 animate-pulse rounded-full bg-(--signal-mint)" />
      </div>

      <div className="space-y-2">
        {leaderboard.map((driver) => (
          <article
            key={driver.code}
            className="rounded-sm bg-(--surface-mid) px-3 py-3"
          >
            <div className="mb-1 flex items-center justify-between">
              <p className="font-headline text-lg font-bold italic tracking-tight">
                {String(driver.position).padStart(2, "0")} {driver.code}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-(--signal-mint)">
                {driver.interval}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-(--text-secondary)">
              <span>{driver.fullName}</span>
              <span style={{ color: driver.color }}>{driver.team}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-sm bg-(--carbon-850) px-4 py-4">
        <p className="mb-2 font-headline text-xs font-bold uppercase tracking-[0.2em] text-(--text-secondary)">
          Data Source Strategy
        </p>
        <p className="text-sm leading-relaxed text-[rgb(228_225_238/84%)]">
          Start with the local 2026 seed set, then hydrate race schedule and
          live positioning from your race API when available.
        </p>
      </div>
    </aside>
  );
}
