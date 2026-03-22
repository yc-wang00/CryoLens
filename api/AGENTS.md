# API Route Contract

Scope: `api/`

## Purpose

- expose server-owned HTTP handlers for the frontend
- keep agent secrets and sandbox orchestration off the browser

## Rules

- keep handlers thin and delegate non-route logic to `frontend/lib/` or backend modules
- preserve the Ask SSE event contract when changing `/api/agent-search`
