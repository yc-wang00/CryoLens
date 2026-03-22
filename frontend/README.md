# CryoLens Frontend

React + TypeScript + Vite + Tailwind v4 frontend for CryoLens.

## Pages

| Page | Route | Data source |
|------|-------|-------------|
| Research | `ask` | `/api/v1/chat` (Claude Agent SDK SSE stream) |
| Hypotheses | `hypotheses` | `/api/v1/hypotheses` |
| Library | `molecules` | `/api/v1/library/*`, `/api/v1/compounds` |
| Cocktails | `cocktails` | `/api/v1/library/cocktails`, `/api/v1/library/protocols` |
| Knowledge Base | `sources` | `/api/v1/papers`, `/api/v1/stats` |

All API calls go through `/api/v1/*`, proxied to the FastAPI backend via Vite (dev) or Caddy (production).

## Development

```bash
pnpm install
pnpm dev
```

Runs on `http://127.0.0.1:5173`. Requires the FastAPI backend running on port 8000.

## Build

```bash
pnpm build
pnpm preview
```

## Design System

- Fonts: Space Grotesk (sans), Space Mono (mono)
- Accent: Terracotta `#c45b3d`
- Primary: Slate blue-grey `#4f6073`
- Micro-interactions: skeleton loaders, page-enter animations, staggered lists, card hover lift
