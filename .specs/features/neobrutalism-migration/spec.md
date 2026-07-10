# Neobrutalism Design System Migration Specification

## Problem Statement

QickReed's UI is built on DaisyUI v5 with a custom monochromatic grayscale theme. The
desired direction is a **neobrutalism** design system: thick black borders, hard offset
shadows (zero blur), square corners, flat fills, and physical hover/active interactions.
This is a wholesale replacement of the styling foundation — code, the DaisyUI dependency,
and the project rules (`CLAUDE.md`, `agent_docs/ui-ux_guidelines.mdc`) that currently
mandate DaisyUI + a strict no-accent monochrome palette.

## Goals

- [ ] Replace the DaisyUI + monochrome styling foundation with a consistent neobrutalism
      system across every surface (navigation, forms, cards, tables, admin, **and the
      reading/training screens** — bold everywhere, per user decision).
- [ ] Introduce a monochrome base (black/white/gray) plus **exactly one accent color**
      (`#FFD23F`), used for primary actions / highlights.
- [ ] Remove DaisyUI entirely: delete `@plugin "daisyui"`, uninstall the `daisyui`
      devDependency, leave zero DaisyUI class names in source.
- [ ] Rewrite `CLAUDE.md` and `agent_docs/ui-ux_guidelines.mdc` to define the new system
      so project rules match the code.
- [ ] Achieve a green `pnpm lint && pnpm build` gate on the migrated code, verified
      behaviorally by driving the app.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Dark mode implementation | Future work; only token/foundation awareness, no `prefers-color-scheme` build-out. |
| New features / new components beyond restyling existing surfaces | This is a restyle, not feature work. |
| Backend / Supabase / RLS / migrations changes | No data-layer impact. |
| Reading logic / WPM / RSVP timing changes | Behavioral spec in `docs/business_rules.md` is untouched. |
| Replacing Heroicons or the Geist font | Both retained. |
| Full manual remediation of pre-existing lint debt beyond auto-fix | Phase-0 covers auto-fixable (formatter + safe lint) only; residual manual errors are assessed, not blanket-fixed. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Palette | Monochrome black/white/gray base + one accent `#FFD23F` (yellow), reserved for primary actions / highlights. | User chose "monochrome + 1 accent". Relaxes CLAUDE.md's "no accents" rule to "exactly one accent". | y |
| Implementation library | `neobrutal-ui` (Bridgetamana) via `npx neobrutal init` + `npx neobrutal add ...`. | User chose the CLI library (TASK.md recommendation). | y |
| Library stack compatibility | Assumed compatible with Tailwind v4 / Next 15 / React 19 / Biome, but **must be verified in Design / Phase 1**. If incompatible, fall back to hand-rolled Tailwind token-based components and escalate. | Never assume a third-party dep works; verification is mandatory before scaffolding. | n — verify in design |
| Coverage gap for tokens with no library equivalent (`label`, `form-control`, `loading`, `join`, `divider`, `badge`, `table`, `range`, `checkbox`, `radio`) | Hand-rolled neobrutalist Tailwind classes driven by the same design tokens, so styling stays consistent. | `neobrutal-ui` ships Button/Card/Input/Select/Dialog/Alert etc. but not every DaisyUI token; the migration is library + token hybrid. | y |
| Aggressiveness by surface | **Full neobrutalism on every surface, including RSVP training and assessment reading screens** ("bold everywhere uniformly"). | User explicitly overrode TASK.md's "keep reading screens calm" note. | y |
| Per-task gate | `pnpm lint && pnpm build` (AD-002). Final verification = behavioral drive-through of the app. No unit tests exist / will be invented. | AD-002 overrides the spec-driven skill's test-per-AC default. | y |
| Lint baseline | Phase-0 runs `biome check --write` to auto-fix formatter + safe-lint errors and establish a green baseline before migration begins. Residual manual errors are assessed and decided after the auto-fix pass. | `pnpm lint` fails today (83 errors / 46 warnings, many formatter issues); user chose the Phase-0 auto-fix path. | y |
| Biome formatting / import ordering | Auto-applied via `pnpm lint` / `pnpm format`; not hand-restated. | CLAUDE.md convention. | y |

**Open questions:** the single unresolved item — `neobrutal-ui` stack compatibility — is
to be resolved during Design (Knowledge Verification Chain Steps 3–4: Context7 / web
search against the library's docs), with a documented fallback. No other item proceeds
unmarked.

---

## User Stories

### P1-A: Phase-0 Lint Baseline ⭐ MVP

**User Story**: As a developer, I want a green lint baseline before the migration so that
the per-task gate (`pnpm lint && pnpm build`) is achievable and any new errors are
unambiguously mine.

**Why P1**: Without a green baseline the gate cannot pass; every later task's "done"
signal is meaningless.

**Acceptance Criteria**:

1. WHEN `biome check --write` runs THEN all auto-fixable formatter and safe-lint errors
   SHALL be applied to the working tree.
2. WHEN `pnpm lint` runs after the auto-fix THEN the error count SHALL be reduced to the
   set of residual **manual** errors only; those SHALL be enumerated and a per-error
   decision recorded (fix-now vs. accept-and-baseline) in the task record.
3. WHEN the baseline is established THEN `pnpm build` SHALL still pass (auto-fix must not
   break the build).

**Independent Test**: Run `pnpm lint` and confirm the remaining diagnostics are only
non-auto-fixable; run `pnpm build` and confirm success.

---

### P1-B: Foundation — Library + Design Tokens ⭐ MVP

**User Story**: As a developer, I want `neobrutal-ui` installed and neobrutalism design
tokens defined so every component can be built on a shared foundation.

**Why P1**: This is the substrate every other task depends on.

**Acceptance Criteria**:

1. WHEN `neobrutal-ui` is installed (`npx neobrutal init` + core `add` commands) THEN the
   library's components SHALL be importable AND `pnpm build` SHALL succeed — verifying
   compatibility with Tailwind v4 / Next 15 / React 19 / Biome. IF verification fails,
   the fallback (hand-rolled Tailwind token components) SHALL be invoked and the user
   SHALL be escalated to before proceeding.
2. WHEN `globals.css` loads THEN it SHALL define neobrutalism tokens: a 3px solid black
   border token, hard offset shadow tokens with **zero blur** (e.g. `4px 4px 0 0 #000`,
   plus larger variants), `--radius: 0`, the monochrome base, and **exactly one** accent
   `#FFD23F`. No blurred-shadow or rounded-corner tokens SHALL remain for primary
   surfaces.
3. WHEN `@plugin "daisyui"` is considered THEN it SHALL still be present at the end of
   this task (removal is P1-E, after components no longer depend on it) so the app stays
   functional mid-migration.

**Independent Test**: Inspect `globals.css` for the token set; confirm `neobrutal-ui`
components import and `pnpm build` is green.

---

### P1-C: Shared Component Primitives ⭐ MVP

**User Story**: As a developer, I want `Button`, `Card`, and the form primitives restyled
neobrutalist so pages can consume them uniformly.

**Why P1**: Pages migrate by swapping to these primitives; without them there is no
consistent migration path.

**Acceptance Criteria**:

1. WHEN `Button` renders in `primary` / `secondary` / `outline` variants THEN each SHALL
   show a 3px black border + a hard offset shadow (zero blur); on hover the element SHALL
   shift toward the shadow (or the shadow SHALL shrink); on active the offset SHALL
   collapse to `0 0 0 #000` with a translate equal to the offset.
2. WHEN `Card` renders THEN it SHALL have square corners, a black border, and a hard
   offset shadow; the `shadow` prop SHALL map to hard offsets (not Tailwind's blurred
   `shadow-sm/md/lg`).
3. WHEN `input` / `select` / `textarea` render THEN each SHALL have a 3px black border,
   square corners, a white flat fill, black text, and a thick black focus outline.
4. WHEN `label` / `form-control` / `checkbox` / `radio` / `badge` / `alert` / `divider` /
   `loading` / `table` / `join` / `range` render THEN each SHALL use neobrutalist styling
   consistent with the tokens (library component where available, hand-rolled
   token-driven class otherwise).

**Independent Test**: Render each primitive (Storybook-style ad-hoc page or a temp route)
and confirm borders/shadows/corners/focus match the spec.

---

### P1-D: Migrate All Pages Off DaisyUI ⭐ MVP

**User Story**: As a user, I want every page to look neobrutalist so the experience is
consistent across the app.

**Why P1**: This is the visible deliverable of the migration.

**Acceptance Criteria**:

1. WHEN any of the ~22 app TSX pages (auth, dashboard, training, assessment, admin) is
   rendered THEN its source SHALL contain **no** DaisyUI component class names
   (`btn`, `card`, `card-body`, `input`, `input-bordered`, `select`, `label`,
   `label-text`, `form-control`, `badge`, `alert`, `alert-error`, `table`, `join`,
   `divider`, `loading`, `range`, `radio`, `checkbox`, `btn-*`, etc.); all SHALL use
   neobrutalist primitives / token classes.
2. WHEN the RSVP training word-display and assessment reading screens render THEN they
   SHALL receive the **full** neobrutalist treatment (borders, hard shadows, square
   corners) per the "bold everywhere" decision — NOT a restrained variant.
3. WHEN existing pt-BR `ActionResult` error messages render THEN they SHALL render inside
   neobrutalist `alert` styling with no behavioral regression.

**Independent Test**: `grep` the `src/` tree for DaisyUI tokens and confirm zero matches;
drive each route and confirm neobrutalist appearance.

---

### P1-E: Remove DaisyUI Entirely ⭐ MVP

**User Story**: As a developer, I want DaisyUI fully removed so the success criterion "no
DaisyUI dependencies remain" is met.

**Why P1**: Partial removal leaves a dead dependency and a false success signal.

**Acceptance Criteria**:

1. WHEN `grep -r "daisyui" src/ src/app/globals.css` runs THEN zero matches SHALL remain.
2. WHEN `globals.css` is read THEN the `@plugin "daisyui";` line SHALL be gone.
3. WHEN `package.json` is read THEN `daisyui` SHALL be absent from `devDependencies`
   (uninstalled via the package manager).
4. WHEN `pnpm lint && pnpm build` runs THEN both SHALL pass (the gate per AD-002).

**Independent Test**: `grep -ri daisyui src/ package.json` returns nothing; gate green.

---

### P1-F: Rewrite Project Docs ⭐ MVP

**User Story**: As a contributor, I want `CLAUDE.md` and `ui-ux_guidelines.mdc` to
describe the neobrutalism system so future work follows the new rules, not the old
DaisyUI/monochrome mandates.

**Why P1**: Leaving stale rules guarantees regressions and contradicts the code.

**Acceptance Criteria**:

1. WHEN `CLAUDE.md` is read THEN its styling section SHALL describe neobrutalism (thick
   black borders, hard zero-blur offset shadows, square corners, flat fills, physical
   hover/active) and SHALL state the palette is monochrome + one accent `#FFD23F`; it
   SHALL NOT mandate DaisyUI or a strict no-accent monochrome rule.
2. WHEN `agent_docs/ui-ux_guidelines.mdc` is read THEN its component standards, color
   palette, and "Tailwind CSS & DaisyUI Standards" section SHALL be rewritten to the
   neobrutalism system with token + class conventions; the DaisyUI component list SHALL
   be removed.
3. WHEN the docs reference focus/contrast accessibility THEN they SHALL keep the existing
   accessibility requirements (label `htmlFor`, visible focus, WCAG AA).

**Independent Test**: Read both docs end-to-end and confirm no DaisyUI/monochrome-only
mandates remain; neobrutalism conventions present.

---

### P2: Accessibility & Responsive Audit

**User Story**: As a user (especially on mobile or with assistive tech), I want the
neobrutalist UI to remain accessible and responsive.

**Why P2**: Required for shipping quality but is verification/polish on top of the P1
restyle.

**Acceptance Criteria**:

1. WHEN focus is given to any interactive element THEN a visible thick black focus
   outline SHALL appear (WCAG 2.4.7).
2. WHEN the accent `#FFD23F` is used as a background with text THEN the text color SHALL
   be chosen to meet WCAG AA contrast (≥4.5:1 normal text, ≥3:1 large text); black text
   on `#FFD23F` is the expected pairing.
3. WHEN viewed at ≤640px width THEN layout SHALL remain usable: no horizontal overflow,
   readable text, tappable targets ≥44px.
4. WHEN hovering/activating any interactive element THEN the physical shift/shadow
   interaction SHALL be present and consistent across components.

**Independent Test**: Tab through each page and confirm visible focus; check accent
contrast with a contrast tool; resize to mobile and confirm no overflow.

---

### P3: Dark Mode Foundation

**User Story**: As a developer, I want the door left open for dark mode without building
it now.

**Why P3**: Nice-to-have; the current app is light-only and dark mode is explicitly out
of scope to implement.

**Acceptance Criteria**:

1. WHEN the token system is defined THEN it SHALL not preclude a future dark palette
   (tokens are centralized, not hard-coded per-component).

---

## Edge Cases

- WHEN `neobrutal-ui` proves incompatible with the stack THEN the hand-rolled fallback
  SHALL be used and the user SHALL be escalated before continuing (assumption above).
- WHEN a DaisyUI token has no `neobrutal-ui` equivalent THEN a hand-rolled neobrutalist
  Tailwind class driven by the shared tokens SHALL be used (consistency preserved).
- WHEN Phase-0 auto-fix leaves residual manual lint errors THEN each SHALL be decided
  individually (fix-now vs. accept-as-baseline) rather than blanket-ignored.
- WHEN the build breaks mid-migration (DaisyUI still present but a page already migrated)
  THEN the page-level migration order SHALL keep the app buildable at every commit.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| NEO-01 | P1-A: Lint baseline | Execute | Pending |
| NEO-02 | P1-B: Library + tokens | Design / Execute | Pending |
| NEO-03 | P1-B: Token set in globals.css | Execute | Pending |
| NEO-04 | P1-C: Button neobrutalist | Execute | Pending |
| NEO-05 | P1-C: Card neobrutalist | Execute | Pending |
| NEO-06 | P1-C: Form primitives neobrutalist | Execute | Pending |
| NEO-07 | P1-D: Pages free of DaisyUI classes | Execute | Pending |
| NEO-08 | P1-D: Reading screens full neobrutalism | Execute | Pending |
| NEO-09 | P1-D: ActionResult error rendering preserved | Execute | Pending |
| NEO-10 | P1-E: DaisyUI removed from source | Execute | Pending |
| NEO-11 | P1-E: `@plugin "daisyui"` removed | Execute | Pending |
| NEO-12 | P1-E: `daisyui` uninstalled | Execute | Pending |
| NEO-13 | P1-E: Gate green (`pnpm lint && pnpm build`) | Execute | Pending |
| NEO-14 | P1-F: CLAUDE.md rewritten | Execute | Pending |
| NEO-15 | P1-F: ui-ux_guidelines.mdc rewritten | Execute | Pending |
| NEO-16 | P2: Focus states visible | Execute | Pending |
| NEO-17 | P2: Accent WCAG AA contrast | Execute | Pending |
| NEO-18 | P2: Responsive ≤640px | Execute | Pending |
| NEO-19 | P2: Physical hover/active consistency | Execute | Pending |
| NEO-20 | P3: Dark-mode-friendly tokens | Execute | Pending |

**ID format:** `NEO-NN`
**Status values:** Pending → In Design → In Tasks → Implementing → Verified
**Coverage:** 20 total, 0 mapped to tasks yet (tasks phase pending), 0 unmapped ⚠️

---

## Success Criteria

- [ ] Every surface uses neobrutalist components consistently (borders 3px black, hard
      zero-blur offset shadows, square corners, flat fills, physical interactions).
- [ ] Palette is monochrome + one accent `#FFD23F`; no other accent colors.
- [ ] Zero DaisyUI class names in `src/`; `@plugin "daisyui"` gone; `daisyui`
      devDependency uninstalled.
- [ ] `CLAUDE.md` and `agent_docs/ui-ux_guidelines.mdc` rewritten to the new system.
- [ ] `pnpm lint && pnpm build` green; behavioral drive-through confirms appearance and
      no regressions (auth, dashboard, training, assessment, admin).
- [ ] WCAG AA contrast maintained; visible focus states; responsive at mobile width.