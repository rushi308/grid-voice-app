import type { UpcomingRaceInfoPanelProps } from "@grid-voice/types";
import { useCircuitInfoPreview } from "./hooks/useCircuitInfoPreview";

/**
 * Right-side metadata panel for upcoming races, sourced from circuitInfoUrl.
 */
export function UpcomingRaceInfoPanel({
  selectedRace,
}: UpcomingRaceInfoPanelProps) {
  const { summary, loading, error } = useCircuitInfoPreview({
    circuitInfoUrl: selectedRace.circuitInfoUrl,
  });

  return (
    <aside className="bg-(--surface-low) p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-headline text-xl font-black italic tracking-tight">
          Circuit Intel
        </h2>
        <span className="h-2 w-2 rounded-full bg-(--signal-mint)" />
      </div>

      {loading ? (
        <div className="rounded-sm bg-(--surface-mid) px-3 py-3 text-sm text-(--text-secondary)">
          Loading circuit details...
        </div>
      ) : error ? (
        <div className="rounded-sm bg-(--surface-mid) px-3 py-3 text-sm text-(--text-secondary)">
          {error}
        </div>
      ) : summary ? (
        <div className="space-y-2">
          <article className="rounded-sm bg-(--surface-mid) px-3 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-secondary)">
              Circuit
            </p>
            <p className="font-headline text-base font-bold italic">
              {summary.circuitName || selectedRace.name}
            </p>
          </article>

          <article className="rounded-sm bg-(--surface-mid) px-3 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-secondary)">
              Location
            </p>
            <p className="font-headline text-base font-bold italic">
              {summary.location || selectedRace.country}
            </p>
          </article>

          <article className="rounded-sm bg-(--surface-mid) px-3 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-secondary)">
              Track Data
            </p>
            <p className="text-sm text-[rgb(228_225_238/90%)]">
              Corners {summary.corners} | Marshal lights {summary.marshalLights}
            </p>
            <p className="text-sm text-[rgb(228_225_238/90%)]">
              Marshal sectors {summary.marshalSectors}
            </p>
          </article>

          <article className="rounded-sm bg-(--surface-mid) px-3 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-secondary)">
              Race Date
            </p>
            <p className="text-sm text-[rgb(228_225_238/90%)]">
              {summary.raceDate || selectedRace.date}
            </p>
          </article>
        </div>
      ) : (
        <div className="rounded-sm bg-(--surface-mid) px-3 py-3 text-sm text-(--text-secondary)">
          No circuit metadata available.
        </div>
      )}
    </aside>
  );
}
