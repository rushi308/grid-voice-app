import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type OpenF1Session = {
  session_key?: unknown;
  meeting_key?: unknown;
  session_name?: unknown;
  session_type?: unknown;
  date_start?: unknown;
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function GET() {
  const token = process.env.MQTT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Missing MQTT_TOKEN environment variable." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      "https://api.openf1.org/v1/sessions?year=2026&country_name=Japan",
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Japan session from OpenF1." },
        { status: 502 },
      );
    }

    const sessions = (await response.json()) as OpenF1Session[];
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json(
        { error: "No sessions returned for Japan." },
        { status: 404 },
      );
    }

    const raceLike = sessions
      .filter((session) => {
        const name = asString(session.session_name).toLowerCase();
        const type = asString(session.session_type).toLowerCase();
        return name.includes("race") || type.includes("race");
      })
      .sort((a, b) => {
        const aStart = Date.parse(asString(a.date_start));
        const bStart = Date.parse(asString(b.date_start));
        return bStart - aStart;
      });

    const chosen = raceLike[0] ?? sessions[sessions.length - 1];
    const sessionKey = asNumber(chosen.session_key);
    const meetingKey = asNumber(chosen.meeting_key);

    if (!sessionKey) {
      return NextResponse.json(
        { error: "Could not resolve a valid Japan session_key." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        sessionKey,
        meetingKey,
        sessionName: asString(chosen.session_name),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Unexpected error while resolving Japan session." },
      { status: 500 },
    );
  }
}
