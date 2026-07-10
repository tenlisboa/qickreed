# Neobrutalism Migration Context

**Gathered:** 2026-07-09
**Spec:** `.specs/features/neobrutalism-migration/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Migrate QickReed's UI from the DaisyUI + monochrome-grayscale styling foundation to a
neobrutalism design system (thick black borders, hard zero-blur offset shadows, square
corners, flat fills, physical hover/active interactions), using the `neobrutal-ui`
library, a monochrome + one-accent (`#FFD23F`) palette, applied to **every** surface,
with DaisyUI fully removed and the project docs rewritten to match. No feature, backend,
or reading-logic changes.

---

## Implementation Decisions

### Palette

- Monochrome black/white/gray base.
- **Exactly one** accent color: `#FFD23F` (yellow), reserved for primary actions /
  highlights.
- Relaxes CLAUDE.md's "no color accents" rule to "one accent".

### Implementation approach

- Use the `neobrutal-ui` library (Bridgetamana) via its CLI (`npx neobrutal init` +
  `npx neobrutal add button card input select dialog alert ...`).
- Stack compatibility (Tailwind v4 / Next 15 / React 19 / Biome) **must be verified
  before scaffolding** — Design-phase research task. Fallback if incompatible:
  hand-rolled Tailwind token-based components, escalated to the user.
- For DaisyUI tokens with no library equivalent (`label`, `form-control`, `loading`,
  `join`, `divider`, `badge`, `table`, `range`, `checkbox`, `radio`): hand-rolled
  neobrutalist Tailwind classes driven by the same design tokens (hybrid migration).

### DaisyUI removal + docs

- Full removal: delete `@plugin "daisyui"`, uninstall `daisyui` devDependency, leave
  zero DaisyUI class names in source.
- Rewrite `CLAUDE.md` and `agent_docs/ui-ux_guidelines.mdc` to define the neobrutalism
  system; remove the DaisyUI + strict-monochrome mandates.

### Aggressiveness by surface

- **Bold everywhere uniformly** — full neobrutalism on every surface, including the RSVP
  training word-display and the assessment reading screens.
- This explicitly **overrides** TASK.md's note "Keep reading interfaces clean (less
  aggressive neobrutalism)". User's call.

### Lint gate

- `pnpm lint` fails today (83 errors / 46 warnings, many formatter issues).
- **Phase-0**: run `biome check --write` to auto-fix formatter + safe-lint errors and
  establish a green baseline before migration. Residual manual errors assessed and
  decided per-error (fix-now vs. accept-as-baseline) after the auto-fix.
- Per-task gate thereafter: `pnpm lint && pnpm build` (AD-002). Final verification:
  behavioral drive-through of the app. No unit tests.

---

## Agent's Discretion

- Exact neobrutal-ui component subset to `add` (beyond the core set) — agent selects
  based on what the pages actually consume.
- Hard-shadow size scale (sm/md/lg offsets) and exact hover/active translate deltas —
  agent picks values consistent with neobrutalism conventions, within the token system.
- Per-error disposition of residual manual lint errors after Phase-0.
- Page migration ordering, provided the app stays buildable at every commit.

---

## Declined / Undiscussed Gray Areas → Assumptions

- Exact usage boundaries of the single accent (which elements get `#FFD23F` beyond
  "primary actions / highlights") — assumed: primary CTAs, active/selected states, and
  key highlights; refined during Design. Logged in spec Assumptions.
- Typography changes (oversized headlines / monospace accents mentioned in TASK.md) —
  assumed: keep Geist Sans/Mono; bold weights for headlines where it serves hierarchy,
  no font replacement. Logged in spec Out of Scope (font retained) + discretion.

---

## Specific References

- TASK.md lists `#FFD23F` (yellow) and `#FF6B6B` (pink) as candidate accents; user chose
  to keep only the yellow.
- TASK.md Phase-2 token snippet (`--border: 3px solid #000`, `--shadow: 5px 5px 0 0 #000`,
  `--radius: 0`, `--bg: #FFFDF5`) used as a starting reference; final base background to
  be confirmed in Design (the app is currently pure `#ffffff`).
- Neobrutalism interaction physics from TASK.md: hover shifts toward shadow, active
  removes offset (translate equal to offset, shadow collapses to `0 0 0 #000`).

---

## Deferred Ideas

- Dark mode implementation — out of scope; only keep tokens dark-mode-friendly (P3).
- Full manual remediation of all 83 pre-existing lint errors — out of scope beyond the
  Phase-0 auto-fix; residual manual errors handled per-error.
- Replacing Heroicons or the Geist font — retained, not in scope.