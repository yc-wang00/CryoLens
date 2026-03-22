# Frontend Support Library

## Purpose

This directory holds server-support modules that should resolve against `frontend/node_modules` without being treated as Vercel route files.

## Public API / Entrypoints

- `claude-sandbox.ts`: sandbox orchestration for `api/agent-search.ts`
- `agent-search-route.ts`: deployed/shared Ask route handler
- `agent-search-route-local.ts`: local Ask route handler for `node --experimental-strip-types`

## Minimal Example

Imported from the root Vercel function:

```ts
import(pathToFileURL(resolve(process.cwd(), "frontend/lib/claude-sandbox.ts")).href)
```

## How To Test

```bash
cd frontend
pnpm lint
pnpm build
```
