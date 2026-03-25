import type { RaceTrack } from "@/lib/season2026";
import type { CompletedRaceSummary } from "./types";

type CompletedRaceStageProps = {
  selectedRace: RaceTrack;
  completedSummary: CompletedRaceSummary | null;
  completedSummaryLoading: boolean;
};

export function CompletedRaceStage({
  selectedRace,
  completedSummary,
  completedSummaryLoading,
}: CompletedRaceStageProps) {
  const remainingResults = completedSummary?.results.filter(
    (entry) => entry.position > 3,
  );

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_15%,#34343E_0%,#15151E_45%,#13131B_100%)] p-5 sm:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-headline text-xs font-bold uppercase tracking-[0.22em] text-(--signal-mint)">
            Completed Race
          </p>
          <h1 className="font-headline text-3xl font-black italic tracking-tight sm:text-4xl">
            {selectedRace.name}
          </h1>
        </div>
        <div className="glass-panel rounded-sm px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-(--text-secondary)">
            Final Classification
          </p>
          <p className="font-headline text-lg font-bold italic text-(--signal-mint)">
            Round {selectedRace.round}
          </p>
        </div>
      </header>

      {completedSummaryLoading ? (
        <div className="glass-panel rounded-sm border border-[rgb(175_178_195/20%)] p-5 text-sm text-(--text-secondary)">
          Fetching race results...
        </div>
      ) : completedSummary ? (
        <>
          <section className="glass-panel rounded-sm border border-[rgb(175_178_195/20%)] p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-(--signal-mint)">
              Podium
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {completedSummary.topThree.map((entry) => (
                <article
                  key={entry.code}
                  className="rounded-sm border border-[rgb(175_178_195/20%)] bg-black/25 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-(--signal-red)">
                    P{entry.position}
                  </p>
                  <p className="mt-2 font-headline text-lg font-extrabold italic">
                    {entry.fullName}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-(--text-secondary)">
                    {entry.team}
                  </p>
                  <p className="mt-2 text-sm text-(--text-secondary)">
                    {entry.timeOrStatus}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-(--signal-mint)">
                    {entry.points.toFixed(0)} pts
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="glass-panel mt-6 rounded-sm border border-[rgb(175_178_195/20%)] p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-(--signal-mint)">
              Full Points Finish Order
            </p>
            <div className="space-y-2">
              {remainingResults?.map((entry) => (
                <article
                  key={`${entry.position}-${entry.code}`}
                  className="flex items-center justify-between rounded-sm border border-[rgb(175_178_195/20%)] bg-black/25 px-3 py-3"
                >
                  <div>
                    <p className="font-headline text-base font-bold italic">
                      P{entry.position} {entry.fullName}
                    </p>
                    <p className="text-xs uppercase tracking-[0.16em] text-(--text-secondary)">
                      {entry.team} | {entry.timeOrStatus}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-(--signal-mint)">
                    {entry.points.toFixed(0)} pts
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="glass-panel rounded-sm border border-[rgb(175_178_195/20%)] p-5 text-sm text-(--text-secondary)">
          Race result data is currently unavailable.
        </div>
      )}
    </div>
  );
}
