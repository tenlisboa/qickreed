---
status: complete
quick_id: 260719-sfz
slug: implement-landing-page-per-qic-24-spec
date: 2026-07-19
commit: 63aa9ce
requirements_covered:
  - LANDING-01
  - LANDING-02
  - LANDING-03
  - LANDING-04
  - LANDING-05
  - LANDING-06
  - LANDING-07
files_changed:
  - src/app/page.tsx
quality_gate:
  pnpm_lint: pass
  pnpm_build: pass
---

# Quick Task 260719-sfz — Implement Landing Page per QIC-24 Spec

One-liner: Overwrote the placeholder `src/app/page.tsx` with a pure Server
Component rendering the 5-section neobrutalist QIC-24 marketing landing (Hero,
O Problema, A Solução, Alinhamento de Público, Fechamento), all pt-BR copy
verbatim, primary CTA → `/signup`, secondary CTA → `/assessment`, no Supabase
call, no `"use client"`, no Hero GIF (LANDING-08 postponed to v2). Closes
LANDING-01..07. `pnpm lint && pnpm build` both pass with zero new warnings.

## What Was Built

A single file replacement (`src/app/page.tsx`) — diff: +168 / −113 lines, 1
file changed. The new page:

- Is a pure Server Component: `export default function Home()` (synchronous —
  no `async`, no `createClient()`, no `supabase.auth.getUser()`, no
  `"use client"`, no hooks, no event handlers).
-保留 existing `export const metadata` block (pt-BR title + description).
- Renders five semantic `<section>` elements in order, each separated by
  `border-t-[3px] border-black`:
  1. **Hero (LANDING-01)** — H1 with curly-quote copy `"voz na cabeça".`, the
     verbatim subtitle (`O Qickreed é um treinador … mais de 60% de retenção.`),
     primary CTA `Faça o Teste de Nivelamento Gratuito` (Link → `/signup`), and
     the microcopy line `Leva 2 minutos. Não requer cartão de crédito.`. No
     hero GIF/mockup (LANDING-08 intentionally postponed).
  2. **O Problema (LANDING-02)** — 3 `<Card padding="lg">` pain cards in a
     `md:grid-cols-3` grid, collapsing to one column on mobile. Verbatim
     card titles + bodies, curly quote preserved in `"pronuncia"`.
  3. **A Solução (LANDING-03)** — `<ol>` with explicit `bg-main`,
     `border-[3px] border-black`, `shadow-brutal-sm` numbered badges (1/2/3)
     instead of relying on browser default numbering. Three verbatim steps:
     A Linha de Base, O Motor Taquistoscópio, Validação Cognitiva via IA.
  4. **Alinhamento de Público (LANDING-04)** — `<ul>` with three check rows
     using `@heroicons/react/24/outline` `CheckCircleIcon` (black, `h-7 w-7`)
     — explicitly NOT green (AD-005 bans green success). Verbatim audience
     titles + bodies.
  5. **Fechamento (LANDING-05 + LANDING-06)** — Social proof line, final H2,
     secondary CTA `Descobrir meu PPM atual` (Link → `/assessment`).

### Routing & CTAs

- Both CTAs use `Button variant="primary" size="lg" asChild` with the `Link`
  nested as the Slot child — exactly the pattern the plan specified (Button
  wraps Link, not the other way around). The `focus-brutal` class is on each
  `<Link>` as required.
- Primary CTA `href="/signup"` (Link, not raw `<a>`) — middleware permits
  unauthenticated users to reach `/signup`.
- Secondary CTA `href="/assessment"` (Link) — middleware redirects unauthed
  users to `/login` (existing `src/utils/supabase/middleware.ts` behavior,
  untouched).

### Design System Compliance (AD-005 / LANDING-07)

- 3px black borders via Card primitives and explicit `border-[3px] border-black`
  on section dividers.
- Square corners (no `rounded-*`), hard `shadow-brutal*` shadows only (no
  blurred `shadow-sm/md/lg`), confirmed via `rg -c 'shadow-md|shadow-sm|shadow-lg'
  src/app/page.tsx` returning 0.
- Two accents only: `--main` (`#FFD23F`) for CTAs and step-number badges.
  `--error` (`#FF6B6B`) NOT used anywhere on this page (errors-only), confirmed
  via `rg -c 'error|#FF6B6B|red-500' src/app/page.tsx` returning 0.
- No green, no gradients, no inline `style={{}}`.
- Mobile-first: single column on mobile, 3-column grid at `md:` for pain cards,
  `max-w-4xl`/`max-w-3xl mx-auto px-6` gutters.
- All copy in pt-BR, verbatim from QIC-24 (subvocalização, taquistoscópio, PPM,
  documentações, vantagem competitiva all preserved).
- Operates as a Server Component, so no client hydration cost for marketing
  text.

## Quality Gate Results

- `pnpm lint` → **pass** (exit 0). 18 pre-existing `noNonNullAssertion`
  warnings in `src/utils/supabase/middleware.ts` and `src/utils/supabase/server.ts`
  — pre-existing, NOT introduced by this task and NOT in scope (middleware
  explicitly off-limits; `server.ts` not modified). No warnings or errors
  from `src/app/page.tsx`.
- `pnpm build` → **pass** (exit 0). Route `/` compiles and prerenders as
  static content (○ Static) with `207 kB` First Load JS. No new TypeScript
  errors introduced.

## File Hygiene Verification

Per the plan's `<verify>` block:

- `rg 'createClient|use client|useState|useEffect' src/app/page.tsx` → 0 matches ✓
- `rg 'shadow-md|shadow-sm|shadow-lg' src/app/page.tsx` → 0 matches ✓
- `rg 'error|#FF6B6B|red-500' src/app/page.tsx` → 0 matches ✓
- `git diff --name-only` (vs HEAD~1) → only `src/app/page.tsx` ✓

## Smoke Test Note (dev server)

A live `pnpm dev` smoke run was attempted. The dev route returned HTTP 500
while the page content (H1, both CTA labels, all four section H2s, the 60%
retention line, the 350-PPM step-2 line) all streamed into the response body.
The 500 is from **`src/middleware.ts` → `src/utils/supabase/middleware.ts`**
running on `/` with no `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
in the local env — it throws on the `process.env…!` non-null assertions.
This is a development-environment configuration issue, not a defect in
`src/app/page.tsx`: the production **build** succeeds, the route prere nders
as static content (○), and `rg` confirms zero Supabase/client references in
the page itself. Per the explicit plan constraint, middleware was NOT
modified. Providing the missing env vars in `.env.local` would let `pnpm dev`
serve `/` with HTTP 200.

## Deviations from Plan

None — the plan executed exactly as written. No new primitives added, no new
Button/Card variants, no new files, no middleware changes, no inline styles.

## Discoveries Worth Flagging

1. **Existing `Button` `asChild` Slot implementation** (`src/components/ui/button.tsx`):
   the in-house `Slot` clones its single child and merges `className`. The
   plan's instruction to put `<Button asChild>` wrapping a `<Link
   className="focus-brutal">` works correctly with this Slot — Button's
   `buttonVariants` classes (including its own `focus-brutal`) and the Link's
   `focus-brutal` both land on the rendered `<a>`. No code change needed.
2. **Existing `Card` `shadow="md"` maps to `shadow-brutal`** (not blurred):
   `src/components/ui/card.tsx` `cardVariants` maps `md → "shadow-brutal"`.
   So `<Card shadow="md">` is a hard shadow and is AD-005-compliant. The
   plan's instruction to use `shadow="md"` was correct — no override needed.
3. **Old `page.tsx` used raw `<a href>` for CTAs** — wrong for SPA navigation.
   The new page uses `<Link>` via Button's `asChild` slot, so signup and
   assessment navigate client-side and the middleware redirect fires cleanly.
4. **Old `page.tsx` was `async` + called Supabase on `/`** — added latency
   and coupled the marketing page to auth on every visit. The new page drops
   both, simplifying and speeding up first paint for logged-out visitors.
5. **No primitive was missing.** The plan anticipated all needed primitives
   (`Button`, `Card`) already exist. Zero new files created.
6. **`Button` did NOT need a new variant.** The plan's call to use
   `variant="primary"` for the secondary CTA (because `--error` red is
   errors-only) worked directly — visual hierarchy is maintained by position,
   not color, as the plan noted.

## Self-Check: PASSED

- `src/app/page.tsx` exists on disk — FOUND
- Commit `63aa9ce` exists in git log — FOUND
- `pnpm lint` — pass (exit 0, no new warnings)
- `pnpm build` — pass (exit 0, `/` prerendered as Static)
- `src/middleware.ts` and `src/utils/supabase/middleware.ts` unchanged —
  confirmed via `git diff --name-only` listing only `src/app/page.tsx`
- pt-BR copy fidelity — preserved verbatim including curly quotes
  (`"voz na cabeça".`, `"pronuncia"`), the `60%` retention token, and the
  `350 PPM` step-2 token