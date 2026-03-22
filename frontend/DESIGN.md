# CryoLens Design System — NeoLab

## Philosophy

Inspired by Palantir Foundry/AIP: a research instrument, not a consumer app.
Data-dense but breathing. Architectural precision. Typography does the heavy lifting.

## Typeface

**Geist** (by Vercel) — variable, Swiss-inspired, built for data and interfaces.

- `Geist Sans` — all UI text. Variable weight 100–900.
- `Geist Mono` — data values, SMILES, DOIs, compound IDs, tabular numbers.
- Feature settings: `ss01`, `ss02`, `cv01` for alternate glyphs.

## Color System

M3 surface hierarchy from the Stitch reference, kept intact:

- **8 surface levels** for layered depth (lowest → highest)
- **Terracotta accent** (#C45B3D) — warm signal against cool instrument surfaces
- **Secondary green** (#49655B) — viability/success/positive data
- **Primary slate** (#4F6073) — neutral interactive elements

## Typography Scale

| Role | Size | Weight | Tracking | Font |
|------|------|--------|----------|------|
| Page title | 22px | 600 | -0.03em | Sans |
| Hero display | 32-38px | 600 | -0.035em | Sans |
| Row title | 13-14px | 500 | -0.015em | Sans |
| Body | 12-13px | 400 | -0.006em | Sans |
| Micro label | 10px | 500 | 0.06em | Sans, uppercase |
| Data value | 11-13px | 500 | -0.02em | Mono |
| SMILES/ID | 10px | 400 | 0 | Mono |

## Spacing

4-point grid: 4, 8, 12, 16, 20, 24, 32, 48, 64.

## Radius

Tight and architectural: 2px (badges), 3-4px (inputs, cards), 6-8px (panels).

## Components

- **Nav:** 48px height, frosted glass, tight pill-shaped active states
- **Cards:** White (surface-lowest) with 1px border at 8-12% opacity, no shadow at rest, subtle hover
- **Badges:** Pill, 10px uppercase, container-color backgrounds at 60% opacity
- **Tables:** No alternating rows. Border-b only. Mono for numeric columns.
- **Sidebar:** Muted bg, tight spacing, icon + label nav items
