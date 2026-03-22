---
name: cryo-sql-research
description: Use when answering CryoSight Ask-page research prompts against the live cryoLens Supabase database. Inspect schema first, keep SQL read-only, aggregate before dumping rows, and cite exact tables, filters, and row counts.
---

# CryoSight SQL Research

Use this skill for CryoSight search prompts that need live evidence from the cryoLens Supabase database.

## Workflow

1. Start with `list_tables` to identify the relevant dataset surface.
2. Use `describe_table` before writing joins or filters against an unfamiliar table.
3. Query with `run_sql` using `SELECT`, `WITH`, or `EXPLAIN` only.
4. Keep result sets compact:
   - prefer aggregates, grouped counts, and ranked top rows
   - avoid `SELECT *` unless you are inspecting shape
   - add explicit filters and `LIMIT` clauses
5. When the user asks a comparative question, gather evidence from more than one table if needed.

## Output Rules

- Cite the table names you used.
- Mention the key filters, joins, or grouping logic.
- Include row counts or aggregate totals where they materially support the claim.
- Call out uncertainty or missing data instead of inferring beyond the query results.
- Suggest a next query when the first pass is incomplete.

## Guardrails

- Never attempt writes, DDL, or destructive SQL.
- Never expose connection strings, secrets, or internal credentials.
- Treat the SQL surface as read-only research instrumentation.
