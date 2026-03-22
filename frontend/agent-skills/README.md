# Agent Skills

## Purpose

This directory contains Claude SDK skills for CryoSight agents.

## Public API / Entrypoints

- `public-bio-research/SKILL.md`: lightweight public-database research skill for compounds, structures, and related evidence

## Current Direction

- Start with lightweight research skills that assume public data access and minimal dependencies.
- Keep heavy compute workflows such as docking, MD, or DeepChem in separate skills later.
- Treat each skill as an instruction layer on top of real tools such as MCP servers, HTTP adapters, or Python packages.
