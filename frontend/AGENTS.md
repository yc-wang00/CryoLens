# Frontend Module Contract

Scope: `frontend/`

## Purpose

- present the CryoSight hackathon story clearly
- keep the Ask flow as the primary product surface
- use mock data shaped like the backend model until API integration is ready

## Rules

- preserve the visual direction established by `test.html`
- keep shared layout and page scaffolds reusable
- prefer centered modals over persistent right-side detail sidebars for entity inspection
- prefer mock data in one place over hardcoded page-local constants
- optimize for demo clarity over feature completeness
- route Ask-page agent search through a server-owned backend surface; never expose Supabase SQL credentials or direct agent tooling to the browser

## README Requirement

Keep `frontend/README.md` updated when setup, scripts, or page structure changes.
