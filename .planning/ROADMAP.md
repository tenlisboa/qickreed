# Roadmap: Qickreed

## Overview

Brownfield v1 finish line. The speed-reading trainer already ships auth, RSVP engine, admin text CRUD, dashboard, and the neobrutalism design system. Four coarse phases close the v1 gap: ship the QIC-24 public landing page, harden admin Server Actions against auth-bypass, fix user-visible metric fabrication, and align `AGENTS.md` with the installed vitest toolchain. Each phase delivers one coherent capability end-to-end — no horizontal layers, no setup phase (infra exists), no v2 trailer.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Public Landing Page** - QIC-24 marketing landing for logged-out visitors (Hero, pain cards, 3-step solution, audience, final CTA)
- [ ] **Phase 2: Admin Auth Hardening** - Defense-in-depth: every mutating admin Server Action re-checks the role before reaching Supabase
- [ ] **Phase 3: Metric Correctness** - Feedback page and dashboard render real duration/start-time and separate measured vs. aimed WPM
- [ ] **Phase 4: Code Health** - Bring `AGENTS.md` in sync with installed vitest 4 toolchain

## Phase Details

### Phase 1: Public Landing Page
**Goal:** Logged-out visitors see a complete neobrutalist marketing page that explains the trainer, qualifies the audience, and routes them to signup — overwriting the current placeholder `src/app/page.tsx`.
**Mode:** mvp
**Depends on**: Nothing (first phase — brownfield, all infra exists)
**Requirements**: LANDING-01, LANDING-02, LANDING-03, LANDING-04, LANDING-05, LANDING-06, LANDING-07
**Success Criteria** (what must be TRUE):
  1. A logged-out visitor lands on `/` and sees all 5 QIC-24 sections in semantic order in a mobile viewport — Hero (H1 "Pare de ler com a 'voz na cabeça'" + H2 subtitle + primary CTA + microcopy), 3 pain cards in a 3-column grid, 3-step solution, audience qualification with 3-item checklist, final CTA section — with no section missing and no extra sections injected.
  2. The primary CTA ("Faça o Teste de Nivelamento Gratuito") links to `/signup` and resolves with a 200 response; the secondary CTA ("Descobrir meu PPM atual") links to `/assessment` and is correctly redirected by middleware to `/login` for logged-out visitors (then back to `/assessment` post-auth).
  3. The page is built with neobrutal-ui primitives and AD-005 tokens — 3px solid black borders, hard zero-blur offset shadows, square corners, two accents only (`#FFD23F` for primary CTAs/highlights/active states, `#FF6B6B` reserved for errors only on this page), bold sans-serif, mobile-first layout; every interactive element has a visible `focus-brutal` state; copy is pt-BR throughout and meets WCAG AA contrast.
  4. Authenticated users hitting `/` are redirected to `/dashboard` by middleware before reaching the landing (existing behavior preserved — the new page only serves logged-out traffic).
  5. `pnpm lint && pnpm build` succeeds with no new TypeScript or Biome errors introduced by the page.
**Plans**: TBD
**UI hint**: yes
**Notes**: Respect AD-005 (neobrutalism) — read `agent_docs/design.md` and `agent_docs/system.md` before implementation. Do NOT add the Hero GIF/interface mockup (v2 LANDING-08, marked "postponed" by QIC-24). Authenticated `/` redirect is existing middleware behavior; do not regress it.

### Phase 2: Admin Auth Hardening
**Goal:** Admin Server Actions defend themselves with `checkAdminAccess()` independent of the admin layout, so a malicious authenticated `member` cannot reach the Supabase mutating call by POSTing directly to the action endpoint.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02
**Success Criteria** (what must be TRUE):
  1. A logged-in `member` role user who POSTs directly to the `createText`, `updateText`, or `deleteText` Server Action (bypassing `admin/layout.tsx`) is redirected away by `checkAdminAccess()` before the Supabase insert/update/delete call executes — the action never reaches the mutating query.
  2. An admin role user invoking the same actions still successfully creates, updates, and deletes texts; the admin UI flow at `/admin/texts` continues to work end-to-end with no behavior change for admins.
  3. `getTexts` and `getTextById` either return `fail("forbidden", ...)` for non-admins (if admin-only reads are intended) OR are explicitly moved to a public-read path with the rationale recorded in `PLAN.md` — the current state (readable by any authenticated user) is a deliberate, documented choice rather than an accident.
  4. `pnpm lint && pnpm build` succeeds with no new errors.
**Plans**: 1 plan
Plans:
- [ ] 02-01-PLAN.md — Harden admin Server Actions: checkAdminAccess() first on mutating + getTexts, migrate all 5 actions to ActionResult<T>, update 7 callers, add Pino warn log + vitest regression tests
**Notes**: RLS still gates writes via `is_admin()` — this phase closes the application-layer gap that lets non-admins reach RLS in the first place and stops the misleading `success: true` on RLS-rejected mutations. Return `ActionResult<T>` via `fail()`/`ok()` (AD-001) rather than ad-hoc shapes.

### Phase 3: Metric Correctness
**Goal:** Users reviewing their progress see real session duration, real session start time, and a dashboard PPM chart that no longer conflates measured WPM with aimed target WPM.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: METRIC-01, METRIC-02
**Success Criteria** (what must be TRUE):
  1. The RSVP feedback page renders the actual session duration (e.g. "2:14") matching the `training_session.duration_time_s` value stored at session-completion time — not "0:00" and not a fabricated `0`.
  2. The feedback page renders the actual session start time from the DB row's `created_at` — not the quiz-submit time (`new Date().toISOString()` placeholder is gone).
  3. The dashboard PPM chart shows `diagnostic_session.wpm` (actual measured speed) and `training_session.target_wpm` (speed the user aimed at) as distinct, labeled series — no longer mixed on a shared `ppm` axis. Users can tell at a glance which dots are baseline measurements vs. training targets.
  4. `pnpm lint && pnpm build` succeeds with no new errors and the recharts-based dashboard rendering (NEO-20 SVG hex-literal exception) is not regressed.
**Plans**: TBD
**Notes**: `submitTrainingQuiz` must re-SELECT `duration_time_s, created_at` from the `training_session` row after the UPDATE rather than inventing values. Do NOT regress the NEO-20 dashboard recharts exception (per AGENTS.md). WPM remains a server-side computation — never compute on the client.

### Phase 4: Code Health
**Goal:** Future agents read an `AGENTS.md` that matches reality — the test toolchain is documented, the "no test framework" mandate is gone, and the test command gate is unambiguous.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: CODE-01
**Success Criteria** (what must be TRUE):
  1. The `AGENTS.md` Commands section lists `pnpm test` (runs `vitest`) and `pnpm test:run` (runs `vitest run`) and references `vitest.config.ts` as the runner config — a future agent reading AGENTS.md knows the test commands without inspecting `package.json`.
  2. The "There is no test framework configured (no `test` script, no test deps) — do not invent test commands" wording is removed from `AGENTS.md`; it is replaced with a statement that vitest 4 + Testing Library + jsdom are installed and `src/__tests__/` is the test home.
  3. `AGENTS.md` reflects the quality-gate policy accurately: `pnpm lint && pnpm build` remains the per-task gate per AD-002, with vitest as additive coverage (not a replacement gate) — the doc neither overstates nor understates the role of tests.
  4. `pnpm lint && pnpm build` succeeds after the doc edit (no broken markdown/code-fence introduced).
**Plans**: TBD
**Notes**: This is a docs-only phase — no source code or test files change. `vitest.config.ts` already exists (`STRUCTURE.md` line 67); AGENTS.md is the stale artifact. AD-002's "Revisit (AGENTS.md stale)" status should be cleared in PROJECT.md Key Decisions after this phase ships.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Public Landing Page | 0/TBD | Not started | - |
| 2. Admin Auth Hardening | 0/TBD | Not started | - |
| 3. Metric Correctness | 0/TBD | Not started | - |
| 4. Code Health | 0/TBD | Not started | - |