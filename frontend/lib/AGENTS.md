# Frontend Support Library Contract

Scope: `frontend/lib/`

## Purpose

- hold server-support utilities that belong with the frontend package dependencies
- avoid putting non-route helpers under Vercel `api/` directories

## Rules

- no route handlers here
- keep server-only utilities importable from root `api/` functions
- keep Ask agent behavior behind explicit profiles like `research` and `hypothesis`; do not collapse new agent behaviors into one implicit generic path (`MEM-0010`)
