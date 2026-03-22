# API Routes

## Purpose

This directory holds the root server routes used by local `vercel dev` and deployment.

## Public API / Entrypoints

- `agent-search.ts`: sandboxed Ask SSE endpoint

## Minimal Example

```bash
curl -N -X POST http://localhost:3000/api/agent-search \
  -H 'content-type: application/json' \
  -d '{"prompt":"Use the MCP server to answer briefly.","profile":"research"}'
```

## How To Test

```bash
cd frontend
pnpm build
```
