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
