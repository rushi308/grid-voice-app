import { NextResponse } from "next/server";

type ErgastResponse = {
  MRData?: {
    RaceTable?: {
      Races?: Array<{
        raceName?: string;
        round?: string;
        Results?: Array<{
          position?: string;
          points?: string;
          status?: string;
          Time?: { time?: string };
          Driver?: {
            code?: string;
            givenName?: string;
            familyName?: string;
          };
          Constructor?: {
            name?: string;
          };
        }>;
      }>;
    };
  };
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ season: string; round: string }> },
) {
  const { season, round } = await context.params;

  if (!/^\d{4}$/.test(season) || !/^\d{1,2}$/.test(round)) {
    return NextResponse.json(
      { error: "Invalid season or round" },
      { status: 400 },
    );
  }

  const upstreamUrl = `https://api.jolpi.ca/ergast/f1/${season}/${round}/results.json`;

  try {
    const response = await fetch(upstreamUrl, {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Upstream unavailable" },
        { status: 502 },
      );
    }

    const data = (await response.json()) as ErgastResponse;
    const race = data.MRData?.RaceTable?.Races?.[0];

    if (!race || !race.Results?.length) {
      return NextResponse.json(
        { error: "No completed result found" },
        { status: 404 },
      );
    }

    const results = race.Results.map((result) => {
      const position = Number(result.position ?? "0");
      const fullName =
        `${result.Driver?.givenName ?? ""} ${result.Driver?.familyName ?? ""}`.trim();
      return {
        position,
        code: result.Driver?.code ?? fullName.slice(0, 3).toUpperCase(),
        fullName,
        team: result.Constructor?.name ?? "Unknown Team",
        points: Number(result.points ?? "0"),
        timeOrStatus: result.Time?.time ?? result.status ?? "Finished",
      };
    });

    const topThree = results.slice(0, 3);

    return NextResponse.json({
      raceName: race.raceName ?? `Round ${round}`,
      round: Number(race.round ?? round),
      topThree,
      results,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch race results" },
      { status: 500 },
    );
  }
}
