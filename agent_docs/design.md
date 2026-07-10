# Design — Neobrutalism Tokens

The **what and why** of the QickReed design system (decision AD-005). The companion
[`system.md`](./system.md) covers component usage. This file is the single source of truth
for tokens; components consume them, never hard-code hex values.

## Philosophy

1. **Bold everywhere** — 3px black borders, hard shadows, square corners on every surface,
   including the RSVP training and assessment reading screens.
2. **Physical interactions** — element shifts toward its shadow on hover; on active the
   offset collapses to `0 0 0 #000` and the element translates by the offset.
3. **Flat fills, no gradients, no blur** — solid backgrounds; shadows are hard offsets
   (`Npx Npx 0 0 #000`), never blurred.
4. **Two-accent palette** — monochrome base + `#FFD23F` (yellow) and `#FF6B6B` (red, errors
   only). Success is non-color.
5. **Accessibility** — WCAG AA, visible focus, keyboard nav.

## Tokens (`src/app/globals.css`)

```css
:root {
  --black: #000000;     /* text + borders + shadow color */
  --white: #ffffff;     /* component backgrounds */
  --bg: #ffffff;        /* page background */
  --main: #ffd23f;      /* accent 1: primary / highlights / active */
  --error: #ff6b6b;     /* accent 2: error states only */
  --radius: 0;          /* square corners */

  /* hard offset shadows, zero blur */
  --shadow-brutal:    4px 4px 0px 0px var(--black);
  --shadow-brutal-sm: 3px 3px 0px 0px var(--black);
  --shadow-brutal-lg: 6px 6px 0px 0px var(--black);
}
```

`@theme inline` maps these to Tailwind utilities: `--color-main`, `--color-error`,
`--color-bg`, `--radius-brutal` / `--radius-base`, `--shadow-brutal` / `-sm` / `-lg`, plus
Geist font vars. Gray scales (`--color-primary-*`, `--color-secondary-*`,
`--color-neutral-*`) remain for text/border utilities.

## Structural utilities

- `focus-brutal` → `&:focus-visible { outline: 3px solid var(--black); outline-offset: 2px; }`
- `transition-brutal` → `transition: transform, box-shadow; 150ms ease-in-out`

## Palette & contrast

| Token | Value | Use |
| --- | --- | --- |
| `--black` | `#000000` | Text, 3px borders, shadow color |
| `--white` / `--bg` | `#ffffff` | Component / page backgrounds |
| `--main` | `#ffd23f` | Primary actions, highlights, active nav, active states |
| `--error` | `#ff6b6b` | Error alerts/fills **only** |
| grays | `primary-*` / `neutral-*` | Secondary text, subtle borders |

**Text on accents is always black** — `#FFD23F` ≈ 17:1, `#FF6B6B` ≈ 7.8:1 (both pass AA).
**Never** white-on-accent. **Success has no color** — convey it with an icon + pt-BR text +
thick black border (not color-only, per WCAG). **No green.**

## Typography

Geist Sans (primary) + Geist Mono, system fallback. Weights: bold for headlines and
interactive surfaces (the neobrutalism system is bold-everywhere).

- **H1**: `text-3xl font-bold` · **H2**: `text-2xl font-semibold` · **H3**: `text-xl font-medium`
- **Body**: `text-base` · **Secondary**: `text-gray-600` · **Small**: `text-sm` · **xs**: `text-xs`

## Spacing

Tailwind scale, used consistently: form fields `space-y-6`, card padding `p-6`–`p-8`,
section margins `mb-8` / `mt-8`, element spacing `mt-2`. Mobile-first; responsive prefixes
(`sm:` / `md:` / `lg:`). Forms `max-w-md`, content `max-w-4xl`. Tap targets ≥44px.

## Banned tokens (do not use)

- Any DaisyUI class — `btn`, `card`, `card-body`, `input-bordered`, `select-bordered`,
  `label-text`, `form-control` (as a class), `alert-error`, `modal-box`,
  `loading-spinner`, `join`, `divider`, `badge`, `range`, `tab`, etc.
- Tailwind's **blurred** `shadow-sm` / `shadow-md` / `shadow-lg` on primary surfaces — use
  `shadow-brutal` / `-sm` / `-lg` instead.
- **White-on-accent** text, **green/success** color, **gradients**, **`rounded-*`** corners,
  inline `style={{}}` for colors/spacing, invented Button/Card variants, `!important`.

## Dark mode

Not implemented. Tokens are centralized in `:root`, so a future dark palette is achievable
by swapping `:root` values only — no per-component hard-coded colors. (Exception: recharts
SVG `stroke`/`fill` in `dashboard/page.tsx` use hex literals because recharts can't resolve
CSS `var()` in SVG presentation attributes.)