# CryoLens

The world's first structured, AI-queryable knowledge engine for cryopreservation — turning 1,200+ papers into a live database that any researcher or AI agent can query through natural language or the Model Context Protocol (MCP).

Built at the [Defeating Entropy Hackathon](https://www.defeatingentropy.com/), London, March 2026.

## What it does

1. **Mine** — A custom data-mining AI agent extracts structured data from 1,200+ cryobiology papers into a normalized Postgres database (compounds, formulations, viability measurements, protocols, findings).

2. **Structure** — An MCP server exposes 8 tools that let any AI agent (Claude, Cursor, Codex) query the entire field's knowledge in seconds.

3. **Design** — A hypothesis engine synthesizes that evidence to design novel CPA formulations, with every component justified by specific findings traceable to source papers.

## Architecture

```
Frontend (React)  →  FastAPI Backend  →  PostgreSQL (15 tables)
                  →  Claude Agent SDK  →  CryoLens MCP Server
```

- **Database**: 1,210 papers, 6,210 findings, 538 formulations, 72 compounds, 292 experiments
- **MCP Server**: 8 tools via FastMCP SDK, streamable-http transport
- **Agent Chat**: Claude Agent SDK streaming SSE through FastAPI, connected to CryoLens MCP
- **Frontend**: React + TypeScript + Vite + Tailwind v4, custom NeoLab design system

## Connect your AI agent

```json
{
  "mcpServers": {
    "cryolens": {
      "url": "https://mcp.cryolens.io/mcp"
    }
  }
}
```

Works with Claude Desktop, Claude Code, Cursor, Windsurf, Codex, or any MCP-compatible client.

## Local development

**Backend:**

```bash
uv sync
export ANTHROPIC_API_KEY=your-key
uv run uvicorn app.main:app --port 8000
```

**Frontend:**

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend dev server runs on `localhost:5173` and proxies `/api/v1/*` to `localhost:8000`.

**MCP Server (standalone):**

```bash
uv run uvicorn engine.asgi:app --port 8001
```

## Deployment

Three services on Railway:

| Service | Dockerfile | Port |
|---------|-----------|------|
| MCP Server | `Dockerfile.mcp` | 8000 |
| Backend API | `Dockerfile.api` | 8000 |
| Frontend | `Dockerfile.frontend` | 3000 |

Frontend uses Caddy to serve static files and reverse proxy `/api/*` to the backend.

## Tech stack

- **Extraction**: Custom data-mining AI agent (Claude Sonnet, one agent per paper)
- **Database**: PostgreSQL with 15 normalized tables
- **MCP Server**: Python FastMCP SDK, deployed on Railway
- **Backend**: FastAPI + SQLAlchemy async + Claude Agent SDK
- **Frontend**: React, TypeScript, Vite, Tailwind v4
- **Deployment**: Railway (services + Postgres), Caddy reverse proxy

## Team

Built by **Yicheng Wang** and **Kenji Phang**.

## License

MIT
