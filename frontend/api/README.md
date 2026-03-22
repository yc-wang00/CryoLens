# Frontend API Routes

## Purpose

This directory holds Vercel routes for the linked frontend project and deployed Ask endpoint.

## Public API / Entrypoints

- `agent-search.ts`: sandboxed Ask SSE endpoint

## Minimal Example

```bash
curl -N -X POST http://127.0.0.1:3000/api/agent-search \
  -H 'content-type: application/json' \
  -d '{"prompt":"Use the MCP server to answer briefly.","profile":"research"}'
```

## How To Test

```bash
cd frontend
vercel dev
```
