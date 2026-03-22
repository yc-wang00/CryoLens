# Frontend Pages

Purpose:
- render the primary CryoSight routes from typed data props.

Current pages:
- `ask-page.tsx`
- `hypotheses-page.tsx`
- `molecules-page.tsx`
- `cocktails-page.tsx`
- `sources-page.tsx`

Minimal example:
```tsx
import { AskPage } from "./ask-page";

<AskPage dataset={dataset} onHypothesisSaved={reload} onOpenHypotheses={() => {}} />
```

How to test:
- `cd frontend && pnpm lint && pnpm build`
- open the local app and verify the declared route states
