# Error Handling & Logging Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow.

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/error-logging/design.md`
**Spec**: `.specs/features/error-logging/spec.md`
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase + project guidelines. **Guidelines found:** `CLAUDE.md` explicitly states "There is no test framework configured — do not invent test commands." The user confirmed: build+lint gate, behavioral verification. **No test runner is introduced** — this overrides the skill's default test-per-AC contract per the user-instructions-precede-skills rule.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Logging infra (logger, request-logger) | none | build gate; behavioral verify at feature close | `src/utils/logging/*` | `pnpm lint && pnpm build` |
| ActionResult types + helpers | none | build gate; behavioral verify | `src/utils/actions/types.ts` | `pnpm lint && pnpm build` |
| Server Actions / Route Handlers | none | build gate; behavioral verify (drive app, throw synthetic errors) | `src/app/**/actions.ts`, `src/app/**/route.ts` | `pnpm lint && pnpm build` |
| Error boundaries | none | build gate; behavioral verify (throw in component, see fallback) | `src/app/**/error.tsx` | `pnpm lint && pnpm build` |
| instrumentation / sentry config | none | build gate; behavioral verify (DSN unset = no-op; set = capture) | `instrumentation.ts`, `sentry.*.config.ts` | `pnpm lint && pnpm build` |

## Parallelism Assessment

> No tests → parallelism driven only by code dependencies. Sub-agent model is one worker per phase, sequential. No intra-phase parallelism.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
| --------- | -------------- | --------------- | -------- |
| n/a (no tests) | n/a | n/a | CLAUDE.md: no test framework |

## Gate Check Commands

> **Baseline reality (discovered during Execute):** `pnpm lint` reports 83 pre-existing errors + 46 warnings across ~17 files — unrelated to this feature and OUT OF SCOPE (do not fix them). A prerequisite commit (`6caa170`) fixed the build-blocker `useSearchParams()` Suspense issues on `/assessment/reading`, `/training/rsvp/session`, `/training/rsvp/feedback`, so `pnpm build` now passes. Per user decision: **scoped lint gate** — only the files a task touches must be lint-clean; the full `pnpm lint` is NOT required to pass.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After pure-edit tasks (no new deps/config) | `biome check <touched files>` (must be clean) + `pnpm build` |
| Build | After any new dep, config, types, or phase completion | `biome check <touched files>` (clean) + `pnpm build` (must pass) |

**How to run the scoped lint gate:** `pnpm exec biome check <file1> <file2> ...` — every file you touched must report 0 errors. Do NOT run bare `pnpm lint` as a pass/fail gate (it always fails on pre-existing debt). `pnpm build` IS a hard gate (typecheck + prerender) and must pass.

**Final verification (post all phases):** behavioral pass via the app — throw synthetic errors in a route/Server Component/Server Action, confirm Pino log lines carry `requestId`, confirm `error.tsx`/`global-error.tsx` fallbacks render, confirm GlitchTip no-ops cleanly with `SENTRY_DSN` unset and (if DSN provided) captures the event. Run by orchestrator after the Verifier sub-agent.

---

## Execution Plan

```
Phase 1 (Logging foundation):    T1 ──→ T2 ──→ T3
Phase 2 (Replace console.*):     T4 ──→ T5
Phase 3 (GlitchTip/Sentry):      T6 ──→ T7
Phase 4 (Error boundaries):      T8 ──→ T9
Phase 5 (ActionResult migration): T10 ──→ T11 ──→ T12
```

Phases execute sequentially, one sub-agent worker per phase.

---

## Task Breakdown

### T1: Pino singleton logger

**What**: Create the configured Pino logger instance — `pino-pretty` transport in dev, raw JSON→stdout in prod, with secret redaction and base context.
**Where**: `src/utils/logging/logger.ts`
**Depends on**: None (install `pino` + `pino-pretty` first via `pnpm add`)
**Reuses**: nothing (new infra)
**Requirement**: EL-02, EL-04

**Tools**:
- MCP: `codegraph` (explore existing utils patterns), `context7` (pino current API)
- Skill: NONE

**Done when**:
- [ ] `pino` and `pino-pretty` added to dependencies
- [ ] `logger.ts` exports `logger: Logger`
- [ ] Dev transport = pino-pretty (colorize, translateTime); prod = undefined (JSON stdout)
- [ ] `redact` paths cover `*.password`, `*.token`, `*.apiKey`, `authorization`, `*.access_token`, `*.refresh_token`, `*.secret` → `[REDACTED]`
- [ ] `base` includes `env` (NODE_ENV); level from `LOG_LEVEL` || `info`
- [ ] Gate: `pnpm lint && pnpm build` passes

**Tests**: none (build gate)
**Gate**: build
**Commit**: `feat(logging): add Pino singleton logger with redaction`

---

### T2: Request-scoped child logger

**What**: Create `getRequestLogger()` that returns a child logger carrying `requestId` (from `x-request-id` header, generated if absent) + optional `userId`/`module`.
**Where**: `src/utils/logging/request-logger.ts`
**Depends on**: T1
**Reuses**: `logger` from T1
**Requirement**: EL-01, EL-03

**Tools**:
- MCP: `context7`
- Skill: NONE

**Done when**:
- [ ] `getRequestLogger(context?: { userId?: string; module?: string }): Logger` exported
- [ ] Reads `x-request-id` via `headers()` from `next/headers`; generates `crypto.randomUUID()` when absent
- [ ] Child logger binds `{ requestId, module?, userId? }`
- [ ] Gate: `pnpm lint && pnpm build` passes

**Tests**: none (build gate)
**Gate**: build
**Commit**: `feat(logging): add request-scoped child logger`

---

### T3: Middleware correlation-ID header

**What**: Set `x-request-id` on every matched request (generate if absent) before delegating to `updateSession`; keep cookie logic untouched.
**Where**: `src/middleware.ts`
**Depends on**: T2 (so the contract is stable)
**Reuses**: existing `updateSession`
**Requirement**: EL-03

**Tools**:
- MCP: `codegraph`
- Skill: NONE

**Done when**:
- [ ] `middleware()` sets `x-request-id` on the request headers (generate via `crypto.randomUUID()` if absent)
- [ ] `updateSession(request)` still called and unchanged in behavior
- [ ] matcher unchanged
- [ ] Gate: `pnpm lint && pnpm build` passes

**Tests**: none (build gate)
**Gate**: build
**Commit**: `feat(logging): attach request-id in middleware`

---

### T4: Replace console.* in Server Actions

**What**: Swap every `console.error`/`console.log` in Server Action files with `getRequestLogger()` calls; standardize log messages to English; keep existing return behavior (null/[]/false) for unmigrated actions — only logging changes here.
**Where**: `src/app/(authenticated)/assessment/actions.ts`, `src/app/(authenticated)/training/actions.ts`, `src/app/(authenticated)/dashboard/actions.ts`, `src/app/(authenticated)/admin/texts/actions.ts`
**Depends on**: T2, T3
**Reuses**: `getRequestLogger`
**Requirement**: EL-01, EL-02

**Tools**:
- MCP: `codegraph` (find all call sites)
- Skill: NONE

**Done when**:
- [ ] Zero `console.error`/`console.log` remain in the four actions.ts files
- [ ] Each action obtains a request logger and logs errors with `requestId` context
- [ ] Log messages in English; user-facing behavior unchanged (no return-shape changes here)
- [ ] `Sidebar.tsx` `console.log("Logout clicked")` removed or converted (no debug log needed — delete per CLAUDE.md "never comment out code — delete it")
- [ ] Gate: `pnpm lint && pnpm build` passes

**Tests**: none (build gate)
**Gate**: build
**Commit**: `feat(logging): replace console.* with structured logger in server actions`

---

### T5: Replace console.* in Route Handlers + utils

**Where**: `src/app/(authenticated)/training/rsvp/complete/route.ts`, `src/app/(authenticated)/auth/confirm/route.ts` (if any console), `src/utils/supabase/server.ts`, `src/utils/auth/admin.ts`, client pages' `console.error` (`training/rsvp/session/page.tsx`, `admin/texts/create/page.tsx`, `admin/texts/edit/[id]/page.tsx`, `admin/texts/page.tsx`, `admin/texts/components/TextForm.tsx`, `dashboard/page.tsx`, `assessment/quiz/page.tsx`, `assessment/reading/page.tsx`, `assessment/results/page.tsx`)
**Depends on**: T2
**Reuses**: `getRequestLogger` (server-side); for client components, leave a thin client-safe logger or remove the console call if it's debug-only (do not import server logger into client components — it would break the client bundle)
**Requirement**: EL-01

**Tools**:
- MCP: `codegraph`
- Skill: NONE

**Done when**:
- [ ] Server route handlers + utils use `getRequestLogger`
- [ ] Client components: remove debug `console.*` (delete, per CLAUDE.md); for genuine client error states keep a minimal `console.error` only if no server-side path exists (note: client errors are captured by GlitchTip browser SDK in Phase 3, so removing is acceptable)
- [ ] Zero bare `console.log` (debug) remain in `src/`
- [ ] Gate: `pnpm lint && pnpm build` passes

**Tests**: none (build gate)
**Gate**: build
**Commit**: `feat(logging): replace console.* with structured logger in routes and utils`

---

### T6: Sentry/GlitchTip instrumentation + configs

**What**: Add `@sentry/nextjs`; create `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation.ts` (register + `onRequestError = Sentry.captureRequestError`). No-op when `SENTRY_DSN` unset.
**Where**: repo root (`instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)
**Depends on**: None (independent of T1-T5)
**Reuses**: Next.js file conventions
**Requirement**: EL-06, EL-07, EL-09

**Tools**:
- MCP: `context7` (@sentry/nextjs current manual-setup API)
- Skill: NONE

**Done when**:
- [ ] `@sentry/nextjs` added to dependencies
- [ ] `sentry.server.config.ts` + `sentry.edge.config.ts` init with `enabled: !!process.env.SENTRY_DSN`, `tracesSampleRate` (1.0 dev / 0.1 prod), **no** Replay/Profiling integrations
- [ ] `instrumentation.ts` runtime-gates the config imports (`process.env.NEXT_RUNTIME === 'nodejs'|'edge'`) and exports `onRequestError = Sentry.captureRequestError`
- [ ] App boots with `SENTRY_DSN` unset → no errors, no capture
- [ ] `.env` gets a commented `SENTRY_DSN=` placeholder (do not commit a real value)
- [ ] Gate: `pnpm lint && pnpm build` passes

**Tests**: none (build gate)
**Gate**: build
**Commit**: `feat(observability): add GlitchTip/Sentry instrumentation with DSN no-op gate`

---

### T7: next.config — serverExternalPackages + withSentryConfig

**What**: Wrap next.config with `withSentryConfig` and add `serverExternalPackages: ['pino', 'pino-pretty']`.
**Where**: `next.config.ts`
**Depends on**: T1 (pino), T6 (sentry)
**Reuses**: existing empty next.config
**Requirement**: EL-05, EL-07

**Tools**:
- MCP: `context7`
- Skill: NONE

**Done when**:
- [ ] `serverExternalPackages: ['pino', 'pino-pretty']` set
- [ ] `withSentryConfig(nextConfig, { org, project, url: process.env.GLITCHTIP_URL or omitted, authToken, silent: !process.env.CI })` applied — org/project from env with safe defaults
- [ ] No Session Replay / browser profiling config keys
- [ ] Gate: `pnpm lint && pnpm build` passes (no worker.js bundling error)

**Tests**: none (build gate)
**Gate**: build
**Commit**: `feat(observability): wire pino external packages and Sentry config in next.config`

---

### T8: Root segment error boundary

**What**: `src/app/error.tsx` — client component, monochromatic fallback with retry, reports to Sentry once, shows `error.digest` as reference code.
**Where**: `src/app/error.tsx`
**Depends on**: T6 (Sentry available)
**Reuses**: `Button`, `Card` components; `agent_docs/ui-ux_guidelines.mdc`
**Requirement**: EL-10, EL-12

**Tools**:
- MCP: `codegraph` (find Button/Card usage)
- Skill: NONE

**Done when**:
- [ ] `"use client"` default export receives `{ error, reset }`
- [ ] `useEffect` calls `Sentry.captureException(error)` once
- [ ] Monochromatic UI (black/white/gray) with a "Tentar novamente" button calling `reset`
- [ ] Shows `error.digest` when present as a reference code
- [ ] Accessible: labeled, visible focus
- [ ] Gate: `pnpm lint && pnpm build` passes

**Tests**: none (build gate)
**Gate**: build
**Commit**: `feat(error-handling): add root error boundary`

---

### T9: global-error boundary

**What**: `src/app/global-error.tsx` — owns `<html>/<body>`, captures to Sentry, renders full-page monochromatic fallback.
**Where**: `src/app/global-error.tsx`
**Depends on**: T6
**Reuses**: Sentry
**Requirement**: EL-11, EL-12

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `"use client"` default export renders `<html><body>` + fallback (monochromatic)
- [ ] `Sentry.captureException(error)` in `useEffect`
- [ ] Gate: `pnpm lint && pnpm build` passes

**Tests**: none (build gate)
**Gate**: build
**Commit**: `feat(error-handling): add global-error boundary`

---

### T10: ActionResult types + ok/fail helpers

**What**: Define `ActionError`, `ActionErrorCode`, `ActionResult<T>`, and `ok()`/`fail()` factories.
**Where**: `src/utils/actions/types.ts`
**Depends on**: None
**Reuses**: none
**Requirement**: EL-13, EL-14

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ActionErrorCode` = `'unauthorized' | 'not_found' | 'db_error' | 'validation' | 'unknown'`
- [ ] `ActionError { code; message: string; details?: unknown }`
- [ ] `ActionResult<T>` discriminated union
- [ ] `ok<T>(data: T): ActionResult<T>` and `fail<T>(code, message, details?): ActionResult<T>` exported
- [ ] Gate: `pnpm lint && pnpm build` passes

**Tests**: none (build gate)
**Gate**: build
**Commit**: `feat(actions): add ActionResult discriminated-union type and helpers`

---

### T11: Migrate assessment actions to ActionResult

**What**: Refactor `getRandomDiagnosticText` → `ActionResult<Text>` and `saveDiagnosticSession` → `ActionResult<AssessmentResult>` using `ok`/`fail` + request logger; update `startAssessment` to consume the result (redirect on error). Map Supabase errors → `db_error`, missing user → `unauthorized`, not-found → `not_found`.
**Where**: `src/app/(authenticated)/assessment/actions.ts`
**Depends on**: T2, T4, T10
**Reuses**: `getRequestLogger`, `ok`/`fail`
**Requirement**: EL-14, EL-15

**Tools**:
- MCP: `codegraph`
- Skill: NONE

**Done when**:
- [ ] Both actions return `ActionResult<T>`
- [ ] Errors logged with request logger (English), user-facing `message` in pt-BR
- [ ] `startAssessment` handles `error` → `redirect("/error")` (existing behavior preserved)
- [ ] Gate: `pnpm lint && pnpm build` passes

**Tests**: none (build gate)
**Gate**: build
**Commit**: `feat(assessment): migrate diagnostic actions to ActionResult`

---

### T12: Update quiz page caller for ActionResult

**What**: `quiz/page.tsx` `handleSubmit` branches on `result.error` → renders `result.error.message`; success path unchanged. Also keep `getTextById` call as-is (unmigrated, still returns `T | null`).
**Where**: `src/app/(authenticated)/assessment/quiz/page.tsx`
**Depends on**: T11
**Reuses**: existing Card/Button/error UI
**Requirement**: EL-15, EL-16

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `if (result.error) { setError(result.error.message); return; }` replaces `if (!result)`
- [ ] Success path (redirect to results) unchanged
- [ ] `getTextById` usage unchanged and compiles
- [ ] Gate: `pnpm lint && pnpm build` passes

**Tests**: none (build gate)
**Gate**: build
**Commit**: `feat(assessment): render ActionResult error message in quiz page`

---

## Parallel Execution Map

```
Phase 1 (Sequential):   T1 → T2 → T3
Phase 2 (Sequential):   T4 → T5
Phase 3 (Sequential):   T6 → T7
Phase 4 (Sequential):   T8 → T9
Phase 5 (Sequential):   T10 → T11 → T12
```

Phases are sequential (one sub-agent per phase, per user choice). No `[P]` flags — all intra-phase tasks have dependencies.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Pino singleton | 1 file (new) | ✅ Granular |
| T2: Request logger | 1 file (new) | ✅ Granular |
| T3: Middleware request-id | 1 file (edit) | ✅ Granular |
| T4: console.* in actions | 4 actions.ts files (cohesive mechanical change) | ⚠️ OK if cohesive (same edit pattern) |
| T5: console.* in routes+utils+client | multiple files (cohesive mechanical change) | ⚠️ OK if cohesive |
| T6: Sentry instrumentation | 3 new root files | ⚠️ OK — single concern (error capture) |
| T7: next.config | 1 file (edit) | ✅ Granular |
| T8: error.tsx | 1 file (new) | ✅ Granular |
| T9: global-error.tsx | 1 file (new) | ✅ Granular |
| T10: ActionResult types | 1 file (new) | ✅ Granular |
| T11: Migrate assessment actions | 1 file (edit) | ✅ Granular |
| T12: Quiz page caller | 1 file (edit) | ✅ Granular |

T4/T5/T6 span multiple files but each is one cohesive concern (mechanical replacement / single integration). Kept together to avoid fragmented commits.

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
| ---- | ------------------ | ------------- | ------ |
| T1 | none | none (Phase 1 start) | ✅ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T2 | T2→T3 | ✅ |
| T4 | T2, T3 | T4 (Phase 2 start, after Phase 1) | ✅ |
| T5 | T2 | T4→T5 | ✅ |
| T6 | none | T6 (Phase 3 start) | ✅ |
| T7 | T1, T6 | T6→T7 | ✅ (T1 dep is cross-phase, satisfied) |
| T8 | T6 | T8 (Phase 4 start) | ✅ |
| T9 | T6 | T8→T9 | ✅ |
| T10 | none | T10 (Phase 5 start) | ✅ |
| T11 | T2, T4, T10 | T10→T11 | ✅ (T2/T4 cross-phase, satisfied) |
| T12 | T11 | T11→T12 | ✅ |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1-T12 | all layers | none (build gate) | none (build gate) | ✅ OK |

No test deferral — the matrix explicitly sets `none` for every layer per the user-confirmed no-test-framework constraint. Verification is behavioral at feature close, run by the orchestrator + Verifier sub-agent.