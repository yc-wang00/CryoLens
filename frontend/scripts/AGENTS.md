# Scripts Module

## Purpose

Local development and operational scripts for the frontend package.

## Rules

- Keep scripts executable with local project dependencies only.
- Prefer plain Node/TypeScript scripts over shell-heavy wrappers when the script is part of the product workflow.
- Preserve stable local Ask entrypoints:
  - `pnpm run dev:agent-api`
  - `pnpm run dev:ask`
