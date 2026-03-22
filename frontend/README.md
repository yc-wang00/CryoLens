# Frontend Module

## Purpose

This package contains the Vite React hackathon frontend for CryoSight.

## Public API / Entrypoints

- `src/main.tsx`: app bootstrap
- `src/App.tsx`: top-level layout and page routing state
- `src/data/mock-data.ts`: mocked demo content aligned to the backend schema
- `src/data/cryo-lens.ts`: frontend client for the normalized FastAPI cryoLens dataset with mock fallback
- `src/components/ui/*`: active shadcn-style UI primitives for the app

## UI Layer

- Active UI system: `src/components/ui`
- Path alias: `@/* -> src/*`
- Note: `src/components/ai-elements` contains upstream example code and is currently excluded from the active lint/build path until it is properly adapted to this app's single UI layer.

## Page Structure

- The desktop shell uses a single persistent left rail; mobile falls back to a lightweight top bar plus slide-over nav.
- The Ask page is intentionally minimal: centered composer before first query, single answer thread after a run, and collapsible research trace below the answer.

## Live Data

- The frontend now uses a hybrid live-data model.
- Read-only display pages can fetch cryoLens data directly from Supabase in the browser with a publishable key and RLS-safe read policies.
- The Ask page still depends on the local frontend API proxy at `/api/cryo-lens-dataset`, which forwards to the FastAPI backend endpoint `/api/v1/cryo-lens/dataset` for the backend-owned research shell.
- The Ask sandbox route at `/api/agent-search` remains server-owned and keeps SQL and agent credentials off the browser.
- The Ask page now uses a Vercel Function at `/api/agent-search` to create a sandboxed Claude research run. That function owns the Anthropic API key, the Supabase pooled connection string, and the Vercel Sandbox lifecycle.
- Override with:
  - `VITE_API_BASE_URL`
  - `VITE_AGENT_API_BASE_URL`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- See `frontend/.env.example` for browser-visible envs and `frontend/.env.server.example` for server-only Vercel Function envs.
- If either live source fails, the app falls back gracefully to the remaining live source or the curated mock dataset so the demo still works.

## Agent Search Backend

- Required server env vars:
  - `ANTHROPIC_API_KEY`
  - `SUPABASE_DB_URL`
  - `CLAUDE_AGENT_MODEL`
  - `CLAUDE_AGENT_SANDBOX_SNAPSHOT_ID` optional but recommended after bootstrapping
- Keep those values out of browser env files. Only `VITE_*` values belong in `frontend/.env.local`.
- Vercel Sandbox auth requires `VERCEL_OIDC_TOKEN`, typically provisioned by `vercel env pull`.
- Local full-stack development for the Ask page should use `vercel dev` from `frontend/` so the Vercel Function is available. `pnpm dev` still serves the client UI, but it does not run the sandbox function.
- To prepare a reusable sandbox snapshot, run:

```bash
cd frontend
pnpm sandbox:bootstrap
```

## Minimal Example

```bash
cd frontend
pnpm install
pnpm dev
```

Browser env example:

```bash
cp .env.example .env.local
```

Server env example for Vercel Functions:

```bash
cp .env.server.example .env.server.local
```

## How To Test

```bash
cd frontend
pnpm lint
pnpm build
```
