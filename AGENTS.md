# AGENTS.md

## CryoLens Architecture

CryoLens is a cryobiology knowledge engine with three services:

- **Backend API** (`app/`) — FastAPI serving structured data from PostgreSQL
- **MCP Server** (`engine/`) — Model Context Protocol server exposing cryobiology tools
- **Frontend** (`frontend/`) — React/Vite SPA with research chat and hypothesis display

## Tech Stack

- Python 3.12, FastAPI, SQLAlchemy (async), PostgreSQL
- React 19, Vite, Tailwind CSS v4, Radix UI
- Claude Agent SDK for AI research agent
- FastMCP for MCP server
- Caddy reverse proxy (production)
- Railway (deployment), pnpm (frontend), uv (Python)

## Key Directories

```
app/           → FastAPI backend (routes, services, models, schemas)
engine/        → MCP server (tools, resources, prompts)
frontend/src/  → React frontend (pages, components, data layer)
database/      → SQL schema files (apply in order: schema → protocols → v2 → findings → hypotheses)
corpus/        → PDF downloader for cryobiology papers
```

## Database

Local Postgres database named `cryosight`. Schema files in `database/` should be applied in order.
Alembic migrations in `alembic/` are an alternative setup path.
