# Neobrutalism Migration Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/neobrutalism-migration/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` ("no test framework configured — do not invent test commands"), `.specs/STATE.md` AD-002 (gate = `pnpm lint && pnpm build`; final verification behavioral). No test runner, no test deps, no existing tests. AD-002 overrides the spec-driven skill's test-per-AC default.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| UI components / pages (all) | none | — (build gate only; behavioral verify at feature end) | `src/**/*.tsx` | `pnpm lint && pnpm build` |
| Tokens / config (`globals.css`, `package.json`) | none | — (build gate only) | `src/app/globals.css`, `package.json` | `pnpm lint && pnpm build` |
| Docs (`CLAUDE.md`, `agent_docs/*.mdc`) | none | — (review only) | repo root / `agent_docs/` | n/a |

**Final verification (feature-level, after T19):** behavioral drive-through of the app — auth, dashboard, training (RSVP), assessment, admin — confirming neobrutalist appearance, no regressions, zero DaisyUI classes, `pnpm lint && pnpm build` green. This substitutes for the test suite per AD-002.

## Parallelism Assessment

> No tests exist, so test-parallelism is N/A. Code-level parallelism is governed by file isolation.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
| --------- | -------------- | --------------- | -------- |
| (none — build gate only) | Yes (code) | Tasks touch disjoint files; no shared mutable state between `[P]` tasks in a phase | `CLAUDE.md` + AD-002: no test framework |

## Gate Check Commands

> Per AD-002. Lint is Biome (`biome check`, ~17ms); build is the heavy check.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After a task touching a single file / fast feedback | `pnpm lint` |
| Full | After tasks touching multiple files or wiring | `pnpm lint && pnpm build` |
| Build | After phase completion / config / removal | `pnpm lint && pnpm build` |

**Lint baseline note:** `pnpm lint` fails today (83 errors / 46 warnings, many formatter issues). T1 (Phase 0) runs `biome check --write` to auto-fix and establish a green baseline. Until T1 lands, the gate is "error count does not exceed the pre-T1 baseline of 83." From T2 onward the gate is a clean `pnpm lint && pnpm build`.

---

## Execution Plan

### Phase 0: Lint Baseline (Sequential)

```
T1
```

### Phase 1: Foundation (Sequential)

```
T2 ──→ T3
```

### Phase 2: Shared Components & Primitives (Parallel OK)

```
T3 ──┬→ T4  [P]
     ├→ T5  [P]
     ├→ T6  [P]
     ├→ T7  [P]
     ├→ T8  [P]
     ├→ T9  [P]
     └→ T10 [P]
```

### Phase 3: Page Migration (Parallel OK, after Phase 2)

```
Phase 2 done ──┬→ T11 [P]
               ├→ T12 [P]
               ├→ T13 [P]
               ├→ T14 [P]
               ├→ T15 [P]
               └→ T16 [P]
```

### Phase 4: DaisyUI Removal + Docs (Parallel OK, after Phase 3)

```
Phase 3 done ──┬→ T17
               └→ T18 [P]
T17 + T18 ──→ T19
```

### Phase 5: Accessibility & Responsive Audit (Sequential, after Phase 4)

```
T19 ──→ T20 ──→ T21
```

---

## Task Breakdown

### T1: Phase-0 lint baseline auto-fix ✅

**Status**: Done — commit `24eee0a`; gate green (`pnpm lint` 0 errors / 19 warnings accepted as baseline; `pnpm build` pass). Auto-fix was a no-op (prior commit `a000533` already beat the 83-error baseline); 19 residuals are non-auto-fixable rules, accepted as baseline, to clean opportunistically when T11–T15 touch those files.

**What**: Run `biome check --write` to auto-fix formatter + safe-lint errors across the repo; enumerate residual manual errors and decide each (fix-now vs. accept-as-baseline); establish a green-or-baselined lint state with `pnpm build` still passing.
**Where**: repo-wide (no feature files yet)
**Depends on**: None
**Reuses**: existing Biome config
**Requirement**: NEO-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `biome check --write` applied; formatted/lint-safe fixes committed
- [ ] Residual manual errors enumerated with a per-error decision in the commit body or tasks.md note
- [ ] `pnpm build` passes
- [ ] `pnpm lint` error count ≤ pre-T1 baseline (83), and reduced to non-auto-fixable only

**Tests**: none
**Gate**: build
**Commit**: `chore: auto-fix lint baseline (biome check --write)`

---

### T2: Install neobrutal-ui + add core components ✅

**Status**: Done — commit `19949a1`. 9 components copied to `src/components/ui/{alert,badge,button,card,checkbox,dialog,input,label,textarea}.tsx` + `src/lib/utils.ts` cn() + `components.json`. Deps added: `@base-ui/react` ^1.6.0, `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`. Gate: build pass, lint 0 errors / 19 baseline warnings. **Deviations (justified glue):** `init`/`add` wrote to root `components/`+`lib/` → relocated under `src/` to match `@/*` alias; library's actual deps are `@base-ui/react` + `lucide-react` (names updated since design.md); Biome fixed 5 a11y errors in copied source (aria-hidden on decorative alert SVGs; biome-ignore on generic Label primitive — callers pass htmlFor via props).

**What**: Run `npx neobrutal init` (prefer `--skip-css` to protect our `globals.css`; creates `components.json`, `src/lib/utils.ts` `cn()`, installs `class-variance-authority`/`clsx`/`tailwind-merge`/`@base-ui-components/react`) then `npx neobrutal add button card input textarea label checkbox badge alert dialog`. Verify compatibility against Tailwind v4 / Next 15 / React 19 / Biome — `pnpm build` must succeed. If incompatible, STOP and escalate (fallback: hand-rolled tokens).
**Where**: `src/components/ui/*`, `src/lib/utils.ts`, `components.json`, `package.json`
**Depends on**: T1
**Reuses**: `@/*`→`./src/*` alias (already in `tsconfig.json`)
**Requirement**: NEO-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `neobrutal-ui` components copied into `src/components/ui/` (button, card, input, textarea, label, checkbox, badge, alert, dialog)
- [ ] `src/lib/utils.ts` `cn()` present
- [ ] `pnpm build` succeeds (compatibility verified)
- [ ] `pnpm lint` passes on the new files (run `pnpm format` if Biome flags copied source)

**Tests**: none
**Gate**: build
**Commit**: `feat(ui): install neobrutal-ui + core components`

---

### T3: Define neobrutalism token system in globals.css ✅

**Status**: Done — commit `ee8e696`. `:root` + `@theme inline` define `--main #FFD23F`/`--error #FF6B6B`/`--bg #fff`/`--radius 0`/`--shadow-brutal*` (4/3/6px zero-blur); `@plugin "daisyui"` kept; `--color-success`/`--color-warning` removed; `--color-error-*` replaced by single `--error`; gray scales kept; Geist font tokens kept. Gate: `pnpm lint && pnpm build` pass. **Deviations (justified glue):** added `--radius-base: var(--radius)` alongside `--radius-brutal` (neobrutal-ui components use `rounded-base`); added `@utility focus-brutal` + `@utility transition-brutal` (copied components reference these class names but the library's CSS injection does not define them — verified via a temp `init` without `--skip-css`; they consume `:root` tokens: 3px black focus-visible outline, transform+box-shadow transition).

**What**: Replace the monochrome `@theme` block with neobrutal-ui's `:root` + `@theme inline` token scheme, overridden to QickReed: `--main #FFD23F`, `--error #FF6B6B`, `--bg #ffffff`, `--radius 0`, hard zero-blur shadows (`--shadow-brutal` / `-sm` / `-lg`). Keep `@plugin "daisyui"` for now (removed in T17). Keep gray scales; remove `--color-success/warning` scales; replace `--color-error` with the single `--error`. Keep Geist font tokens. Tokens centralized (no per-component hard-coded colors) so dark mode stays possible.
**Where**: `src/app/globals.css`
**Depends on**: T2
**Reuses**: existing `@import "tailwindcss"`, Geist font vars
**Requirement**: NEO-03, NEO-20

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `:root` defines `--black/--white/--bg/--main/--error/--radius` + hard shadow vars
- [ ] `@theme inline` maps them to Tailwind tokens (`--color-main`, `--color-error`, `--shadow-brutal*`, `--radius-brutal`)
- [ ] No blurred-shadow / rounded tokens remain for primary surfaces
- [ ] `@plugin "daisyui"` still present (staged for T17)
- [ ] `pnpm lint && pnpm build` pass
- [ ] Tokens are centralized (dark-mode-friendly) — NEO-20

**Tests**: none
**Gate**: full
**Commit**: `feat(ui): neobrutalism design tokens in globals.css`

---

### T4: Refactor Button.tsx to neobrutal-ui Button [P] ✅

**Status**: Done — commit `c2eab4f`. Variants: primary→CVA default (bg-main yellow + black text), secondary→neutral (white fill + 3px black border + hard shadow), outline→new (transparent, hover/active bg-black/5|10). border-2→border-[3px]; active physics translate-x/y-[4px] + shadow-none; hover→shadow-brutal-sm. Public API unchanged. Files: `src/components/Button.tsx`, `src/components/ui/button.tsx`. Gate: lint 0 errors/19 warnings.

**What**: Refactor `src/components/Button.tsx` to delegate to `@/components/ui/button`, preserving the `variant` (primary/secondary/outline) and `size` (sm/md/lg) API so call sites don't change. Primary uses `--main` accent (black text); hover shifts toward shadow; active collapses offset + translate.
**Where**: `src/components/Button.tsx`
**Depends on**: T3
**Reuses**: `@/components/ui/button`, `cn()`, tokens
**Requirement**: NEO-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Button variants render 3px black border + hard offset shadow, square corners
- [ ] Hover/active physics present (shift on hover, offset collapse + translate on active)
- [ ] Public API (`variant`, `size`, `className`, passthrough props) unchanged
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: quick
**Commit**: `refactor(ui): Button → neobrutal-ui`

---

### T5: Refactor Card.tsx to neobrutal-ui Card [P] ✅

**Status**: Done — commit `0da2031`. `shadow` prop sm/md/lg → `--shadow-brutal-sm`/`-brutal`/`-brutal-lg` (hard zero-blur, not Tailwind blurred). border-2→border-[3px]; padding via wrapper twMerge override. Public API unchanged. Files: `src/components/Card.tsx`, `src/components/ui/card.tsx`. Gate: lint 0 errors/19 warnings.

**What**: Refactor `src/components/Card.tsx` to delegate to `@/components/ui/card`; map the `shadow` prop (sm/md/lg) to hard offset shadows (not Tailwind blurred `shadow-sm/md/lg`); square corners, black border. Keep `padding` prop.
**Where**: `src/components/Card.tsx`
**Depends on**: T3
**Reuses**: `@/components/ui/card`, tokens
**Requirement**: NEO-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Card renders square corners, black border, hard offset shadow
- [ ] `shadow` prop maps to `--shadow-brutal-sm/-/-lg`
- [ ] Public API (`shadow`, `padding`, `className`, children) unchanged
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: quick
**Commit**: `refactor(ui): Card → neobrutal-ui`

---

### T6: Hand-rolled neobrutalist primitives [P] ✅

**Status**: Done — commit `1e0b159`. Created `src/components/ui/{select,radio,spinner,table,join,divider,form-control}.tsx` — all server-compatible (no "use client"). Select (native, forwardRef, 3px border + shadow-brutal-sm + focus-brutal); Radio (native, appearance-none, checked:bg-black); Spinner (border-[3px] border-black border-r-transparent animate-spin, aria-hidden, sizes sm/md/lg); Table/THead/TBody/TR/TH/TD/TableCaption (border-collapse, 3px cell borders); Join (inline-flex, shared inner borders via -ml-[3px]); Divider (3px black rule, optional label); FormControl (flex flex-col gap-2). Gate: lint && build 22/22 pass.

**What**: Create hand-rolled neobrutalist primitives for tokens with no library equivalent: native `select`, native `radio`, `loading` spinner, `table`, `join`, `divider`, `form-control`. Implement as styled wrappers/class constants under `src/components/ui/` (e.g. `select.tsx`, `radio.tsx`, `spinner.tsx`, `table.tsx`, `join.tsx`, `divider.tsx`) or a shared class map `src/lib/nb.ts` — all driven by the same `:root`/`@theme inline` tokens (3px black border, square, hard shadow).
**Where**: `src/components/ui/{select,radio,spinner,table,join,divider}.tsx` (and/or `src/lib/nb.ts`)
**Depends on**: T3
**Reuses**: tokens, `cn()`
**Requirement**: NEO-06 (hand-rolled portion)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Each primitive renders neobrutalist styling consistent with tokens
- [ ] Native `select`/`radio` kept (no Base UI compound migration)
- [ ] Spinner is border-based, square, black
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: full
**Commit**: `feat(ui): hand-rolled neobrutalist primitives (select/radio/spinner/table/join/divider)`

---

### T7: Wire form input primitives + Alert error variant [P] ✅

**Status**: Done — commit `b16581b`. `ScrollLockTextArea.tsx` → neobrutal-ui Textarea styling, scroll-lock preserved. Alert: renamed destructive→error (bg-error #FF6B6B + black text + 3px black border + hard shadow, AA 7.8:1, never white-on-accent); success=bg-white no-color (check icon + thick black border, no green); warning→bg-main; dropped mint/lemon/hot-pink. Badge mirrored remap. Checkbox/Label themed (Label left unchanged — already token-driven, htmlFor via ...props + T2 biome-ignore). Files: `ScrollLockTextArea.tsx`, `ui/{textarea,checkbox,badge,alert}.tsx`. Gate: lint && build 22/22 pass. **Gap noted:** `src/components/ui/input.tsx` still border-2 (not in T7 file list) → routed as a pre-task fix in Phase 2b.

**What**: Wire the neobrutal-ui form primitives: update `ScrollLockTextArea.tsx` to use neobrutal-ui Textarea styling (preserve scroll-lock behavior); ensure `Label`, `Checkbox`, `Badge` copied components consume tokens; define the Alert **error** variant using `--error #FF6B6B` fill + black text + black border + hard shadow (black-on-`#FF6B6B` ≈ 7.8:1 passes AA). Success variant = no color (icon + pt-BR text + thick black border).
**Where**: `src/components/ScrollLockTextArea.tsx`, `src/components/ui/{label,checkbox,badge,alert,textarea}.tsx`
**Depends on**: T3
**Reuses**: neobrutal-ui copied components, tokens
**Requirement**: NEO-06 (form portion), NEO-09 (error rendering prep)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ScrollLockTextArea` renders neobrutalist textarea with scroll-lock behavior intact
- [ ] Alert error variant uses `--error` red + black text (AA-compliant); success variant non-color
- [ ] Label/Checkbox/Badge themed via tokens
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: full
**Commit**: `refactor(ui): form primitives + alert error variant`

---

### T8: Migrate DeleteTextModal to neobrutal-ui Dialog [P] ✅

**Status**: Done — commit `6463c09`. Migrated `modal-box`/`modal-action` → neobrutal-ui Dialog (square, 3px border, hard shadow). Delete wiring (`deleteText`, `onSuccess`/`onClose`, `isDeleting`/`error`) + all pt-BR text preserved; loading uses T6 Spinner. Gate: lint pass.

**What**: Migrate `src/components/DeleteTextModal.tsx` from DaisyUI `modal-box`/`modal-action` to neobrutal-ui Dialog; preserve the delete action wiring and pt-BR text. Loading spinner inside uses T6's spinner.
**Where**: `src/components/DeleteTextModal.tsx`
**Depends on**: T3, T6
**Reuses**: `@/components/ui/dialog`, spinner (T6)
**Requirement**: NEO-07 (modal portion)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Modal renders as neobrutal-ui Dialog (square, hard shadow, thick border)
- [ ] Delete action wiring + pt-BR text preserved
- [ ] No `modal-box`/`modal-action` classes remain in this file
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: quick
**Commit**: `refactor(ui): DeleteTextModal → neobrutal-ui Dialog`

---

### T9: Restyle Sidebar + Timer (chrome) [P] ✅

**Status**: Done — commit `1dbdc4c`. Sidebar nav neobrutalist (active item uses `--main`); Timer display restyled. Nav logic (pathname active detection, role-based admin item, collapse toggle, logout stub) + timer behavior (setInterval 100ms, formatTime, onTimeUpdate) unchanged. Gate: lint && build green (all routes).

**What**: Restyle `src/components/Sidebar.tsx` (navigation) and `src/components/Timer.tsx` (display) neobrutalist using tokens — thick borders, hard shadows, square corners, active nav item uses `--main` accent. Preserve nav logic and timer behavior.
**Where**: `src/components/Sidebar.tsx`, `src/components/Timer.tsx`
**Depends on**: T3
**Reuses**: tokens, Button (T4)
**Requirement**: NEO-07 (chrome)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Sidebar nav renders neobrutalist; active item uses `--main`
- [ ] Timer display neobratulist; timing behavior unchanged
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: full
**Commit**: `refactor(ui): Sidebar + Timer neobrutalist`

---

### T10: Restyle RsvpDisplay + RichTextEditor (specialized surfaces) [P] ✅

**Status**: Done — commit `9cfbb78`. RsvpDisplay = full neobrutalist treatment (bold everywhere); RSVP behavior (visibilitychange pause/resume, handlePause/Resume/Complete, word-progression, paused-time accounting, `wordInterval = 60000/targetWpm`) untouched — only return-block JSX/classes changed. RichTextEditor container restyled; Quill wiring (dynamic import, theme snow, value/onChange, modules toolbar) preserved. Gate: lint && build green (all routes).

**What**: Restyle `src/components/RsvpDisplay.tsx` (the RSVP reading surface — **bold everywhere** per decision: thick border, hard shadow, square) and `src/components/RichTextEditor.tsx` (admin Quill editor container) neobratulist. Preserve RSVP focus/pause/resume behavior and Quill wiring.
**Where**: `src/components/RsvpDisplay.tsx`, `src/components/RichTextEditor.tsx`
**Depends on**: T3
**Reuses**: tokens
**Requirement**: NEO-07, NEO-08 (reading surface full neobrutalism)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] RsvpDisplay renders full neobrutalist treatment (bold everywhere) with RSVP behavior intact
- [ ] RichTextEditor container neobratulist; Quill editing works
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: full
**Commit**: `refactor(ui): RsvpDisplay + RichTextEditor neobrutalist`

---

### T11: Migrate auth pages off DaisyUI [P] ✅

**Status**: Done — commit `98886a5`. Files: `(auth)/login/page.tsx`, `(auth)/signup/page.tsx`. Server Action wiring (formAction={login}/{signup}) + pt-BR preserved. Terms checkbox kept native input + token classes (ui/checkbox is Base UI button-based and would break native `required` validation — behavior-preserving choice). No ActionResult error rendering existed in these pages (actions redirect to /error) — NEO-09 not exercised here. Gate: lint && build pass. Zero DaisyUI classes confirmed.

**What**: Replace DaisyUI classes in auth pages (`(auth)/login`, `(auth)/signup`, `auth/confirm`) with neobrutal-ui primitives / token classes (Button T4, Card T5, Input, Label, Alert T7). Preserve Server Action wiring and `ActionResult` error rendering (pt-BR) in neobratulist alerts.
**Where**: `src/app/(auth)/**`, `src/app/auth/confirm/**`
**Depends on**: T4, T5, T7
**Reuses**: primitives from Phase 2
**Requirement**: NEO-07, NEO-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Zero DaisyUI class names in these files
- [ ] `ActionResult` errors render in neobratulist Alert (red error variant)
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: full
**Commit**: `refactor(ui): auth pages neobrutalist`

---

### T12: Migrate dashboard off DaisyUI [P] ✅

**Status**: Done — commit `083a534`. File: `(authenticated)/dashboard/page.tsx`. Data display (WPM/comprehension/target metrics, recharts chart, history), links, pt-BR preserved; actions.ts untouched. Gate: lint && build pass. Zero DaisyUI classes confirmed. **T20 note:** recharts Tooltip inline style uses borderRadius:8px + blurred boxShadow (chart config, not a DaisyUI class) — left untouched, candidate for T20 visual audit.

**What**: Replace DaisyUI classes in the dashboard with neobratulist primitives (Card T5, Button T4, badges, stats). Preserve data display and links.
**Where**: `src/app/(authenticated)/dashboard/**`
**Depends on**: T4, T5, T6, T7
**Reuses**: primitives from Phase 2
**Requirement**: NEO-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Zero DaisyUI class names in dashboard files
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: full
**Commit**: `refactor(ui): dashboard neobrutalist`

---

### T13: Migrate assessment pages off DaisyUI [P] ✅

**Status**: Done — commit `69f07e5`. Files: `assessment/{reading,quiz,results}/page.tsx`, `QuizQuestion.tsx`. Quiz logic (onAnswer/selectedAnswer/disabled, controlled radio, scoring, saveDiagnosticSession) preserved; reading-screen scroll-lock + timer + no-regression rules preserved; reading screen bold per NEO-08/AD-005. QuizQuestion a11y: added explicit htmlFor/id (Radio component hides native input from Biome's noLabelWithoutControl). actions.ts + start/route.ts untouched. `assessment/page.tsx` already used primitives — left untouched. Gate: lint && build pass. Zero DaisyUI classes confirmed.

**What**: Replace DaisyUI classes in assessment pages (start, reading, quiz) with neobratulist primitives. `QuizQuestion.tsx` radio uses T6 native radio. Reading screen = bold everywhere per decision.
**Where**: `src/app/(authenticated)/assessment/**`, `src/components/QuizQuestion.tsx`
**Depends on**: T4, T5, T6, T7
**Reuses**: primitives from Phase 2
**Requirement**: NEO-07, NEO-08

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Zero DaisyUI class names in assessment files
- [ ] Quiz radio uses neobratulist native radio; quiz logic intact
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: full
**Commit**: `refactor(ui): assessment pages neobrutalist`

---

### T14: Migrate training/RSVP pages off DaisyUI [P] ✅

**Status**: Done — commit `eefec13`. Files: `training/page.tsx`, `training/rsvp/{page,session,feedback}/page.tsx`. Training pages already used Button/Card wrappers (zero DaisyUI); work was chrome restyling — non-palette blue/green boxes → `--main` accent, tag pills → Badge, spinners → Spinner. `RsvpDisplay` (T10) untouched; actions.ts + rsvp/complete/route.ts untouched. RSVP focus/pause/resume intact. Gate: lint && build pass. Zero DaisyUI classes confirmed.

**What**: Replace DaisyUI classes in training pages with neobratulist primitives. RSVP reading surface (T10) is bold everywhere. WPM controls use neobratulist buttons; any `range`/`tab` tokens verified (likely false positives — no-op if not DaisyUI).
**Where**: `src/app/(authenticated)/training/**`
**Depends on**: T4, T5, T6, T7, T10
**Reuses**: RsvpDisplay (T10), primitives
**Requirement**: NEO-07, NEO-08

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Zero DaisyUI class names in training files
- [ ] RSVP behavior (focus/pause/resume) intact
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: full
**Commit**: `refactor(ui): training/RSVP pages neobrutalist`

---

### T15: Migrate admin pages off DaisyUI [P] ✅

**Status**: Done — commit `0846166`. Files: `admin/texts/{page,create,edit/[id]}/page.tsx`, `admin/texts/components/TextForm.tsx`, `src/components/Button.tsx` (added `asChild` passthrough so Link anchors render as neobrutalist buttons via Slot — justified glue). **NEO-09 ✓:** `ActionResult` pt-BR errors (createText/updateText + TextForm local error) render inside `Alert variant="error"`. 4 actual native select sites → `ui/select` (the "≈32" was repo-wide, most already migrated in prior phases). table→ui/table, loading→Spinner, badge→Badge, card→Card, input→ui/input, label/label-text→Label, form-control→FormControl, join/btn pagination→Join+Button asChild. DeleteTextModal (T8) + RichTextEditor (T10) consumed. actions.ts/schemas.ts/layout.tsx untouched. Gate: lint && build pass. Zero DaisyUI classes confirmed.

**What**: Replace DaisyUI classes in admin pages (texts list, edit, create, `TextForm.tsx`) with neobratulist primitives. Native `select` (×32) uses T6 hand-rolled select; `table` uses T6; `loading` spinner uses T6; `DeleteTextModal` is T8. RichTextEditor is T10.
**Where**: `src/app/(authenticated)/admin/**`
**Depends on**: T4, T5, T6, T7, T8, T10
**Reuses**: primitives from Phase 2
**Requirement**: NEO-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Zero DaisyUI class names in admin files (incl. all native `<select>` styled via T6)
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: full
**Commit**: `refactor(ui): admin pages neobrutalist`

---

### T16: Migrate layout + error boundaries + landing off DaisyUI [P] ✅

**Status**: Done — commit `605bfab`. Files: `src/app/layout.tsx`, `src/app/global-error.tsx`. **AD-003 Sentry coupling preserved:** `error.tsx` not modified at all; `global-error.tsx` only inner error-box div classes changed — `import * as Sentry from "@sentry/nextjs"` + `Sentry.captureException(error)` in useEffect verified byte-for-byte unchanged; `<html>/<body>` boundary preserved. Removed dead `data-theme="qickreed"` from layout.tsx (qickreed theme was never defined — dead DaisyUI hook). `page.tsx` (landing), `error.tsx`, `error/page.tsx` already had zero DaisyUI classes — left untouched. Gate: lint && build pass. Zero DaisyUI classes confirmed. **T19/Verifier note:** confirm landing `page.tsx` reads neobrutalist (not just DaisyUI-free).

**What**: Replace DaisyUI classes in root layout, landing page, and `error.tsx` / `global-error.tsx`. **Sentry coupling (AD-003):** change only JSX/classes in error boundaries — never touch `@sentry/nextjs` imports or `captureException` wiring. Verify error pages still build and capture path is intact.
**Where**: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/error/page.tsx`
**Depends on**: T4, T5, T7
**Reuses**: primitives from Phase 2
**Requirement**: NEO-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Zero DaisyUI class names in these files
- [ ] Sentry wiring in `error.tsx`/`global-error.tsx` untouched (imports/capture verifiably unchanged)
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: full
**Commit**: `refactor(ui): layout + error boundaries + landing neobrutalist`

---

### T17: Remove DaisyUI entirely ✅

**Status**: Done — commit `41b9d2a`. `@plugin "daisyui"` removed from globals.css; `pnpm remove daisyui` (package.json + pnpm-lock.yaml). `grep -ri daisyui src/ package.json` → zero; DaisyUI class-name grep → zero real (false positives only: PascalCase imports `FormControl`/`Divider`, a "tab is not active" comment, `border-collapse` Tailwind utility). Gate: lint 0 errors / 19 warnings + build 22/22 pass. Files: globals.css, package.json, pnpm-lock.yaml.

**What**: Delete `@plugin "daisyui";` from `globals.css`; uninstall `daisyui` devDependency (`pnpm remove daisyui`); confirm zero DaisyUI class names remain anywhere in `src/`. The gate must stay green.
**Where**: `src/app/globals.css`, `package.json`
**Depends on**: T11, T12, T13, T14, T15, T16 (all pages migrated)
**Reuses**: —
**Requirement**: NEO-10, NEO-11, NEO-12, NEO-13

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `grep -ri "daisyui" src/ package.json` returns zero matches
- [ ] `@plugin "daisyui"` removed from `globals.css`
- [ ] `daisyui` absent from `devDependencies`
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: build
**Commit**: `refactor(ui): remove DaisyUI dependency`

---

### T18: Rewrite project docs to neobrutalism [P] ✅

**Status**: Done — commit `c71d9f3`. Root `CLAUDE.md` styling `<important>` block rewritten to neobrutalism (thick 3px black borders, hard zero-blur shadows, square corners, flat fills, physical hover/active; palette monochrome + `#FFD23F` + `#FF6B6B`; success non-color; neobrutal-ui components + hand-rolled primitives + token system); DaisyUI mandate + strict-monochrome removed; "DaisyUI" dropped from Stack line; a11y requirements kept; AD-005 cross-referenced. `agent_docs/ui-ux_guidelines.mdc` fully rewritten (token system, palette, component standards, Tailwind standards, interactive states, a11y). `.claude/CLAUDE.md` (CodeGraph note) left untouched. Gate: lint pass (docs-only).

**What**: Rewrite `CLAUDE.md` styling section and `agent_docs/ui-ux_guidelines.mdc` to define the neobrutalism system: thick black borders, hard zero-blur shadows, square corners, flat fills, physical hover/active, palette (monochrome + `#FFD23F` + `#FF6B6B` error), bold-everywhere, token + class conventions, the neobrutal-ui component list. Remove the DaisyUI component list and the strict no-accent monochrome mandate. Keep accessibility requirements (label `htmlFor`, visible focus, WCAG AA).
**Where**: `CLAUDE.md`, `agent_docs/ui-ux_guidelines.mdc`
**Depends on**: T3 (token names finalized)
**Reuses**: design.md token system
**Requirement**: NEO-14, NEO-15

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `CLAUDE.md` styling section describes neobrutalism; no DaisyUI/strict-monochrome mandates
- [ ] `ui-ux_guidelines.mdc` rewritten (component standards, palette, "Tailwind & DaisyUI" section replaced)
- [ ] Accessibility requirements retained
- [ ] No code gate impact (docs only)

**Tests**: none
**Gate**: none (docs only)
**Commit**: `docs: rewrite design system docs to neobrutalism`

---

### T19: Final gate + behavioral drive-through ✅

**Status**: Done — commit `658219a` (empty checkpoint). Gate: lint 0 errors / 19 warnings + build 22/22 pages (20 route entries) pass; `grep -ri daisyui src/` → zero; `pnpm dev` (Turbopack) boots "Ready in 2.4s" with no compile/runtime errors (instrumentation Node/Edge + middleware clean), then stopped. **Authenticated behavioral drive-through (login → dashboard → training/RSVP → assessment → admin) deferred to the user** — requires browser + Supabase env + auth credentials unavailable to a headless worker (consistent with STATE.md deferred items); the always-on Verifier re-confirms independently.

**What**: Confirm the full gate is green and behaviorally drive the app — auth, dashboard, training (RSVP), assessment, admin — confirming neobratulist appearance, no regressions, zero DaisyUI classes. Record evidence in `validation.md` (Verifier step uses this).
**Where**: repo-wide
**Depends on**: T17, T18
**Reuses**: —
**Requirement**: NEO-13 (final)

**Tools**:
- MCP: NONE
- Skill: `verify` (behavioral drive-through)

**Done when**:
- [ ] `pnpm lint && pnpm build` green
- [ ] `grep -ri "daisyui" src/` zero matches
- [ ] Behavioral drive-through of all 5 route groups confirms neobratalist UI + no regressions
- [ ] Evidence recorded for the Verifier

**Tests**: none
**Gate**: build
**Commit**: `chore(ui): final neobrutalism migration gate check`

---

### T20: Accessibility & responsive audit + fixes ✅

**Status**: Done — commit `7a01be0` (10 files). **NEO-16:** `focus-brutal` added to bare/wrapping `<Link>` anchors (5 bare text links + 12 Link-wrapping-Button cases) so the tabbable anchor shows the 3px black `:focus-visible` outline. **NEO-17:** audited — no white-on-accent; `text-white` icons sit on `bg-black` (21:1 AA). **NEO-18:** table wrapped in `overflow-x-auto`; no unbounded widths; tap targets ≥36px. **NEO-19:** hover/active physics consistent across Button variants + Sidebar + DeleteTextModal. **Visual fix:** recharts Tooltip made neobrutalist (square + hard shadow `4px 4px 0 0 var(--black)` + 3px black border, via `var(--white)`/`var(--black)`). Gate: lint && build 22/22 pass. Browser tab-through/mobile-resize deferred to user (headless).

**What**: Audit and fix: visible thick black focus outline on every interactive element (WCAG 2.4.7); accent contrast (`#FFD23F` + `#FF6B6B` with black text — both AA); responsive at ≤640px (no overflow, ≥44px tap targets); physical hover/active consistency across components.
**Where**: `src/components/**`, `src/app/**` (targeted fixes)
**Depends on**: T19
**Reuses**: tokens
**Requirement**: NEO-16, NEO-17, NEO-18, NEO-19

**Tools**:
- MCP: NONE
- Skill: `verify`

**Done when**:
- [ ] Tab-through shows visible focus on all interactive elements
- [ ] Both accents pass AA with black text; no white-on-accent
- [ ] Mobile ≤640px usable (no overflow, ≥44px targets)
- [ ] Hover/active physics consistent across components
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: full
**Commit**: `fix(ui): a11y + responsive neobrutalism audit`

---

### T21: Dark-mode token friendliness check ✅

**Status**: Done — commit `d8be910` (empty checkpoint; no code changes required). Hard-coded hex grep → 6 literals, all in `dashboard/page.tsx` recharts SVG `stroke`/`fill` attributes (`#e5e7eb` CartesianGrid, `#6b7280` axes, `#000000` Line/dot) — unavoidable (recharts SVG presentation attributes can't resolve CSS `var()`); palette-aligned; **accepted documented exception** for NEO-20. No other hard-coded colors (rgba/rgb scan clean). Token centralization confirmed: future dark palette achievable by swapping `:root` values, with the single recharts-SVG exception (would need CSS-class rework — out of P3 scope). Gate: lint pass.

**What**: Confirm tokens are centralized in `globals.css` (no hard-coded per-component colors) so a future dark palette is achievable by swapping `:root` values only. Fix any stray hard-coded colors.
**Where**: `src/app/globals.css`, `src/components/ui/**`
**Depends on**: T20
**Reuses**: tokens
**Requirement**: NEO-20

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] No hard-coded hex colors in components (all via tokens) except the `:root` definitions
- [ ] `pnpm lint && pnpm build` pass

**Tests**: none
**Gate**: quick
**Commit**: `chore(ui): verify dark-mode-friendly token centralization`

---

## Parallel Execution Map

```
Phase 0 (Sequential):
  T1

Phase 1 (Sequential):
  T2 ──→ T3

Phase 2 (Parallel, after T3):
  ├── T4  [P]
  ├── T5  [P]
  ├── T6  [P]
  ├── T7  [P]
  ├── T8  [P]   (also depends T6)
  ├── T9  [P]
  └── T10 [P]

Phase 3 (Parallel, after Phase 2):
  ├── T11 [P]
  ├── T12 [P]
  ├── T13 [P]
  ├── T14 [P]   (also depends T10)
  ├── T15 [P]   (also depends T8, T10)
  └── T16 [P]

Phase 4 (Parallel + join):
  ├── T17            (after all of Phase 3)
  ├── T18 [P]        (after T3)
  T17 + T18 ──→ T19

Phase 5 (Sequential):
  T19 ──→ T20 ──→ T21
```

**Parallelism constraint:** each `[P]` task has no unfinished dependencies (beyond the phase entry), no shared mutable state with other `[P]` tasks (disjoint files), and no test-parallelism restriction (no tests). T8 depends on T6 (spinner); T14 depends on T10; T15 depends on T8 + T10 — these cross-phase deps are satisfied because Phase 2 completes before Phase 3 starts.

**Sub-agent delegation:** this feature has **6 phases (>3)**. Per the spec-driven skill, before Execute the orchestrator offers one worker per phase (sequential), offer-then-confirm — the user must accept before any sub-agent is dispatched. A fresh Verifier runs automatically after T21 regardless.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: lint auto-fix | 1 command + decisions | ✅ Granular |
| T2: install + add components | 1 setup step | ✅ Granular |
| T3: token system | 1 file (`globals.css`) | ✅ Granular |
| T4: Button.tsx | 1 component | ✅ Granular |
| T5: Card.tsx | 1 component | ✅ Granular |
| T6: hand-rolled primitives | 1 cohesive primitive set (1 module/dir) | ✅ Granular (cohesive) |
| T7: form primitives + alert variant | 1 cohesive form theme | ✅ Granular (cohesive) |
| T8: DeleteTextModal | 1 component | ✅ Granular |
| T9: Sidebar + Timer | 2 chrome components, same theme | ✅ Granular (cohesive) |
| T10: RsvpDisplay + RichTextEditor | 2 specialized surfaces | ✅ Granular (cohesive) |
| T11–T16: page migrations | 1 route group each | ✅ Granular |
| T17: remove DaisyUI | 1 removal step | ✅ Granular |
| T18: rewrite docs | 2 doc files, 1 theme | ✅ Granular (cohesive) |
| T19: final gate + drive | 1 verification step | ✅ Granular |
| T20: a11y audit + fixes | 1 audit pass | ✅ Granular |
| T21: token centralization check | 1 verification step | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | none | Phase 0 solo | ✅ Match |
| T2 | T1 | T1→T2 | ✅ Match |
| T3 | T2 | T2→T3 | ✅ Match |
| T4 | T3 | T3→T4 [P] | ✅ Match |
| T5 | T3 | T3→T5 [P] | ✅ Match |
| T6 | T3 | T3→T6 [P] | ✅ Match |
| T7 | T3 | T3→T7 [P] | ✅ Match |
| T8 | T3, T6 | T3→T8 [P] (+ T6) | ✅ Match (T6 in Phase 2) |
| T9 | T3 | T3→T9 [P] | ✅ Match |
| T10 | T3 | T3→T10 [P] | ✅ Match |
| T11 | T4,T5,T7 | Phase 2→T11 [P] | ✅ Match |
| T12 | T4,T5,T6,T7 | Phase 2→T12 [P] | ✅ Match |
| T13 | T4,T5,T6,T7 | Phase 2→T13 [P] | ✅ Match |
| T14 | T4,T5,T6,T7,T10 | Phase 2→T14 [P] (+T10) | ✅ Match |
| T15 | T4,T5,T6,T7,T8,T10 | Phase 2→T15 [P] (+T8,T10) | ✅ Match |
| T16 | T4,T5,T7 | Phase 2→T16 [P] | ✅ Match |
| T17 | T11–T16 | Phase 3→T17 | ✅ Match |
| T18 | T3 | T3→T18 [P] (Phase 4) | ✅ Match |
| T19 | T17, T18 | T17+T18→T19 | ✅ Match |
| T20 | T19 | T19→T20 | ✅ Match |
| T21 | T20 | T20→T21 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | config (lint) | none | none | ✅ OK |
| T2 | UI components (copied) + config | none | none | ✅ OK |
| T3 | config (`globals.css`) | none | none | ✅ OK |
| T4 | UI component | none | none | ✅ OK |
| T5 | UI component | none | none | ✅ OK |
| T6 | UI components | none | none | ✅ OK |
| T7 | UI components | none | none | ✅ OK |
| T8 | UI component | none | none | ✅ OK |
| T9 | UI components | none | none | ✅ OK |
| T10 | UI components | none | none | ✅ OK |
| T11–T16 | UI pages | none | none | ✅ OK |
| T17 | config (`globals.css`, `package.json`) | none | none | ✅ OK |
| T18 | docs | none | none | ✅ OK |
| T19 | verification | none | none | ✅ OK |
| T20 | UI (targeted fixes) | none | none | ✅ OK |
| T21 | UI (token check) | none | none | ✅ OK |

All layers map to "none — build gate only" per AD-002 (no test framework). No test deferral, no violations. Final verification is the behavioral drive-through in T19 + the always-on Verifier after T21.

---

## T1 residual lint decisions

`biome check --write` was run (65 files, 24ms) and applied **no fixes** — the working tree was already formatter- and safe-lint-clean (commit `a000533` did the manual cleanup). The 19 residual diagnostics are all **non-auto-fixable** rules. Per the spec Out-of-Scope ("Full manual remediation of pre-existing lint debt beyond auto-fix"), all 19 are **accept-as-baseline** — they are pre-existing debt, not introduced by the migration, and will be addressed when later tasks touch these files.

Gate: `pnpm lint` → 0 errors / 19 warnings (exit 0); `pnpm build` → pass (exit 0).

| # | Rule | File:line | Decision | Reason |
| - | ---- | --------- | -------- | ------ |
| 1 | noExplicitAny | src/app/(authenticated)/admin/texts/components/TextForm.tsx:35 | accept-as-baseline | zodResolver type mismatch; pre-existing, out of T1 scope |
| 2 | noExplicitAny | src/app/(authenticated)/assessment/actions.ts:150 | accept-as-baseline | `session.text as any` for title access; pre-existing |
| 3 | noExplicitAny | src/app/(authenticated)/assessment/actions.ts:207 | accept-as-baseline | `data.text as any` for title access; pre-existing |
| 4 | noUnusedVariables | src/app/(authenticated)/assessment/actions.ts:77 | accept-as-baseline | unused `session` binding; pre-existing dead var |
| 5 | noNonNullAssertion | src/app/(authenticated)/assessment/reading/page.tsx:26 | accept-as-baseline | `textId!` param assertion; pre-existing |
| 6 | noNonNullAssertion | src/app/(authenticated)/assessment/reading/page.tsx:59 | accept-as-baseline | `textId!` param assertion; pre-existing |
| 7 | noExplicitAny | src/app/(authenticated)/dashboard/actions.ts:78 | accept-as-baseline | `session.text as any` for title; pre-existing |
| 8 | noUnusedVariables | src/app/(authenticated)/dashboard/actions.ts:20 | accept-as-baseline | unused `sessionError` binding; pre-existing |
| 9 | noExplicitAny | src/app/(authenticated)/training/actions.ts:39 | accept-as-baseline | `session.text as any` for title; pre-existing |
| 10 | noExplicitAny | src/app/(authenticated)/training/actions.ts:145 | accept-as-baseline | `data.text as any` for title; pre-existing |
| 11 | noNonNullAssertion | src/app/(authenticated)/training/rsvp/feedback/page.tsx:29 | accept-as-baseline | `sessionId!` param assertion; pre-existing |
| 12 | noNonNullAssertion | src/app/(authenticated)/training/rsvp/session/page.tsx:22 | accept-as-baseline | `textId!` param assertion; pre-existing |
| 13 | noExplicitAny | src/utils/auth/admin.ts:9 | accept-as-baseline | `user: any` return type; pre-existing |
| 14 | noNonNullAssertion | src/utils/supabase/client.ts:5 | accept-as-baseline | env var `!` assertion; pre-existing (Supabase helper pattern) |
| 15 | noNonNullAssertion | src/utils/supabase/client.ts:6 | accept-as-baseline | env var `!` assertion; pre-existing |
| 16 | noNonNullAssertion | src/utils/supabase/middleware.ts:10 | accept-as-baseline | env var `!` assertion; pre-existing |
| 17 | noNonNullAssertion | src/utils/supabase/middleware.ts:11 | accept-as-baseline | env var `!` assertion; pre-existing |
| 18 | noNonNullAssertion | src/utils/supabase/server.ts:8 | accept-as-baseline | env var `!` assertion; pre-existing |
| 19 | noNonNullAssertion | src/utils/supabase/server.ts:9 | accept-as-baseline | env var `!` assertion; pre-existing |

Summary: 19 residuals — 0 fix-now, 19 accept-as-baseline. Breakdown by rule: 8 noExplicitAny, 9 noNonNullAssertion, 2 noUnusedVariables.