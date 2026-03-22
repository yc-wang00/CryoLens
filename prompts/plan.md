# Implementation Plan Prompt (General)

Copy and paste this into a new session to start a coding implementation planning pass.

---

0a. Study `@docs/prd.md` to understand audience, outcomes, and constraints.
0b. Study `@docs/specs/*` to learn the application specifications.
0c. Study the active ticket in `@tickets/review/*` first; if none exists, inspect `@tickets/todo/*`.
0d. Study `@docs/MEMORY.md` for durable technical constraints.
0e. Study `@docs/TROUBLES.md` for repeated failure patterns that should be avoided in this slice.
0f. If UI or UX is in scope, study `@docs/TASTE.md` for shared visual doctrine.
0g. Search the codebase before assuming anything is missing.
0h. Confirm affected interfaces and nearest module `README.md` + `AGENTS.md` before proposing changes.

1. Planning mode only: produce mini-PRD context + technical implementation plan for the next smallest executable slice.
2. Include a High-Level Change Preview:
   - architecture delta (ASCII or mermaid),
   - stubbed interface/pseudocode snippets for critical touchpoints,
   - before -> after behavior bullets.
3. Include touched files/interfaces, dependency order, validation strategy, and rollback notes if needed.
4. Add user stories and concrete acceptance tests with explicit observable behavior.
5. Convert to execution todos; final todos must include required testing and verification tasks.
6. Add an Execution Assist Matrix:
   - in-session skills and why,
   - delegated subagents only when justified,
   - expected artifact from each delegated step.
7. Apply delegation guardrails:
   - docs-only/markdown-only/rule-text changes -> no visual QA delegation,
   - UI behavior/layout/styling changes -> include `visual-qa` expected spec artifact path.
8. Add one Debt/Optimization Insight from touched code surface (low-risk improvement + rationale).
9. Preserve prototype-first strategy in the plan (1 -> 10 -> 100 ramp, dry-runs/checkpoints for risky changes).
10. Add review/testing criteria and final wow gate todos.
11. End with clear yes/no handoff.
12. Include explicit `Ticket Move` output:
   - move raw ticket from `tickets/todo/` to `tickets/review/` when planning starts,
   - move to `tickets/building/` only after human approval,
   - spawn follow-up tickets in `tickets/todo/` when scope splits.

IMPORTANT: Plan only. Do not implement.

