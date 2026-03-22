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
- The Ask page now uses a Vercel Function at `/api/agent-search` to create a sandboxed Claude research run. That function owns the Anthropic API key, the remote MCP URL, and the Vercel Sandbox lifecycle.
- For local Ask development, use the dedicated local agent API server instead of relying on `vercel dev` routing. The UI can call `VITE_AGENT_API_BASE_URL=http://127.0.0.1:3210` while the local server reuses the same sandbox orchestration code as the deployed route.
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
  - `CRYOSIGHT_RESEARCH_MCP_URL`
  - `CRYOSIGHT_RESEARCH_MCP_NAME` optional; defaults to `cryosight-knowledge`
  - `CLAUDE_AGENT_MODEL`
  - `CLAUDE_AGENT_SANDBOX_SNAPSHOT_ID` optional but recommended after bootstrapping
  - `VERCEL_OIDC_TOKEN`
- Keep those values out of browser env files. Only `VITE_*` values belong in `frontend/.env.local`.
- Vercel Sandbox auth requires `VERCEL_OIDC_TOKEN`, typically provisioned by `vercel env pull`.
- Local Ask development should use `pnpm run dev:ask`, which starts both the Vite UI and the standalone local Ask API server. `vercel dev` is still useful to emulate deployed routing, but it is not the primary local Ask workflow.
- To prepare a reusable sandbox snapshot, run:

```bash
cd frontend
pnpm sandbox:bootstrap
```

## Agent Skills

- Lightweight Claude SDK skills can live in `frontend/agent-skills/`.
- The first starter skill is [`public-bio-research`](/home/kenjipcx/CryoSight/frontend/agent-skills/public-bio-research/SKILL.md), which is designed for public, no-key research against sources like PubChem, ChEMBL, AlphaFold DB, and ZINC before any heavy compute workflow is introduced.
- Keep heavy chemistry and simulation work in separate skills later instead of expanding the lightweight research skill into a giant runtime contract.

## Minimal Example

```bash
cd frontend
pnpm install
pnpm run dev:ask
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
