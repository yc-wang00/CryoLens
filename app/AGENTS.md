# App Module Contract

Scope: `app/`

## Purpose

- keep route handlers thin
- keep database writes in services
- keep schema changes Alembic-first

## Rules

- do not put business logic directly in FastAPI route handlers
- keep persistence code inside `app/services/`
- update `app/README.md` when entrypoints or setup flow changes
- reference `MEM-0001` when touching the ingestion-to-knowledge normalization path
- preserve structured assay context and deterministic `search_text` when touching curated bootstrap knowledge; reference `MEM-0002`
- preserve the query-friendly SQL views when changing knowledge retrieval surfaces; reference `MEM-0003`
