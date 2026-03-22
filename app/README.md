# App Module

## Purpose

This package contains the FastAPI application, database layer, and ingestion services for the CryoSight backend.

## Public API / Entrypoints

- `app.main:app`: FastAPI ASGI application
- `app.api.routes.health`: health endpoints
- `app.api.routes.ingestion`: PDF ingestion endpoint
- `app.api.routes.cryo_lens`: normalized live cryoLens dataset endpoint
- `app.services.curated_seed`: curated paper bootstrap loader for Postgres
- `app.services.knowledge_queries`: SQL-backed query helper for live prototyping
- `app.services.cryo_lens`: Supabase-backed adapter that normalizes cryoLens tables for the frontend

## Minimal Example

```bash
uv run uvicorn app.main:app --reload
uv run python -m app.services.curated_seed
uv run python -m app.services.knowledge_queries head findings
curl http://127.0.0.1:8000/api/v1/cryo-lens/dataset
```

## How To Test

```bash
uv run pytest
uv run ruff check .
```

## Live cryoLens integration

- Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`.
- Localhost frontend origins are accepted via regex in FastAPI CORS, so `localhost` or `127.0.0.1` on any dev port should work after restart.
- The frontend should call the backend dataset endpoint instead of calling Supabase directly.
- The backend normalizes raw `cryoLens` tables into the stable payload defined in `app/schemas/cryo_lens.py`.
