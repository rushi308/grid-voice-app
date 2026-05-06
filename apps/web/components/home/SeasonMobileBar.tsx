"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import logo from "@/assets/logo.png";
import type { RaceTrack } from "@grid-voice/types";
import { isRaceCompleted } from "./SeasonRail";

type SeasonMobileBarProps = {
  races: RaceTrack[];
  selectedRaceSlug: string;
  onSelectRace: (race: RaceTrack) => void;
};

function chipSecondaryLine(race: RaceTrack): string {
  if (race.round === 0) return "Demo";
  const head = race.country.split(/[·,]/)[0]?.trim() ?? race.country;
  return head.length > 18 ? `${head.slice(0, 16)}…` : head;
}

export function SeasonMobileBar({
  races,
  selectedRaceSlug,
  onSelectRace,
}: SeasonMobileBarProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedRaceSlug]);

  return (
    <div className="sticky top-0 z-30 border-b border-(--surface-mid) bg-(--surface-low)/95 backdrop-blur-md">
      <div className="flex items-stretch gap-2 px-3 py-2 sm:px-4">
        <Link
          href="/"
          className="relative h-10 w-10 shrink-0 self-center overflow-hidden rounded-sm ring-1 ring-(--surface-mid) transition hover:ring-(--signal-red)/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--signal-mint)"
          aria-label="Grid Voice — home"
        >
          <Image
            src={logo}
            alt=""
            fill
            className="object-contain object-left"
            sizes="40px"
            priority
          />
        </Link>
        <div className="flex min-h-[44px] min-w-0 flex-1 flex-col justify-center border-l border-(--surface-mid) pl-2">
          <p className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-(--text-secondary)">
            2026 season
          </p>
          <div
            className="mt-1 flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
            aria-label="Choose a round"
          >
            {races.map((race) => {
              const active = race.slug === selectedRaceSlug;
              const completed = isRaceCompleted(race.date);

              return (
                <button
                  ref={(el) => {
                    if (race.slug === selectedRaceSlug) {
                      activeRef.current = el;
                    }
                  }}
                  key={race.slug}
                  type="button"
                  title={`${race.name}${completed ? " — completed" : ""}`}
                  onClick={() => onSelectRace(race)}
                  className={`shrink-0 rounded-md px-2.5 py-1.5 text-left transition ${
                    active
                      ? "bg-(--signal-red) text-white ring-1 ring-black/20"
                      : "bg-[rgb(52_52_62/40%)] text-(--text-primary) hover:bg-[rgb(52_52_62/58%)]"
                  }`}
                >
                  <p className="font-mono text-[10px] font-bold leading-none tracking-wide">
                    R{race.round}
                  </p>
                  <p className="mt-0.5 max-w-[92px] truncate font-headline text-[11px] font-semibold italic leading-tight">
                    {chipSecondaryLine(race)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
