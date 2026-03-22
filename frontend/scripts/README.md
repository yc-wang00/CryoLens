# Frontend Scripts

## Purpose

This directory holds local utility scripts for Ask sandbox development and smoke testing.

## Public API / Entrypoints

- `bootstrap-claude-sandbox.ts`: prepares and snapshots the Vercel sandbox runtime
- `dev-agent-api.ts`: runs the optional local Ask API override on `127.0.0.1:3210`
- `smoke-agent-search.ts`: issues a direct Ask request and records the streamed response

## Minimal Example

```bash
cd frontend
pnpm run dev:ask
```

## How To Test

```bash
cd frontend
vercel dev
```
