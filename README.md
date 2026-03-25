# Grid Voice App Monorepo

NPM workspace for an AI-powered F1 race commentary platform.

## Workspaces

- `apps/web`: Next.js (TypeScript) frontend for requesting and previewing AI commentary.
- `apps/commentary-service`: WebSocket Lambda API for generating and streaming race commentary.
- `packages/types`: Shared TypeScript types used across app and infra.
- `packages/validation`: Zod schemas and validation helpers.
- `infra/cdk`: AWS CDK (TypeScript) infrastructure package.

## Quick Start

```bash
npm install
npm run dev:web
```

## Useful Commands

```bash
npm run typecheck
npm run build
npm run lint
npm run synth -w @grid-voice/infra-cdk
```
