# Neobrutalism Migration Validation

**Date**: 2026-07-10
**Spec**: `.specs/features/neobrutalism-migration/spec.md`
**Diff range**: `a000533..HEAD` (22 commits: T1→T21)
**Verifier**: independent sub-agent (author ≠ verifier) — fresh, read-only, evidence-or-zero
**Project gate**: `pnpm lint && pnpm build` (AD-002 — no test framework)

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1  | ✅ Done | Phase-0 lint baseline: `biome check --write` no-op (tree already clean at `a000533`); 19 residuals enumerated + decided accept-as-baseline (tasks.md T1 table). Build pass. |
| T2  | ✅ Done | neobrutal-ui CLI run: 16 components in `src/components/ui/`, `src/lib/utils.ts` cn(), `components.json`; deps `@base-ui/react`, `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`. Library path used (fallback NOT triggered). |
| T3  | ✅ Done | Token system in `globals.css` (`:root` + `@theme` + `@theme inline`). Justified glue: `--radius-base`, `@utility focus-brutal` / `transition-brutal`. |
| T4  | ✅ Done | `Button.tsx` → `ui/button.tsx`; variant/size API preserved. ⚠️ outline variant lacks hard shadow + hover/active physics (see NEO-04). |
| T5  | ✅ Done | `Card.tsx` → `ui/card.tsx`; shadow prop → hard offsets; API preserved. |
| T6  | ✅ Done | Hand-rolled `select/radio/spinner/table/join/divider/form-control` — all exist, token-driven, server-compatible. |
| T7  | ✅ Done | Form primitives themed; Alert error=red+black-text, success=no-color. Input 3px border fixed in `ec3aaf8`. |
| T8  | ✅ Done | `DeleteTextModal` → neobrutal-ui Dialog; delete wiring + pt-BR preserved. |
| T9  | ✅ Done | Sidebar + Timer restyled; active nav uses `--main`; nav/timer logic unchanged. |
| T10 | ✅ Done | RsvpDisplay + RichTextEditor full neobrutalist; RSVP behavior (visibilitychange pause, `60000/targetWpm`) intact. |
| T11 | ✅ Done | Auth pages migrated; Server Action wiring + pt-BR preserved. |
| T12 | ✅ Done | Dashboard migrated; recharts Tooltip made neobrutalist in T20. |
| T13 | ✅ Done | Assessment pages migrated; quiz logic + scroll-lock preserved; reading screen bold. |
| T14 | ✅ Done | Training/RSVP pages migrated; non-palette colors → `--main`. |
| T15 | ✅ Done | Admin pages migrated; `ActionResult` pt-BR errors in `Alert variant="error"`; `asChild` passthrough added (justified). |
| T16 | ✅ Done | Layout + global-error restyled; **AD-003 Sentry wiring byte-for-byte unchanged** (error.tsx untouched); dead `data-theme` removed. |
| T17 | ✅ Done | `@plugin "daisyui"` removed; `daisyui` uninstalled; zero DaisyUI refs. |
| T18 | ✅ Done | `CLAUDE.md` + `agent_docs/ui-ux_guidelines.mdc` rewritten; `.claude/CLAUDE.md` untouched. |
| T19 | ✅ Done | Final gate green; `pnpm dev` boots clean. Authenticated behavioral drive deferred to user (headless). |
| T20 | ✅ Done | a11y/responsive audit: focus-brutal on Link anchors; no white-on-accent; `overflow-x-auto` on table; recharts Tooltip neobrutalist. |
| T21 | ✅ Done | Token centralization confirmed; 6 hard-coded hex = recharts SVG exception (documented). |

---

## Spec-Anchored Acceptance Criteria

> **AD-002**: no test framework. Evidence is `file:line` + code/grep/build outcome (not test assertions). Evidence-or-zero: an AC with no located `file:line` counts as NOT covered.

| AC | Spec-defined outcome | `file:line` + code/grep/build evidence | Result |
| -- | -------------------- | ------------------------------------- | ------ |
| NEO-01 | `biome check --write` applied; lint reduced to non-auto-fixable residuals; build passes | `pnpm lint` → 0 errors / 19 warnings (exit 0); 19 residuals enumerated w/ per-error decision in tasks.md T1 table; `pnpm build` exit 0 | ✅ PASS |
| NEO-02 | neobrutal-ui installed + importable; build succeeds (compatibility verified) | `components.json` + `src/lib/utils.ts:1-6` (cn) present; 16 files in `src/components/ui/`; `package.json:13,20,24,34` deps; build 22/22 exit 0 | ✅ PASS |
| NEO-03 | `:root` + `@theme inline` define `--main #FFD23F`, `--error #FF6B6B`, `--bg #fff`, `--radius 0`, hard zero-blur shadows (4/3/6px); no blurred/rounded tokens for primary surfaces | `src/app/globals.css:3-15` (`--main:#ffd23f`, `--error:#ff6b6b`, `--bg:#ffffff`, `--radius:0`, `--shadow-brutal 4px 4px 0 0`, `-sm 3px`, `-lg 6px`); `@theme inline:54-70` maps to Tailwind tokens | ✅ PASS |
| NEO-04 | Button primary/secondary/outline each: 3px black border + hard offset shadow; hover shift; active offset collapse + translate | `src/components/ui/button.tsx:29` base CVA `border-[3px] border-black rounded-base transition-brutal focus-brutal`; `:34` primary `bg-main text-black shadow-brutal hover:translate-x/y-[1px] hover:shadow-brutal-sm active:translate-x/y-[4px] active:shadow-none` ✅; `:37` secondary(neutral) same physics ✅; `:39` outline `bg-transparent text-black hover:bg-black/5 active:bg-black/10` — 3px border ✅ but **NO hard shadow + NO hover/active shift** ⚠️; `src/components/Button.tsx:12-22` API preserved | ⚠️ Spec-precision gap (outline variant) |
| NEO-05 | Card: square corners, black border, hard offset shadow; `shadow` prop → hard offsets (not blurred) | `src/components/ui/card.tsx:6` `rounded-base border-[3px] border-black bg-white text-black`; `:13-17` sm→`shadow-brutal-sm`, md→`shadow-brutal`, lg→`shadow-brutal-lg`; `src/components/Card.tsx:12-22` shadow/padding API preserved | ✅ PASS |
| NEO-06 | input/select/textarea: 3px black border, square, white fill, black text, thick black focus; label/form-control/checkbox/radio/badge/alert/divider/loading/table/join: neobrutalist, library or hand-rolled | `ui/input.tsx:12` (3px border, `focus-brutal`); `ui/textarea.tsx`, `ui/label.tsx`, `ui/checkbox.tsx`, `ui/badge.tsx` (library); hand-rolled `ui/select.tsx:11`, `ui/radio.tsx`, `ui/spinner.tsx`, `ui/table.tsx:11` (3px cell borders), `ui/join.tsx`, `ui/divider.tsx`, `ui/form-control.tsx` — all exist | ✅ PASS |
| NEO-07 | ~22 app TSX pages contain NO DaisyUI component class names | comprehensive grep `src/` for `btn|card|card-body|input-bordered|label-text|form-control|alert-error|modal-box|loading-spinner|select|badge|alert|table|join|divider|...` → **zero real matches**; all hits are false positives: PascalCase imports (`Divider`, `FormControl`, `Alert`, `Badge`, `Select`, `Table`), Supabase `.select()` method calls, `role="alert"` ARIA, `loading` state vars, `border-collapse` Tailwind utility, `type="checkbox"`/`type="radio"` attrs | ✅ PASS |
| NEO-08 | RSVP + assessment reading screens receive FULL neobrutalist treatment (bold everywhere) | `src/components/RsvpDisplay.tsx:132,134,188,211` (`border-[3px] border-black`, `shadow-brutal-lg`, `bg-main`, `rounded-base`); `src/app/(authenticated)/assessment/reading/page.tsx:156` (`border-[3px] border-black rounded-base shadow-brutal-sm`); bold text throughout | ✅ PASS |
| NEO-09 | pt-BR `ActionResult` errors render in neobrutalist `alert` error variant, no regression | `admin/texts/create/page.tsx:54` `<Alert variant="error">`; `admin/texts/edit/[id]/page.tsx:84,102`; `admin/texts/components/TextForm.tsx:84`; `ui/alert.tsx:12` error=`bg-error text-black` | ✅ PASS |
| NEO-10 | `grep -ri daisyui src/ package.json` → zero | `grep -rin daisyui src/ package.json` → **zero matches** | ✅ PASS |
| NEO-11 | `@plugin "daisyui"` gone from globals.css | `grep -n @plugin src/app/globals.css` → no match | ✅ PASS |
| NEO-12 | `daisyui` absent from package.json devDependencies | `grep daisyui package.json` → no match | ✅ PASS |
| NEO-13 | `pnpm lint && pnpm build` both pass | `pnpm lint` → 0 errors / 19 warnings (exit 0); `pnpm build` → 22/22 pages (exit 0) | ✅ PASS |
| NEO-14 | CLAUDE.md styling section: neobrutalism + palette `#FFD23F`; no DaisyUI / strict-monochrome mandates | `CLAUDE.md:67-73` neobrutalism block (3px borders, hard zero-blur shadows, `--radius:0`, physical hover/active, bold everywhere); `:69` 2-accent palette `#FFD23F`+`#FF6B6B`, "Never use white-on-accent"; `:71` "DaisyUI is fully removed — do not reintroduce"; `:73` a11y kept (label htmlFor, focus-brutal, WCAG AA) | ✅ PASS |
| NEO-15 | ui-ux_guidelines.mdc rewritten (component standards, palette, Tailwind standards; DaisyUI component list removed); a11y retained | `agent_docs/ui-ux_guidelines.mdc:10` neobrutalism; `:15` 2-accent; `:29-40` token system; `:18,216` "DaisyUI fully removed — do not reintroduce" (no component list); component standards rewritten | ✅ PASS |
| NEO-16 | Visible thick black focus outline on every interactive element (WCAG 2.4.7) | `globals.css:73-78` `@utility focus-brutal` (3px solid black `:focus-visible` outline); 37 occurrences in `src/`; 12 `<Link>` anchors (`page.tsx:8`, `dashboard:111,245,251`, `training:53,124`, `assessment/results:249`, `admin/texts:230`, etc.); Button base CVA; `ui/select.tsx:11`; `Sidebar.tsx:85,154` | ✅ PASS |
| NEO-17 | Accents with text → black text (both AA: `#FFD23F`≈17:1, `#FF6B6B`≈7.8:1); no white-on-accent | `ui/alert.tsx:10,12` error=`bg-error text-black`; `ui/button.tsx:34` primary=`bg-main text-black`; 4 `text-white` occurrences all on `bg-black` containers (`training/page.tsx:35`, `training/rsvp/page.tsx:59`, `training/rsvp/feedback/page.tsx:132,142` — 21:1 AA); no `text-white` on `bg-main`/`bg-error` | ✅ PASS |
| NEO-18 | ≤640px: no horizontal overflow, readable text, tappable targets ≥44px | `admin/texts/page.tsx:36` `overflow-x-auto` on table; primitives use `w-full`/`max-w-*` (no unbounded widths). ⚠️ Button sizes: sm=`h-9`(36px), default=`h-10`(40px), lg=`h-11`(44px) — sm/default below the 44px the spec names (close, but not exact). Live resize deferred to user. | ⚠️ Spec-precision gap (tap-target px) |
| NEO-19 | Hover/active physical shift/shadow consistent across components | `ui/button.tsx:34,37` primary+secondary consistent (hover translate-[1px]+shadow-brutal-sm, active translate-[4px]+shadow-none); `Sidebar.tsx:85,109,154` consistent (hover translate-[1px], active translate-[3px]+shadow-none). Outline variant is the exception (see NEO-04). | ✅ PASS (outline excepted) |
| NEO-20 | Tokens centralized (no per-component hard-coded colors) so a future dark palette is achievable by swapping `:root` only | tokens centralized in `globals.css:3-15` + `@theme inline`; hard-coded hex grep (excl. globals.css) → 6 literals, all in `dashboard/page.tsx:203,206,212,228,230,231` recharts SVG `stroke`/`fill` (`#e5e7eb`, `#6b7280`, `#000000`) — **accepted documented exception** (recharts SVG presentation attrs can't resolve CSS `var()`); recharts Tooltip uses `var(--white)`/`var(--black)` (`dashboard/page.tsx:219-222`) | ✅ PASS (w/ documented exception) |

**Status**: ✅ 18/20 ACs fully matched spec outcome; ⚠️ 2 spec-precision gaps flagged (NEO-04 outline shadow/physics; NEO-18 tap-target 44px) — both minor/cosmetic, neither a hard FAIL. Zero ACs lack evidence.

---

## Discrimination Sensor

**Sensor: N/A — no test framework (AD-002); discrimination cannot be run.** Spec-anchored code/grep/build evidence at `file:line` is the verification basis (per the Verifier operating instructions). No test suite exists to inject mutations into and no tests to kill mutants; inventing tests is explicitly prohibited by AD-002.

**Substitute basis**: each AC was re-derived independently from the spec and traced to located `file:line` + a concrete code/grep/build outcome (see the Spec-Anchored table above). The two core success criteria were verified by direct execution:
- Zero DaisyUI: `grep -rin daisyui src/ package.json` → 0 matches; comprehensive DaisyUI class-name grep → 0 real matches (false positives enumerated).
- Gate green: `pnpm lint` (0 err / 19 warn, exit 0) + `pnpm build` (22/22 pages, exit 0).

---

## Gate Check

- **Gate command**: `pnpm lint && pnpm build` (per AD-002; tasks.md Gate Check Commands)
- **Lint result**: 0 errors, 19 warnings (exit 0) — 19 warnings are the accepted T1 baseline (8 `noExplicitAny`, 9 `noNonNullAssertion`, 2 `noUnusedVariables`), all pre-existing, none introduced by this feature
- **Build result**: 22/22 pages generated, exit 0
- **Test count before feature**: N/A (no test framework — AD-002)
- **Test count after feature**: N/A (no test framework — AD-002)
- **Delta**: N/A — test count N/A, no test framework (AD-002)
- **Skipped tests**: N/A
- **Failures**: none

---

## Edge Cases

- [x] **neobrutal-ui incompatibility fallback** — NOT triggered; the library path was used (16 components copied to `src/components/ui/`, `components.json`, `src/lib/utils.ts` cn(), `@base-ui/react` dep). Fallback retained as contingency only.
- [x] **DaisyUI token with no library equivalent → hand-rolled** — verified: `ui/{select,radio,spinner,table,join,divider,form-control}.tsx` all exist and are token-driven (3px black border, square, hard shadow, `focus-brutal`).
- [x] **Phase-0 auto-fix residual lint errors decided per-error** — 19 residuals enumerated with a per-error decision (all accept-as-baseline, pre-existing debt) in tasks.md T1 table; `pnpm lint` confirms 0 errors / 19 warnings.
- [x] **Mid-migration buildability** — app built at every commit (per-task gate green per tasks.md status notes; `@plugin "daisyui"` was retained until T17 after all pages migrated); final `pnpm build` 22/22 green spot-checked by Verifier.

---

## Code Quality

| Principle | Status | Notes |
| --------- | ------ | ----- |
| Minimum code | ✅ | Added glue is minimal + each piece justified: `--radius-base` (neobrutal-ui components reference `rounded-base`); `@utility focus-brutal`/`transition-brutal` (copied components reference these class names but library CSS injection doesn't define them); Button `asChild` Slot (8 admin Link-wrapping buttons need it); relocated neobrutal-ui output under `src/` (matches `@/*` alias). |
| Surgical changes | ✅ | Diffs touch only styling-relevant code; behavior preserved (RSVP `60000/targetWpm` + visibilitychange pause, quiz scoring, Sentry capture, Server Action wiring, pt-BR text). |
| No scope creep | ✅ | `asChild` Slot is the one small addition beyond a pure restyle — justified by 8 real call sites needing `<Link>`-as-button. No new features. |
| Only touched required files | ✅ | Diff stat = 50 files, all styling/config/docs; no data-layer, no business logic, no migrations. |
| Didn't "improve" unrelated code | ✅ | `error.tsx` left untouched (AD-003); pre-existing dead `data-theme="qickreed"` removed (directly related — was a dead DaisyUI hook). |
| Matches existing patterns | ✅ | Wrapper-delegation pattern (`Button.tsx`→`ui/button.tsx`, `Card.tsx`→`ui/card.tsx`) preserves existing public APIs so call sites changed minimally. |
| Spec-anchored outcome check | ✅ | Each AC traced to spec-defined outcome at `file:line`; 2 precision gaps flagged honestly. |
| Per-layer Coverage Expectation | ✅ | UI-only feature; build gate + grep evidence substitutes for test-per-AC per AD-002. |
| Every check maps to a spec requirement | ✅ | No unclaimed work. |
| Documented guidelines followed | ✅ | `CLAUDE.md` + `agent_docs/ui-ux_guidelines.mdc` (rewritten by this feature); AD-002/003/005 conformance verified. |
| Would senior engineer approve? | ✅ | Clean, well-scoped migration; honest documentation of exceptions. |

**19 accepted-baseline lint warnings**: all pre-existing (`noExplicitAny` on zodResolver/Supabase `as any` title access; `noNonNullAssertion` on Supabase env vars; `noUnusedVariables` dead bindings) — NOT introduced by this feature; out of scope per spec Out-of-Scope ("Full manual remediation of pre-existing lint debt beyond auto-fix"). Acceptable.

---

## Interactive UAT Results

**Not performed by Verifier (headless agent).** Per the operating instructions:

| # | Test | Result | Details |
| - | ---- | ------ | ------- |
| 1 | Authenticated behavioral drive (login → dashboard → training/RSVP → assessment → admin) | ⏭️ Deferred | Requires browser + Supabase env vars + auth credentials unavailable to a headless agent. Deferred to user (consistent with STATE.md). NOT a feature FAIL. |
| 2 | Browser tab-through focus + mobile-resize (NEO-16/18 live) | ⏭️ Deferred | Code-level audit done; live verification deferred to user. |

---

## Fix Plans (minor gaps — user's call; not blockers)

### Fix 1: Button `outline` variant — add hard shadow + hover/active physics (NEO-04)

- **Root cause**: `src/components/ui/button.tsx:38-39` outline variant = `bg-transparent text-black hover:bg-black/5 active:bg-black/10` — has the 3px border (from base CVA) but omits the hard offset shadow and the hover-shift/active-collapse physics the spec requires for all three variants.
- **Fix task**: add `shadow-brutal` + `hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none` to the outline variant (keep the transparent fill + bg tint, or drop the tint if the shadow suffices). Verify `pnpm lint && pnpm build`.
- **Priority**: Minor / Cosmetic — outline is a tertiary action button (8 call sites: admin "Voltar"/"Cancelar"/filter); primary + secondary fully conform.

### Fix 2: Tap-target ≥44px on sm/default Button (NEO-18)

- **Root cause**: `src/components/ui/button.tsx:42-43` size sm=`h-9`(36px), default=`h-10`(40px); spec NEO-18 names ≥44px.
- **Fix task**: bump default to `h-11`(44px) and sm to `h-10`(40px) — or document that 40px is the project's chosen minimum (WCAG 2.5.5 ≥44px is AAA; Apple HIG is a guideline, not a hard AA requirement). Live mobile verification deferred to user.
- **Priority**: Minor / Cosmetic — close to threshold; confirm intent with user before changing.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| NEO-01 | Verified | ✅ Verified |
| NEO-02 | Verified | ✅ Verified |
| NEO-03 | Verified | ✅ Verified |
| NEO-04 | Verified | ⚠️ Verified w/ minor gap (outline variant) |
| NEO-05 | Verified | ✅ Verified |
| NEO-06 | Verified | ✅ Verified |
| NEO-07 | Verified | ✅ Verified |
| NEO-08 | Verified | ✅ Verified |
| NEO-09 | Verified | ✅ Verified |
| NEO-10 | Verified | ✅ Verified |
| NEO-11 | Verified | ✅ Verified |
| NEO-12 | Verified | ✅ Verified |
| NEO-13 | Verified | ✅ Verified |
| NEO-14 | Verified | ✅ Verified |
| NEO-15 | Verified | ✅ Verified |
| NEO-16 | Verified | ✅ Verified (code-level; live deferred) |
| NEO-17 | Verified | ✅ Verified |
| NEO-18 | Verified | ⚠️ Verified w/ minor gap (tap-target px) |
| NEO-19 | Verified | ✅ Verified (outline excepted) |
| NEO-20 | Verified | ✅ Verified (w/ documented recharts-SVG exception) |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 18/20 ACs fully matched spec outcome; 2 spec-precision gaps flagged (NEO-04 outline shadow/physics; NEO-18 tap-target 44px) — both minor/cosmetic. Zero ACs lack `file:line` evidence.

**Sensor**: N/A — no test framework (AD-002); spec-anchored code/grep/build evidence is the verification basis.

**Gate**: `pnpm lint` 0 errors / 19 baseline warnings (exit 0); `pnpm build` 22/22 pages (exit 0). Test count N/A — no test framework (AD-002).

**What works**:
- Token system centralized in `globals.css` (`--main #FFD23F`, `--error #FF6B6B`, `--radius 0`, hard zero-blur shadows) — NEO-03/20.
- neobrutal-ui library path used (16 components) + 7 hand-rolled primitives for the DaisyUI-token gap — NEO-02/06.
- Button (primary/secondary), Card, Input, Alert, Select, Table, Sidebar, RsvpDisplay, assessment reading — all neobrutalist with 3px borders, hard shadows, square corners, physical hover/active — NEO-04/05/06/08/19.
- Zero DaisyUI repo-wide: no `@plugin`, no dep, no class names — NEO-07/10/11/12.
- `ActionResult` pt-BR errors in `Alert variant="error"` — NEO-09.
- Docs rewritten (`CLAUDE.md`, `ui-ux_guidelines.mdc`); `.claude/CLAUDE.md` untouched — NEO-14/15.
- Visible black focus (`focus-brutal`) on 12 Link anchors + Button + Select + Sidebar — NEO-16.
- No white-on-accent; both accents black-text AA — NEO-17.
- AD-003 Sentry wiring byte-for-byte unchanged in error boundaries.
- Gate green (lint + build).

**Issues found** (both minor/cosmetic, user's call):
1. NEO-04 outline Button variant lacks hard shadow + hover/active physics (border present). Fix: `src/components/ui/button.tsx:38-39`.
2. NEO-18 Button sm/default tap targets are 36/40px (spec names ≥44px). Fix: `src/components/ui/button.tsx:42-43` or document project minimum.

**Accepted exception**: NEO-20 — 6 hard-coded hex in `dashboard/page.tsx` recharts SVG `stroke`/`fill` (library can't resolve CSS `var()` in SVG presentation attributes); recharts Tooltip itself uses tokens.

**Deferred to user** (NOT a feature FAIL): authenticated behavioral drive-through (login → dashboard → training/RSVP → assessment → admin) + browser tab-through/mobile-resize live verification — requires browser + Supabase env + auth credentials unavailable to a headless agent.

**Next steps**: (1) user runs the deferred behavioral drive-through; (2) ~~optionally apply Fix 1/2~~ → **Fixes applied** (see Re-verification below).

---

## Re-verification — gaps fixed (2026-07-10)

Both Verifier-flagged spec-precision gaps resolved in one atomic commit `6953a95` (`fix(ui): Button outline shadow/physics + ≥44px tap targets`), staged on `src/components/ui/button.tsx` only (`.specs/` baseline left uncommitted per user decision):

1. **NEO-04** — outline variant now carries `shadow-brutal` + the same hover (shift toward shadow, `shadow-brutal-sm`) / active (offset collapse → `shadow-none`, translate `4px`/`4px`) physics as the default/neutral variants. Outline Button now fully conforms to NEO-04.
2. **NEO-18** — all Button sizes bumped to ≥44px tap targets: `default`/`sm`/`lg` → `h-11` (44px), `icon` → `h-11 w-11` (44×44px). Meets NEO-18 "tappable targets ≥44px".

**Gate after fix**: `pnpm lint` → 0 errors / 19 baseline warnings; `pnpm build` → pass. No regression to other variants (default/neutral/noShadow unchanged). Coverage now 20/20 NEO ACs satisfied (NEO-04, NEO-18 upgraded from spec-precision-gap to fully matched).
**Still deferred to user**: authenticated behavioral drive-through + live tab-through/mobile-resize (not a gate — requires browser + Supabase env + auth).