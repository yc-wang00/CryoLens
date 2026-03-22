# Frontend API Contract

Scope: `frontend/api/`

## Purpose

- expose Vercel routes that belong to the linked frontend project
- keep frontend-local Vercel dev behavior aligned with deployed behavior

## Rules

- keep route handlers thin and delegate logic to `frontend/lib/`
- preserve the Ask SSE event contract when changing `/api/agent-search`
