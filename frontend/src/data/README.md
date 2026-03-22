# Frontend Data

Purpose:
- define typed contracts for the frontend and fetch data from backend/browser sources.

Entry points:
- `cryo-lens.ts`: app dataset loader
- `agent-search.ts`: Ask SSE client
- `cryo-lens-browser.ts`: browser-safe display reads
- `cryo-lens-contract.ts`: shared types

Minimal example:
```ts
import { fetchCryoLensDataset } from "./cryo-lens";

const dataset = await fetchCryoLensDataset();
console.log(dataset.appStats.findings);
```

How to test:
- `cd frontend && pnpm lint && pnpm build`
