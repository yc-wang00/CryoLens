# Root API Module Contract

Scope: `api/`

## Purpose

- own the Vercel function entrypoints for local and deployed app usage
- keep browser-facing server logic at the repo root so `vercel dev` has one canonical API surface

## Rules

- keep route handlers thin and put heavy sandbox/runtime logic in non-route support modules
- do not maintain duplicate route files under `frontend/api/`
