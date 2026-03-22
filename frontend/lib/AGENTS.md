# Frontend Support Library Contract

Scope: `frontend/lib/`

## Purpose

- hold server-support utilities that belong with the frontend package dependencies
- avoid putting non-route helpers under Vercel `api/` directories

## Rules

- no route handlers here
- keep server-only utilities importable from root `api/` functions
- keep Ask agent behavior behind explicit profiles like `research` and `hypothesis`; do not collapse new agent behaviors into one implicit generic path (`MEM-0010`)
- bias Ask research prompts toward narrow decision support with explicit early stopping instead of broad exhaustive synthesis (`MEM-0011`)
- separate retrieved facts from inference and avoid absolute absence claims unless retrieval is exhaustive (`MEM-0012`)
