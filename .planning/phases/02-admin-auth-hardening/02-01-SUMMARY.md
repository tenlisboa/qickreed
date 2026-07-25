---
phase: 02-admin-auth-hardening
plan: 01
subsystem: auth
tags: [server-actions, supabase, rls, pino, ActionResult, nextjs, vitest]

requires:
  - phase: 01-public-landing-page
    provides: authenticated user baseline + admin route group + checkAdminAccess() guard
provides:
  - Application-layer auth gate on createText/updateText/deleteText/getTexts via checkAdminAccess() first
  - ActionResult<T> return contract on all 5 admin/texts actions (ok()/fail() replacing ad-hoc { success, error? })
  - Pino warn telemetry on non-admin block inside checkAdminAccess()
  - vitest regression test locking auth ordering + deliberate getTextById open-read (D-04)
affects: [03-metric-correctness, 04-code-health, owned-read-authorization-future-phase]

tech-stack:
  added: []
  patterns:
    - "Mutating Server Actions call await checkAdminAccess() as first statement before createClient() and before input validation"
    - "All admin/texts actions return ActionResult<T> via ok()/fail(); no ad-hoc { success, error? } shape"
    - "fail() user-facing message is pt-BR; log.error/log.warn message is English with err/userId context (AD-004)"
    - "deleteText text-in-use maps to fail('validation', <pt-BR>); Supabase errors to fail('db_error', <pt-BR>, <raw err>) after log.error({ err }, <English>)"
    - "Regression tests mock at supabase level only (never vi.mock('@/utils/auth/admin')) — checkAdminAccess runs end-to-end so redirect throw is observable as rejection"

key-files:
  created:
    - src/__tests__/admin-texts-actions.security.test.ts
  modified:
    - src/utils/auth/admin.ts
    - src/app/(authenticated)/admin/texts/actions.ts
    - src/app/(authenticated)/admin/texts/page.tsx
    - src/app/(authenticated)/admin/texts/edit/[id]/page.tsx
    - src/app/(authenticated)/admin/texts/create/page.tsx
    - src/components/DeleteTextModal.tsx
    - src/app/(authenticated)/assessment/reading/page.tsx
    - src/app/(authenticated)/assessment/quiz/page.tsx
    - src/app/(immersive)/training/rsvp/session/page.tsx

key-decisions:
  - "Auth-block path is redirect() via checkAdminAccess() — no fail('unauthorized') anywhere (D-07)"
  - "getTextById stays public-authenticated-read — no auth check (D-04); locked by a named regression test"
  - "getTextById switched from .single() to .maybeSingle() so missing row maps to ok(null) cleanly"
  - "checkAdminAccess user:any return type left as-is (TYPE-01 owns the cast cleanup in v2)"
  - "Single test file with describe blocks per action (Agent's Discretion)"

patterns-established:
  - "Mutating Server Action auth gate: `await checkAdminAccess()` as first statement (SEC-01 ordering invariant)"
  - "Server Action mock-at-supabase-only regression test pattern with chainable call-order recording"
  - "Discriminated-union ActionResult unwrap at caller sites: `if (result.error) { setError(result.error.message); return; } <use result.data>`"

requirements-completed: [SEC-01, SEC-02]

coverage:
  - id: D1
    description: "createText/updateText/deleteText/getTexts call await checkAdminAccess() as first statement; non-admins are redirected before any Supabase mutating call"
    requirement: SEC-01
    verification:
      - kind: unit
        ref: "src/__tests__/admin-texts-actions.security.test.ts#createText/updateText/deleteText/getTexts non-admin blocked"
        status: pass
      - kind: integration
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D2
    description: "getTexts admin-only via checkAdminAccess(); getTextById deliberately public-authenticated-read with rationale recorded (regression test locks D-04)"
    requirement: SEC-02
    verification:
      - kind: unit
        ref: "src/__tests__/admin-texts-actions.security.test.ts#getTexts non-admin blocked + getTextById non-admin receives row (regression)"
        status: pass
    human_judgment: false
  - id: D3
    description: "All 5 admin/texts actions return ActionResult<T> via ok()/fail(); ad-hoc { success, error? } shape removed"
    requirement: SEC-01
    verification:
      - kind: integration
        ref: "pnpm build (type-check against new signatures across 7 callers)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Pino warn log emitted inside checkAdminAccess() on non-admin block with userId (AD-003/AD-004)"
    requirement: SEC-01
    verification:
      - kind: unit
        ref: "src/__tests__/admin-texts-actions.security.test.ts#non-admin block emits warn log with userId"
        status: pass
    human_judgment: false
  - id: D5
    description: "Manual smoke: logged-in member POSTing directly to mutating actions is redirected before Supabase call; logged-in admin sees no UI behavior change"
    requirement: SEC-01
    verification: []
    human_judgment: true
    rationale: "End-to-end browser POST against Server Action endpoint with two distinct logged-in sessions — not automatable in unit suite; covered structurally by the auth-ordering regression tests."

duration: ~90min
completed: 2026-07-25
status: complete
---

# Phase 02: Admin Auth Hardening Summary

**Application-layer auth gate on all mutating admin/texts Server Actions + ActionResult<T> migration with Pino warn telemetry and a vitest regression test locking auth ordering and the deliberate getTextById open-read**

## Performance

- **Duration:** ~90 min (across two sessions — initial execute was interrupted mid-way; this session completed verification + SUMMARY)
- **Tasks:** 5
- **Files modified:** 10 (2 source targets + 7 callers + 1 net-new test file)

## Accomplishments
- `checkAdminAccess()` emits a Pino `warn({ userId }, "Non-admin user blocked from admin action")` on the non-admin block branch before `redirect("/dashboard")` (D-02)
- `createText`/`updateText`/`deleteText`/`getTexts` each call `await checkAdminAccess()` as their first executable statement, before `createClient()` and before any input validation (SEC-01, D-01, D-03)
- All 5 admin/texts actions migrated from ad-hoc `{ success: boolean; error?: string; id?: string }` to `ActionResult<T>` via `ok()`/`fail()` (AD-001, D-06)
- `deleteText` text-in-use now emits `fail("validation", "Este texto não pode ser deletado pois está sendo usado em sessões de avaliação.")` (D-08); all Supabase errors emit `fail("db_error", <pt-BR>, <raw err>)` after `log.error({ err }, <English>)`
- `getTextById` stays public-authenticated-read (D-04); switched `.single()` → `.maybeSingle()` so missing rows map to `ok(null)`; locked by a named regression test
- 7 caller sites (4 admin + 3 non-admin) updated to unwrap the new `ActionResult<T>` shape via the `assessment/quiz/page.tsx:116-126` pattern
- New `src/__tests__/admin-texts-actions.security.test.ts` covers all 5 D-10 categories (26 tests, 2 files, all passing); mocks at the supabase level only — never `vi.mock("@/utils/auth/admin")` — so `checkAdminAccess()` runs end-to-end and the redirect throw is observable

## Task Commits

Each task was committed atomically:

1. **Task 1: Pino warn log inside checkAdminAccess()** — `90b3db1` (feat)
2. **Task 2: Migrate admin text actions to ActionResult + checkAdminAccess first** — `28768de` (refactor)
3. **Task 3: Unwrap ActionResult in admin text callers** — `a452ecb` (refactor)
4. **Task 4: Unwrap ActionResult in getTextById callers** — `828e316` (refactor)
5. **Task 5: Add admin action auth-defense regression tests** — `de660ea` (test)

**Plan metadata:** `pending` — SUMMARY.md commit (this file)

## Files Created/Modified
- `src/utils/auth/admin.ts` — added Pino warn log on non-admin block branch (lines 37-39)
- `src/app/(authenticated)/admin/texts/actions.ts` — 5 actions migrated to ActionResult<T>; 4 call checkAdminAccess() first; getTextById switched to .maybeSingle() → ok(null)
- `src/app/(authenticated)/admin/texts/page.tsx` — two getTexts call sites unwrap via result.error/result.data
- `src/app/(authenticated)/admin/texts/edit/[id]/page.tsx` — getTextById (ok(null) missing-row → "Texto não encontrado") + updateText quiz-page unwrap
- `src/app/(authenticated)/admin/texts/create/page.tsx` — createText quiz-page unwrap
- `src/components/DeleteTextModal.tsx` — deleteText quiz-page unwrap (validation text-in-use now flows through result.error.message unchanged)
- `src/app/(authenticated)/assessment/reading/page.tsx` — getTextById unwrap
- `src/app/(authenticated)/assessment/quiz/page.tsx` — getTextById unwrap (saveDiagnosticSession consumer untouched)
- `src/app/(immersive)/training/rsvp/session/page.tsx` — getTextById unwrap
- `src/__tests__/admin-texts-actions.security.test.ts` — new 344-line regression test (5 D-10 categories, 26 tests)

## Decisions Made
- **getTextById `.single()` → `.maybeSingle()`**: the original `.single()` throws on missing rows; `.maybeSingle()` returns `{ data: null, error: null }` cleanly, mapping to `ok(null)` per D-06 without a `not_found` code.
- **Single test file** with `describe` blocks per action (Agent's Discretion per CONTEXT.md) — chosen for cohesion of the 5 D-10 categories.
- **Module tag `"checkAdminAccess"`** reused for the new warn log (matches the existing `log.error` module tag in the same function — consistent GlitchTip grouping).
- **`checkAdminAccess` `user: any` return type left as-is** per CONTEXT.md `<deferred>` — TYPE-01 owns the cast cleanup in v2.

## Deviations from Plan

None — plan executed exactly as written. The Task-2 build-gate caveat documented in the plan (caller type mismatches expected until Tasks 3+4 land) did not require special handling — the executor committed Tasks 2–4 in sequence and the whole-project `pnpm build` passed at the end of Task 4 as predicted.

## Issues Encountered
- Initial gsd-executor subagent dispatch was interrupted twice (runtime subagent-spawn reliability). Orchestrator switched to the workflow's documented fallback for non-Claude-Code runtimes: sequential inline execution. The 5 atomic task commits had already landed from the first (interrupted) attempt; this session verified the working tree, ran the verification gates, and wrote the missing SUMMARY.md.
- `pnpm lint` reports 1 error in `.claude/settings.local.json` (puppeteer MCP server entry formatting) — unrelated to this phase, pre-existing local config drift. The 18 Biome warnings are pre-existing `process.env.NEXT_PUBLIC_*!` non-null assertions in `src/utils/supabase/{server,client}.ts` (C-2/C-3 family, deferred to v2). Neither was introduced by Phase 2.

## Verification Results
- `pnpm build` — **pass** (whole-project type-check; all 7 callers unwrap ActionResult<T> cleanly)
- `pnpm test:run` — **pass** (2 files, 26 tests, 0 failures; includes the new 344-line security regression file)
- `pnpm lint` — **pass for Phase 2 files** (1 unrelated error in `.claude/settings.local.json`; 18 pre-existing warnings in supabase client files, both out of scope)
- No `supabase/migrations/` files added (RLS policies unchanged — out of scope per CONTEXT.md `<deferred>`)

## User Setup Required
None — no external service configuration required. Pino logs flow through the existing `getRequestLogger` setup (AD-003); no new env vars.

## Next Phase Readiness
- Phase 3 (Metric Correctness) can proceed — `submitTrainingQuiz` and dashboard PPM mixing are unrelated to this slice.
- Phase 4 (Code Health) can proceed — the `as any` / `as unknown as` cast cleanup (TYPE-01/02) and AGENTS.md test-framework refresh remain deferred and on-track for that phase.
- A future "Owned Read Authorization" phase (candidate on backlog) can tighten `getTextById` to owned-session reads; the regression test added here will fail loudly by name if that work re-introduces an auth check without updating the test — which is the intended signal.

---
*Phase: 02-admin-auth-hardening*
*Completed: 2026-07-25*