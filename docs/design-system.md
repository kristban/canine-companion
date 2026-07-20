# Design system

Bold, hand-drawn-sticker aesthetic: thick black borders, offset "hard"
shadows, chunky rounded type. All tokens live in `src/app/globals.css`
under the `@theme` block — change colors there, not in individual components.

## Fonts

- **Nunito** (`--font-sans`, body text) and **Fredoka** (`--font-display`,
  headings) — both self-hosted via `next/font/google` in `src/app/layout.tsx`.
- Apply the display font with the `.font-display` utility class, not by
  importing the font directly in a component.

## Color tokens

| Token | Hex | Role |
|---|---|---|
| `--color-primary` | `#aa4308` | Primary buttons/links, brand accent (burnt orange) |
| `--color-secondary` | `#f6b93b` | Secondary accent (yellow) |
| `--color-accent` | `#3fb6e0` | Tertiary accent (blue) |
| `--color-background` | `#fbf6ea` | Page background (cream) |
| `--color-background-alt` | `#f4ecd7` | Alternating section background |
| `--color-surface` | `#ffffff` | Card/form backgrounds |
| `--color-text` | `#17130f` | Body text (near-black) |
| `--color-muted` | `#6b6156` | Secondary/muted text |
| `--color-border` | `#17130f` | All borders *and* the "hard shadow" color |

### Contrast rules — check before changing any of the above

`--color-primary` was deliberately darkened from a brighter `#f2600c` because
the brighter version failed WCAG AA text contrast (verified: white-on-orange
was 3.25:1, orange-on-cream was 3.02:1 — both below the 4.5:1 minimum). The
current value passes with margin (~5.5–6:1 both ways). If you touch any color
token, recheck contrast — don't eyeball it.

Known-good text/background pairings:

- White text on `bg-primary` ✅ (used for all primary buttons)
- Dark text (`text-text`) on `bg-secondary` or `bg-accent` ✅
- Dark text (`text-text`) on `bg-primary` ❌ — fails contrast. If you need a
  badge/chip in the primary color, use white text (see the numbered badges in
  `HowItWorks.tsx` for the pattern of picking text color per background color).

## Signature look: bold bordered cards

- `border-3` (custom utility, 3px — Tailwind's default scale skips from 2px to 4px)
- `border-border` — every border and every "hard shadow" uses the same
  near-black color, which is what makes the sticker look read as consistent
- `shadow-hard` / `shadow-hard-sm` — flat offset drop-shadow utilities
  (`5px 5px 0 0` / `3px 3px 0 0`, no blur), not a real box-shadow
- Generous corner radii (`rounded-2xl`/`3xl`/custom values like `rounded-[2.5rem]`)
- `bg-grid-pattern` — faint graph-paper background, used on the hero and on
  standalone/legal page sections

## Conventions

- **Dashed border (`border-dashed`) means "decorative sticker badge,"** not a
  real content card. See the "2 min quiz" badge in `Landing.tsx`. Don't use a
  dashed border on an actual content container (forms, breed cards, etc.) —
  reserve it for playful accent badges only.
- **Buttons**: primary actions are solid `bg-primary` + `text-white`;
  secondary actions are `bg-surface` with a border. Both always pair with a
  `shadow-hard`/`shadow-hard-sm` and a `hover:-translate-y-*` lift for the
  "pressable sticker" feel.
- **Auto-updating UI needs an explicit pause control.** The breed showcase
  carousel auto-rotates every 6s; it has a visible pause/play button (not just
  a hover-to-pause, which doesn't work on touch devices) and does not use
  `aria-live` on the auto-changing content, so it doesn't force screen readers
  to announce every rotation. Follow this pattern for any future
  auto-advancing UI.
