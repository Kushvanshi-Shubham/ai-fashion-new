# Fashion AI – Design System v2

> Reference for the refreshed bleuish SaaS aesthetic powering the 2025 UI overhaul.

## Palette

| Token | Light Mode | Dark Mode | Usage |
| --- | --- | --- | --- |
| `--background` | oklch(0.988 0.008 241.6) | oklch(0.19 0.015 241) | App shell background, surfaces |
| `--card` | oklch(0.99 0.01 240) | oklch(0.24 0.012 243) | Cards, panels, popovers |
| `--primary` | oklch(0.62 0.19 243.8) | oklch(0.72 0.18 242) | CTAs, highlights |
| `--secondary` | oklch(0.93 0.025 240) | oklch(0.28 0.015 242) | Secondary buttons, tabs |
| `--accent` | oklch(0.95 0.04 236) | oklch(0.3 0.015 242) | Pills, subtle backgrounds |
| `--ring` | oklch(0.68 0.16 242.3) | oklch(0.72 0.2 242) | Focus states, active outlines |
| `--muted` | oklch(0.962 0.015 238.1) | oklch(0.26 0.015 241) | Table rows, quiet surfaces |
| `--muted-foreground` | oklch(0.53 0.02 242.8) | oklch(0.72 0.03 242) | Supporting text |

> Full OKLCH palette and chart colors are defined in `src/app/globals.css`.

## Typography

- **Primary font:** Inter (variable) – loaded via `next/font` in `src/app/layout.tsx`.
- **Display font slot:** `--font-display` (defaults to Inter) for headings and key numbers. Swap in a display face by updating the layout provider.
- **Scale:**
  - Display: `clamp(2.4rem, 1.9rem + 2vw, 3.5rem)`
  - XL: `clamp(1.75rem, 1.5rem + 1vw, 2.5rem)`
  - LG: `clamp(1.3rem, 1.15rem + 0.6vw, 1.75rem)`
  - Body: `1rem` with 1.66 leading
  - Small: `clamp(0.85rem, 0.8rem + 0.18vw, 0.95rem)`
  - Caption: `clamp(0.75rem, 0.72rem + 0.2vw, 0.8125rem)`

## Spacing

All spacing is driven by an 8px soft grid, exposed as CSS variables:

```
--space-1: 0.25rem
--space-2: 0.5rem
--space-3: 0.75rem
--space-4: 1rem
--space-5: 1.25rem
--space-6: 1.5rem
--space-7: 1.75rem
--space-8: 2rem
--space-9: 2.5rem
--space-10: 3rem
```

Helper utilities:

- `.safe-px`, `.safe-py` for responsive section padding
- `.section-gap` to standardise vertical rhythm within stacks

## Motion

- Default easing: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quad)
- Entry animations:
  - `.motion-fade-in`
  - `.motion-rise`
  - `.motion-scale`
- Respect reduced motion via global media query (see `globals.css`).

## Surface Primitives

Use these as building blocks for cards, panels, and modules:

- `.surface`: Elevated glass card with blur and soft shadow
- `.surface-muted`: Low elevation, muted background surface
- `.surface-glass`: High-end frosted glass block for hero CTAs
- `.panel`: Default content container with generous padding
- `.panel-muted`: For statistic strips/side info

## Micro Components

- `.nav-pill`: New chip navigation with active/hover handling
- `.stat-chip`: Compact metric badge
- `.badge-soft`: Pill-shaped status badge for light CTAs
- `.card-gradient`: Gradient overlay helper for hero cards
- `.panel-grid`: Grid background overlay

## Utilities

Defined inside `@layer utilities`:

- `.shadow-soft`, `.shadow-surface`
- `.gridlines`
- `.text-balance`, `.text-pretty`
- `.surface-borderless`

## Implementation Notes

- Tokens live in `src/app/globals.css` and mirror Tailwind theme extensions in `tailwind.config.mjs`.
- Tailwind colour aliases (`surface`, `ink`, etc.) are available for component authoring (`text-ink`, `bg-surface`...).
- This document will evolve as we refactor feature areas—treat it as the single source of truth for the visual language.

---

## v2.1 – Professional SaaS Refinements (October 2025)

Focused polish round introducing consistent data presentation, badge semantics, and reduced cognitive load for dense workflows.

### Additions

- Data Table utilities: `.table-wrapper`, `.data-table`, confidence pills (`.confidence-high|medium|low`), status badges (`.status-*`).
- Layout helpers: `.layout-section`, `.layout-grid-cards` for adaptive grid dashboards.
- Input baseline style: `.input-base` ensuring consistent focus ring + translucent backgrounds.
- Micro actions: `.btn-ghost-muted`, `.btn-outline-accent` for low-emphasis affordances.
- Skeleton shimmer: `.skeleton` animation for perceived performance.
- Scroll fade masks: `.scroll-fade`, `.scroll-fade-x` soften overflow edges.
- Compact tone badges: `.badge-tonal` for inline numeric/meta markers.

### Usage Guidance

| Pattern | Use When | Notes |
| --- | --- | --- |
| Data table header stickiness | Column context must stay visible | Provided by `.data-table thead th` |
| Confidence pill | Showing model confidence % | Map: high ≥80, medium 60–79, low <60 |
| Status badge | Lifecycle label (completed/failed/processing/pending) | Avoid redundant icons |
| Ghost muted button | Filter toggles / light toolbar actions | Replaces unstyled text buttons |
| Outline accent button | Secondary primary-level actions | Below main CTA hierarchy |
| Layout section | Primary vertical rhythm wrapper | Don't nest >2 levels |

### Accessibility

- All new surfaces keep ≥4.5:1 contrast for essential text.
- Unified focus: `outline: 2px solid hsl(var(--ring) / 0.4)` (inputs, interactive pills).
- Motion remains opt‑out via `prefers-reduced-motion`.

### Migration Notes

Legacy ad-hoc gray utility classes inside table & bulk action components replaced with token-based styles. No functional logic altered. When adding components, prefer variable-driven tokens before introducing bespoke colors.

### Future Candidates

- Chart color ramps (semantic series)
- Density toggle (comfortable / compact)
- Unified toast + inline alert variants

### Spacing & Layout Tune (v2.1.1)

- Introduced `.hero-shell`, `.center-stack`, `stack-gap-*` utilities for explicit vertical rhythm instead of ad‑hoc margins.
- Sharpened cards via `.card-crisp` and accent overlay modifier for hover depth without heavy motion.
- Standardized stat grid with `.stats-grid` using auto-fit minmax for consistent wrapping at intermediate widths.
- Hero title & subtitle now use fluid clamp scale: ensures optical center and prevents oversized headings on ultra-wide viewports.

---

## v2.2 – Motion Simplification & Accessibility (October 2025)

Goals: Eliminate hydration mismatch risk, reduce JS payload, and strengthen baseline accessibility.

### Changes

| Area | Before | After | Impact |
| ---- | ------ | ----- | ------ |
| Header Interactions | Framer Motion hover/tap scale + entry animation | Pure CSS `transition-transform` + utility classes | Removes runtime animation lib from header path |
| Skip Link | Absent | Added `Skip to main content` anchored to `#main` | Keyboard users can bypass nav |
| Focus Ring | Solid 2px ring (`hsl(var(--ring))`) | Softer translucent ring `hsl(var(--ring) / 0.6)` + larger offset | Better contrast layering on tinted surfaces |
| Reduced Motion | Basic media query disabling most animation | Cancels `.motion-*` + adds `.motion-safe:transition-colors` | Clear contract for motion fallback |
| Animation Library | Framer Motion partially used site‑wide | Removed from header (others pending) | Smaller bundle / less hydration work |

### Implementation Notes

- Added skip link for improved keyboard navigation.
- Header refactored to eliminate `framer-motion` dependency; replaced with CSS scale transitions.
- Updated focus ring styling in `utilities.css` for improved visibility and aesthetics.
- Reduced motion users now receive instant, no-animation rendering of elements with `.motion-*` classes.

### Next Targets

1. Migrate table & discovery panel animations off Framer Motion.
2. Provide density toggle (comfortable / compact) for data tables.
3. Consolidate button subtle variants into single token-driven API.

---
