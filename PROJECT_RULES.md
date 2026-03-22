# Project Rules: CryoSight

This file defines the project-specific technical rules, stack choices, and operating commands.

## Tech Stack

- Framework: FastAPI
- Language: Python 3.11
- Database: PostgreSQL 16 + pgvector
- ORM / Migrations: SQLAlchemy 2.x + Alembic
- Package Manager: `uv`
- Testing: `pytest`
- Linting: `ruff`

## Folder Structure

- `app/`: API, services, configuration, and database layer
- `alembic/`: schema migration environment and revisions
- `tests/`: unit and integration tests
- `docs/`: local operator state only, gitignored
- `tickets/`: tracked filesystem board for feature work
- `prompts/`: reusable planning and build prompts

## Conventions

- Keep route handlers thin; orchestration belongs in services.
- Use Alembic for every schema change.
- Keep pgvector writes behind a service boundary so embedding-provider swaps stay local.
- Prefer JSONB over over-normalizing research data in v1.
- Store raw documents and normalized knowledge records separately.

## Quick Commands

```bash
# Install dependencies
uv sync --extra dev

# Start the API
uv run uvicorn app.main:app --reload

# Run migrations
uv run alembic upgrade head

# Run tests
uv run pytest

# Lint
uv run ruff check .
```

