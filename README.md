# CryoSight

CryoSight is a FastAPI backend for an AI-assisted cryopreservation knowledge base.

The current scaffold focuses on:

- PDF ingestion
- raw text storage and chunking
- pgvector-ready chunk storage
- mocked metadata extraction into the MVP knowledge tables
- curated manual seeding from CPA screening papers
- a Vite React hackathon frontend with mock data
- Alembic-managed schema changes

## Stack

- FastAPI
- SQLAlchemy 2.x
- PostgreSQL + pgvector
- Alembic
- `uv` for local environment management

## Quickstart

```bash
cp .env.example .env
uv sync --extra dev
docker compose up -d db
uv run alembic upgrade head
uv run python -m app.services.curated_seed
uv run uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

Sandboxed Ask-page backend:

```bash
cd frontend
vercel env pull
vercel dev
```

Environment ownership:

- Root `.env` is for the Railway/FastAPI backend.
- `frontend/.env.local` should contain only browser-visible `VITE_*` settings.
- Vercel Function secrets for `api/agent-search.ts` should come from Vercel project envs or a local server-only env file patterned after `frontend/.env.local`.

## Useful Commands

```bash
uv run pytest
uv run ruff check .
uv run alembic revision --autogenerate -m "describe change"
uv run alembic upgrade head
uv run python -m app.services.curated_seed
uv run python -m app.services.knowledge_queries head findings
uv run python -m app.services.knowledge_queries head cpa_structures
uv run python -m app.services.knowledge_queries findings --component formamide --temperature 4
uv run python -m app.services.knowledge_queries rescue-partners formamide --temperature 4
cd frontend && pnpm lint
cd frontend && pnpm build
```

## Notes

- `docs/` is intentionally gitignored and treated as local operator state.
- The ingestion flow currently uses a mocked structured-extraction step. The handoff point for a real LLM extractor is already isolated in `app/services/extraction.py`.
- `app/bootstrap_cpa_seed.json` is the curated MVP bootstrap payload derived from the four CPA screening papers and can be loaded directly into Postgres with `app.services.curated_seed`.
- `app.services.knowledge_queries` provides a thin SQL-backed helper CLI for live prototyping against the seeded database.
- `frontend/` contains the hackathon demo UI built with React/Vite and mock data aligned to the backend schema.
- `api/agent-search.ts` creates a sandboxed Claude Agent SDK run for Ask-page research and streams the result back to the UI over SSE.
