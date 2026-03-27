import type { RaceTrack } from "@grid-voice/types";

type SeasonRailProps = {
  races: RaceTrack[];
  selectedRaceSlug: string;
  onSelectRace: (race: RaceTrack) => void;
};

function isRaceCompleted(date: string): boolean {
  const hasExplicitTime = date.includes("T");
  const startMs = Date.parse(date);

  if (Number.isFinite(startMs)) {
    const raceEndMs = hasExplicitTime
      ? startMs + 4 * 60 * 60 * 1000
      : Date.parse(`${date}T23:59:59Z`);
    return Date.now() > raceEndMs;
  }

  return false;
}

export function SeasonRail({
  races,
  selectedRaceSlug,
  onSelectRace,
}: SeasonRailProps) {
  return (
    <aside className="bg-(--surface-low) px-4 py-5 lg:px-5 lg:py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-sm bg-(--signal-red)" />
        <div>
          <p className="font-headline text-xs font-bold uppercase tracking-[0.2em] text-(--text-secondary)">
            Grid Voice
          </p>
          <p className="font-headline text-lg font-bold italic tracking-tight">
            Race Control
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-headline text-sm font-bold uppercase tracking-[0.22em] text-(--text-secondary)">
          2026 Season
        </h2>
      </div>

      <div className="space-y-2">
        {races.map((race) => {
          const active = race.slug === selectedRaceSlug;
          const completed = isRaceCompleted(race.date);

          return (
            <button
              type="button"
              key={race.slug}
              onClick={() => onSelectRace(race)}
              className={`w-full rounded-sm px-3 py-3 text-left transition ${
                active
                  ? "bg-(--signal-red) text-white"
                  : "bg-[rgb(52_52_62/35%)] hover:bg-[rgb(52_52_62/58%)]"
              }`}
            >
              <p className="font-headline text-[11px] font-bold uppercase tracking-[0.18em]">
                R{race.round} - {race.country}
              </p>
              <p className="font-headline text-sm font-semibold italic leading-tight">
                {race.name}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-widest text-[rgb(228_225_238/72%)]">
                {completed ? "Completed" : race.date}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
