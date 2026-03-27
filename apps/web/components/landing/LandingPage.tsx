import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";

const aiPills = [
  "Generative commentary",
  "Session-aware context",
  "Transcript + speech synthesis",
];

type LandingFeature = {
  title: string;
  description: string;
  highlight?: boolean;
};

const features: LandingFeature[] = [
  {
    title: "AI voice commentary",
    description:
      "Commentary over WebSockets: language models draft lines from laps, gaps, and timing; text-to-speech turns them into audio when enabled—streamed from an AWS Serverless pipeline the explore view consumes end to end. Live race-day voice commentary during real sessions is coming soon; try the flow on the demo round today.",
    highlight: true,
  },
  {
    title: "Grounded in real telemetry",
    description:
      "When the lights go out, live session timing and feeds keep the circuit, standings, and AI narration aligned with the real race—not generic filler.",
  },
  {
    title: "2026 season rail",
    description:
      "Browse the calendar, pick a round, and jump between completed Grands Prix and upcoming sessions while commentary hooks follow the selection.",
  },
  {
    title: "Circuit map & live progress",
    description:
      "SVG layouts with animated progress and tire reads so both you and the model share the same spatial picture of the race.",
  },
  {
    title: "Leaderboard & conditions",
    description:
      "Standings plus air and track context the narration layer can reference for strategy and atmosphere.",
  },
  {
    title: "Completed race summaries",
    description:
      "Archive-friendly panels when the chequered flag has fallen, while the commentary service can still summarize the story of the day.",
  },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-(--carbon-900) text-(--text-primary)">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(225,6,0,0.18),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[28%] h-[min(55vh,480px)] w-[min(90vw,720px)] -translate-x-1/2 opacity-[0.09]"
      >
        <div
          className="h-full w-full rounded-[50%] blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgb(0 233 199 / 0.5), transparent 52%), radial-gradient(circle at 70% 55%, rgb(225 6 0 / 0.45), transparent 48%)",
          }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/4 h-[420px] w-[520px] rotate-12 opacity-[0.07]"
        style={{
          background:
            "repeating-linear-gradient(-45deg, #fff 0 14px, transparent 14px 28px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 bottom-0 h-64 w-64 rounded-br-3xl opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #e4e1ee 25%, transparent 25%), linear-gradient(-45deg, #e4e1ee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e4e1ee 75%), linear-gradient(-45deg, transparent 75%, #e4e1ee 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--surface-high) 1px, transparent 1px), linear-gradient(90deg, var(--surface-high) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-5 pb-16 pt-10 sm:px-8 sm:pt-14 md:px-10">
        <header className="flex flex-col items-center text-center">
          <div className="relative mb-8 rounded-2xl border border-(--surface-mid) bg-(--surface-low) p-6 shadow-[0_0_60px_-12px_rgba(225,6,0,0.35)] sm:p-8">
            <div
              aria-hidden
              className="absolute inset-x-8 top-0 h-1 rounded-full bg-linear-to-r from-transparent via-(--signal-red) to-transparent opacity-90"
            />
            <Image
              src={logo}
              alt="Grid Voice — AI voice commentary for Formula 1"
              priority
              className="mx-auto h-auto w-[min(200px,62vw)] drop-shadow-[0_12px_32px_rgba(0,0,0,0.45)] sm:w-[220px]"
            />
          </div>

          <p className="mb-2 font-mono text-xs tracking-[0.35em] text-(--signal-mint) uppercase">
            AI voice commentary
          </p>
          <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Grid <span className="text-(--signal-red)">Voice</span>
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-(--text-secondary) sm:text-xl">
            A carbon-dark F1 cockpit for the calendar: live maps, real-time session
            timing,{" "}
            <strong className="font-semibold text-(--text-primary)">
              AI voice commentary
            </strong>{" "}
            you can hear and read as you watch, plus archived rounds—all in one Next.js
            front end.{" "}
            <strong className="font-semibold text-(--text-primary)">
              Commentary text comes from language models
            </strong>
            ; spoken output uses{" "}
            <strong className="font-semibold text-(--text-primary)">
              text-to-speech
            </strong>
            —both driven by the same timing as the UI so lines stay faithful to the
            track.
          </p>

          <ul
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
            aria-label="AI product highlights"
          >
            {aiPills.map((label) => (
              <li
                key={label}
                className="rounded-full border border-(--surface-mid) bg-[color-mix(in_oklab,var(--carbon-850)_75%,transparent)] px-3 py-1.5 font-mono text-[10px] font-medium tracking-wide text-(--signal-mint) uppercase sm:text-[11px]"
              >
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/explore"
              className="inline-flex min-h-12 min-w-[200px] items-center justify-center rounded-full bg-(--signal-red) px-8 text-sm font-semibold tracking-wide text-white uppercase shadow-[0_0_0_1px_rgba(0,0,0,0.2)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--signal-mint)"
            >
              Explore
            </Link>
            <p className="max-w-xs text-center text-sm text-(--text-secondary) sm:text-left">
              Jump straight into the app—calendar, circuit, leaderboard, and{" "}
              <span className="text-(--text-primary)/90">AI voice commentary</span>
              —no need to wait for lights out to explore how it behaves.
            </p>
          </div>

          <p
            className="mt-8 max-w-xl rounded-xl border border-(--signal-mint)/30 bg-[color-mix(in_oklab,var(--signal-mint)_12%,transparent)] px-4 py-3 text-center text-sm text-(--text-secondary)"
            role="status"
          >
            <span className="font-semibold text-(--signal-mint)">
              Coming soon
            </span>
            : live AI voice commentary on race day (real sessions). Explore still
            works now—maps, timing, and the commentary pipeline on the demo round—no
            need to wait for lights out.
          </p>
        </header>

        <section
          aria-labelledby="stack-heading"
          className="mt-20 border-t border-(--surface-mid) pt-16"
        >
          <h2
            id="stack-heading"
            className="font-headline text-center text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Built around AI voice commentary
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-(--text-secondary)">
            Explore wires timing and UI state to a commentary service so generated lines
            and audio stay in lockstep with the race—not after it.
          </p>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:gap-6">
            {features.map((item) => (
              <li
                key={item.title}
                className={`group relative overflow-hidden rounded-2xl border bg-(--surface-low) p-6 transition ${
                  item.highlight
                    ? "border-(--signal-red)/50 ring-1 ring-(--signal-red)/25"
                    : "border-(--surface-mid) hover:border-(--signal-red)/45"
                }`}
              >
                <div
                  aria-hidden
                  className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-(--signal-red) opacity-[0.06] blur-2xl transition group-hover:opacity-[0.12]"
                />
                {item.highlight ? (
                  <p className="mb-2 font-mono text-[10px] font-bold tracking-[0.2em] text-(--signal-mint) uppercase">
                    Core · Commentary pipeline
                  </p>
                ) : null}
                <h3 className="font-headline text-lg font-semibold text-(--text-primary)">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-2xl border border-dashed border-(--surface-high) bg-[color-mix(in_oklab,var(--carbon-850)_92%,transparent)] p-6 text-center text-sm text-(--text-secondary)">
            <p className="font-mono text-xs tracking-wider text-(--text-primary)/80 uppercase">
              AI + app stack
            </p>
            <p className="mt-2">
              <span className="font-medium text-(--text-primary)/90">
                Backend:
              </span>{" "}
              AWS Serverless (APIs, streaming, event-driven workers) ·{" "}
              <span className="text-(--text-primary)/85">OpenAI</span> APIs (language
              models for commentary, speech synthesis for audio) · WebSocket commentary
              service
            </p>
            <p className="mt-3">
              <span className="font-medium text-(--text-primary)/90">
                Frontend:
              </span>{" "}
              Next.js App Router · React 19 · Tailwind CSS v4 · TypeScript · OpenF1
              live timing
            </p>
          </div>
        </section>

        <footer className="mt-auto pt-20 text-center">
          <p className="text-sm text-(--text-secondary)">
            <span className="text-(--signal-red)">♥</span> Made with love by{" "}
            <span className="font-semibold text-(--text-primary)">Rushi</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
