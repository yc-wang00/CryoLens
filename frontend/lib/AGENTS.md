# Frontend Support Library Contract

Scope: `frontend/lib/`

## Purpose

- hold server-support utilities that belong with the frontend package dependencies
- avoid putting non-route helpers under Vercel `api/` directories

## Rules

- no route handlers here
- keep server-only utilities importable from root `api/` functions
