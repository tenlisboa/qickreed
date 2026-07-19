# Qickreed

## What This Is

Qickreed is a Portuguese-language (pt-BR) speed-reading trainer that uses a digital tachistoscope (RSVP — Rapid Serial Visual Presentation) to force reading above 350 WPM, past the subvocalization ceiling (~250–300 WPM). Users baseline via a diagnostic (WPM + comprehension + self-assessed reading method), then train at progressively higher target speeds. An LLM-generated comprehension quiz gates progression at a 60% pass threshold. Built for professionals, students, and focus-deficit readers absorbing technical material.

## Core Value

The average user passes the post-session comprehension quiz at ≥60% — speed without retention is inútil.

## Requirements

### Validated

Shipped and confirmed working (inferred from `.planning/codebase/` map + git history to `fd151cf`):

- ✓ Email auth via Supabase SSR + OTP confirmation — auth flows in `src/app/(auth)/`
- ✓ Diagnostic assessment with click-to-reveal timer (AD-007), server-side WPM from `text.num_words / (reading_time_ms / 60000)` — `src/app/(authenticated)/assessment/`
- ✓ RSVP training engine in immersive dark surface (AD-006), pause/resume on tab blur, LLM quiz, `profiles.benchmark_wpm` update on pass/fail — `src/app/(authenticated)/training/rsvp/`, `src/app/(immersive)/training/rsvp/session/`
- ✓ Admin text CRUD protected by `is_admin()` RLS policy + `checkAdminAccess()` in admin layout — `src/app/(authenticated)/admin/texts/`
- ✓ Neobrutalism design system (AD-005) — `Button`, `Card`, `ui/*` primitives, two-accent palette (`#FFD23F`, `#FF6B6B`), tokens in `src/app/globals.css`
- ✓ Dashboard with recharts PPM/comprehension timeline (NEO-20 exception for SVG hex literals) — `src/app/(authenticated)/dashboard/`
- ✓ Pino structured logging + GlitchTip/Sentry error monitoring (AD-003, AD-004) — `src/utils/logging/`, `sentry.*.config.ts`

### Active

Scope being built toward. These are hypotheses until shipped and validated.

- [ ] Public marketing landing page per QIC-24 spec (Hero, 3 pain cards, 3-step solution, audience qualification, final CTA — 5 sections, neobrutalism, primary CTA → `/signup`)
- [ ] All mutating admin Server Actions in `admin/texts/actions.ts` call `checkAdminAccess()` first; reads return `fail("forbidden")` for non-admins where admin-only reads are intended
- [ ] `submitTrainingQuiz` returns real `duration_time_s` + `created_at` from the DB row (not fabricated placeholders)
- [ ] Dashboard PPM chart separates `diagnostic_session.wpm` (actual measured) from `training_session.target_wpm` (aimed) — no longer on a shared `ppm` axis
- [ ] `AGENTS.md` updated to reflect installed vitest 4 + `test`/`test:run` scripts + `vitest.config.ts`; remove the "no test framework" mandate

### Out of Scope

Explicit boundaries with reasoning — prevents re-adding later.

- OAuth / magic-link / 2FA — Supabase local config is email-only; not needed for pilot
- Multi-language beyond `pt-BR` — pilot audience is Portuguese-speaking
- Native mobile apps (iOS/Android) — web-first per `MVP_SCOPE.md`; mobile-responsive only
- Real-time chat — not core to reading training
- Video posts — storage/bandwidth cost; not relevant to RSVP
- Green success color — explicitly banned by AD-005 (success is non-color)
- App-wide dark mode — explicitly banned by AD-006; dark surface stays scoped to `.training-surface`
- Hero GIF / interface mockup on landing — QIC-24 spec marks as "postponed"; ship static landing first, motion later

## Context

**Origin:** `MVP_SCOPE.md` is the original PRD — neurocognitive reading training pilot, Laravel-shaped architecture originally, executed on Next.js 15 + Supabase.

**Decision record (`.specs/STATE.md`):** seven locked architecture decisions AD-001..AD-007 govern this project. They are the contract for all future work:

| ID | Topic | One-liner |
|----|-------|-----------|
| AD-001 | Server Action shape | `ActionResult<T>` via `ok()`/`fail()` in `src/utils/actions/types.ts` |
| AD-002 | Test framework | (was: no tests) — superseded in Active: vitest 4 installed, AGENTS.md must be updated |
| AD-003 | Logging & monitoring | Pino (singleton) + GlitchTip via `@sentry/nextjs` (no-op without `SENTRY_DSN`) |
| AD-004 | Log vs UI language | Logs in English; `ActionError.message` in pt-BR |
| AD-005 | Design system | Neobrutalism — 3px black borders, hard shadows, two accents (`#FFD23F`, `#FF6B6B`), no green success, square corners |
| AD-006 | Training surface | `.training-surface` scoped dark palette (black bg, white fg, white border); rest of app stays light neobrutalist |
| AD-007 | Assessment timer | Starts on "Começar a Ler" click (user intent), not page load; invisible `MM:SS.t` face |

**Codebase map (`.planning/codebase/`):** committed at `fd151cf` — `STACK.md`, `ARCHITECTURE.md`, `STRUCTURE.md`, `CONCERNS.md`, `CONVENTIONS.md`, `INTEGRATIONS.md`, `TESTING.md` are the authoritative brownfield reference. Consult before any non-trivial change.

**Open concerns deferred to v2 (from `.planning/codebase/CONCERNS.md`):**

- **C-2** `setAll` cookie handler swallows all errors in `src/utils/supabase/server.ts:15-25` — coupled to middleware refresh; narrowing requires contract test. Defer until Phase 4 work or a dedicated hardening phase.
- **C-3** Pervasive `as unknown as` / `as any` casts for nested Supabase joins — refactor-heavy; defer to v2 once join typing helper exists in `src/types/database.ts`.
- **C-5** `RsvpDisplay.tsx:194-200` `RegressionEvent` log never leaves the component — dead code or unshipped feature. Product decision needed (wire to backend vs. delete). Defer.

## Constraints

- **Tech stack:** Next.js 15.5.4 (App Router, Turbopack) + React 19.1.8 + TypeScript 5 (strict, no `any`) + Tailwind CSS v4 + Biome 2.2 + **pnpm** — locked
- **Backend:** Supabase Postgres 17 + Auth + Storage; clients via `src/utils/supabase/{server,client,middleware}.ts` — never instantiate `@supabase/supabase-js` directly
- **RLS:** enabled on every table; admin text writes gated by `is_admin()` SECURITY DEFINER helper
- **Metrics:** WPM computed server-side from `text.num_words` + `reading_time_ms` — never on the client
- **RSVP:** per-word display time = `60000 / target_wpm` ms; WPM range 80–800; auto-pause on tab exit
- **Pass threshold:** 60% (`isPassingComprehension` in `src/lib/utils.ts`); fail reduces next target WPM by 10%
- **Design:** two accents only; text on accents is black; square corners; hard shadows — per AD-005
- **Quality gate per task:** `pnpm lint && pnpm build` (AD-002, until AGENTS.md is updated to acknowledge vitest)
- **Tests:** vitest 4 + Testing Library + jsdom (now installed); `src/__tests__/` is the test home

## Key Decisions

Seeded from `.specs/STATE.md` AD-001..AD-007. Add new decisions as they're made.

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AD-001: `ActionResult<T>` via `ok()`/`fail()` | Project standard for all Server Actions — surface real errors | ✓ Good |
| AD-002: vitest 4 + Testing Library installed | Tests now first-class; AGENTS.md update pending (v1 Active CODE-02) | ⚠️ Revisit (AGENTS.md stale) |
| AD-003: Pino + GlitchTip via `@sentry/nextjs` | OSS / self-hostable; no-op without `SENTRY_DSN` | ✓ Good |
| AD-004: English logs, pt-BR user messages | Logs for devs; UI for pt-BR users | ✓ Good |
| AD-005: Neobrutalism design system | Two-accent palette; no green success; square corners | ✓ Good |
| AD-006: `.training-surface` scoped dark palette | Dark tachistoscope without violating app-light AD-005 | ✓ Good |
| AD-007: Assessment timer on user intent | Eliminates network/device bias from baseline WPM | ✓ Good |
| Success metric: ≥60% comprehension pass rate | Speed without retention is inútil; prioritizes retention over raw WPM | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Context — incorporate feedback, usage, metrics from beta
4. Out of Scope audit — reasons still valid?

---
*Last updated: 2026-07-19 after initialization*