# CryoLens Design System

## Audit of Stitch Output

### What Stitch Got Right
- Manrope + Inter font pairing (strong, scientific, modern)
- Uppercase tracking-widest micro-labels for metadata
- Glass-effect nav (backdrop-blur)
- Evidence sidebar pattern on the Ask page
- Bento grid for the research results

### What Stitch Got Wrong
1. **40+ semantic color tokens create mud.** Too many grey-blue surface layers with almost no contrast between them. The UI looks washed-out and flat — like a prototype, not a product.
2. **Terracotta accent is arbitrary.** It doesn't connect to cryopreservation, science, or trust. It reads "craft pottery app."
3. **Everything is uppercase.** Headlines, labels, badges, buttons, nav items — the uppercase tracking-widest pattern is overused to the point of visual monotony.
4. **2px border radius reads broken.** Neo-Minimal pushed too far — elements look like they forgot to add rounding rather than making a deliberate choice.
5. **Material Design 3 surface hierarchy overkill.** surface, surface-dim, surface-bright, surface-lowest, surface-low, surface-container, surface-high, surface-highest — 8 surface levels is academic, not practical.
6. **No visual moments.** No contrast, no breathing room, no hierarchy. Every element has the same visual weight.

## Design References

### Anthropic (Claude)
- Warm, book-like feel. Generous whitespace.
- Very few colors: warm cream background, near-black text, one accent (amber/orange).
- Clean sans-serif (Styrene). Large body text. Content is the star.
- Inputs: large, simple, single bottom-border or subtle outline.

### OpenAI (ChatGPT)
- Dark mode default. Sidebar for conversation history.
- Monochrome with green accent. Very restrained palette.
- Chat bubbles with clear user/assistant distinction.
- Thinking indicators that feel alive.

### Palantir (Foundry/AIP)
- Data-dense but organized. Dark themes for analyst tools.
- Strong grid systems. Cards with clear hierarchy.
- Monospace for data, sans-serif for UI. Clear type scale.
- Blueprint-blue accent. Professional, almost austere.

### Common Patterns Across All
1. **Restrained color** — 1-2 accent colors max, rest is greyscale
2. **Clear hierarchy** — obvious primary/secondary/tertiary content levels
3. **Generous spacing** — sections breathe, content doesn't feel cramped
4. **Typography does the work** — size, weight, and color create hierarchy, not borders/backgrounds
5. **Subtle interactions** — hover states, transitions, focus rings that feel considered
6. **Content-first** — UI chrome minimized, data/content elevated

## CryoLens Design Principles

1. **Scientific clarity.** This is a research tool. Every pixel should build trust. No decoration that doesn't serve comprehension.
2. **Content-forward.** Findings, data, and citations are the product. UI chrome disappears behind the content.
3. **Restrained palette.** Near-white background, near-black text, ONE accent color. Everything else is greyscale.
4. **Typographic hierarchy.** Size and weight create structure, not colored boxes.
5. **Considered density.** Dense enough for researchers (data tables, compound lists), spacious enough to read (findings, chat).

## Revised Design Tokens

### Colors (simplified from 40+ to ~12)

```
Background:       #FAFAFA (warm near-white)
Surface:          #FFFFFF (cards, inputs)
Surface Muted:    #F4F5F7 (secondary surfaces)
Border:           #E8EAED (subtle dividers)
Border Hover:     #D0D4DA

Text Primary:     #1A1D21 (headlines, primary content)
Text Secondary:   #5F6368 (body, descriptions)
Text Tertiary:    #9AA0A6 (metadata, timestamps)

Accent:           #2563EB (scientific blue — trust, precision)
Accent Hover:     #1D4ED8
Accent Subtle:    #EFF6FF (accent backgrounds)

Success:          #16A34A (viability, positive outcomes)
Warning:          #D97706 (medium confidence)
Error:            #DC2626 (low viability, errors)
```

### Typography

```
Font Headline:    "Manrope", sans-serif
Font Body:        "Inter", sans-serif

Display:          36px / 700  / -0.02em  (page titles)
Heading:          20px / 700  / -0.01em  (section titles)
Subheading:       14px / 600  / 0        (card titles)
Body:             14px / 400  / 0        (descriptions, content)
Caption:          12px / 500  / 0        (metadata, secondary info)
Micro:            10px / 600  / 0.05em   (badges, tags — uppercase)
```

### Spacing Scale
```
4px / 8px / 12px / 16px / 24px / 32px / 48px / 64px
```

### Radius
```
Small:   6px   (badges, tags)
Medium:  8px   (cards, inputs)
Large:   12px  (modals, panels)
Full:    9999px (pills, avatars)
```

### Shadows
```
sm:  0 1px 2px rgba(0,0,0,0.05)
md:  0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)
lg:  0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.03)
```

### Component Patterns

**Navigation:** Fixed top, white bg with subtle bottom border. Logo left, tabs center-left, actions right. Active tab: text-accent with bottom indicator. Height: 56px.

**Cards:** White bg, 1px border (#E8EAED), 8px radius, hover lifts with shadow-md. No background color variation — white only.

**Badges:** Pill shape (full radius), small (10px uppercase), colored bg matching intent (accent-subtle for topics, green for status).

**Inputs:** White bg, 1px border, 8px radius, 44px height. Focus: accent border + subtle accent shadow ring.

**Tables:** No alternating rows. Header row with caption-weight text and bottom border. Rows with bottom border only. Hover: surface-muted bg.

**Chat Messages:** User: right-aligned, accent-subtle bg. Assistant: left-aligned, no bg (text on page). Tool calls: collapsible, monospace, bordered.
