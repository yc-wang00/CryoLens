# Frontend Components

## Purpose

This directory contains reusable presentation components for the CryoSight frontend.

## Public API / Entrypoints

- `ui/*`: base UI primitives
- `ai-elements/tool.tsx`: Ask tool trace primitives inspired by AI Elements
- `insights/*`: evidence and landscape panels used across pages

## Minimal Example

```tsx
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "./ai-elements/tool";
```

## How To Test

```bash
cd frontend
pnpm run build
```
