# Agent Skills Module

Scope: `frontend/agent-skills/`

## Purpose

- hold repo-managed Claude SDK skills for CryoSight agents
- keep lightweight research skills versioned in git instead of only inside sandbox state
- separate skill instructions from the underlying MCP, HTTP, or Python tool implementations

## Rules

- keep skills concise and trigger-focused
- prefer public, no-key research surfaces first
- do not pretend a skill creates a tool; name the expected runtime/tool surface explicitly
- keep retrieved facts separate from inference for research-facing skills
