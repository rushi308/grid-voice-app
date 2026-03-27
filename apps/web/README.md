# Grid Voice — web app

Next.js (App Router) front end for **Grid Voice**: **AI voice commentary**—language models for script, TTS for spoken audio, streaming over WebSocket—plus season calendar, circuit visualization, OpenF1-backed live timing, and archived rounds. **Live race-day commentary** during real Grands Prix is **coming soon** (demo round exercises the pipeline today). **Explore** works anytime; timing aligns with the real race when sessions are live.

## Routes

| Path | Description |
| --- | --- |
| `/` | **Landing page** — AI voice commentary (generative text + TTS), telemetry grounding, F1 visuals, logo, **Explore** CTA. |
| `/explore` | **Full app** — 2026 season rail, track stage, leaderboard, live session timing when events run, **AI voice commentary** stream, completed-race summaries. |

Branding asset: `assets/logo.png` (used on the landing hero and in the explore sidebar, with the logo linking back to `/`).

## Stack

**Frontend**

- Next.js 16, React 19, TypeScript
- Tailwind CSS v4 (`app/globals.css` design tokens: carbon surfaces, signal red/mint)
- Fonts: Space Grotesk (headlines), Titillium Web (body) via `next/font`
- Shared types: `@grid-voice/types`
- Live paths: OpenF1 live timing (`useOpenF1MqttRaceData`), WebSocket URL for AI voice commentary (`NEXT_PUBLIC_WEBSOCKET_URL`)

**Backend (monorepo; see `apps/commentary-service` & `infra/cdk`)**

- AWS Serverless: APIs, streaming, and workers for commentary generation
- OpenAI APIs: language models for commentary copy, TTS (or equivalent) for spoken output

## Getting started

From the monorepo root:

```bash
npm install
npm run dev:web
```

Or from this package:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page; use **Explore** or [http://localhost:3000/explore](http://localhost:3000/explore) for the full race UI.

## Credit

Landing footer: **Made with love by Rushi**.
