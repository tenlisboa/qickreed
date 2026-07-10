# Error Handling & Logging Validation

**Date**: 2026-07-09
**Spec**: `.specs/features/error-logging/spec.md`
**Diff range**: `c55317a..HEAD` (13 commits: 6caa170 → 62e08ac)
**Verifier**: independent sub-agent (author ≠ verifier)

> **No-test-framework adaptation (per CLAUDE.md + tasks.md):** There is no test
> runner in this project. The spec-anchored check therefore uses **implementation
> `file:line` + the code expression** as evidence (not test assertions). The
> discrimination sensor uses the **TypeScript compiler (`pnpm build`/tsc)** as the
> discriminator for typed surfaces and a **runtime Node script** for the logger.
> No tests were invented or run. Full `pnpm lint` is NOT a pass/fail gate (83
> pre-existing out-of-scope errors); the scoped gate requires feature-introduced
> lint = 0 (verified — see Code Quality).

---

## Task Completion

| Task | Status   | Notes |
| ---- | -------- | ----- |
| T1   | ✅ Done   | `src/utils/logging/logger.ts` — Pino singleton w/ redaction + dev pretty transport |
| T2   | ✅ Done   | `src/utils/logging/request-logger.ts` — async `getRequestLogger` |
| T3   | ⚠️ Partial | `src/middleware.ts` sets `x-request-id` on the **response** only — NOT propagated to downstream request headers (EL-03 gap) |
| T4   | ✅ Done   | All 4 `actions.ts` files: zero `console.*`, use `getRequestLogger` |
| T5   | ✅ Done   | Routes + utils + client pages: `console.*` removed/replaced; `Sidebar.tsx` debug log deleted |
| T6   | ✅ Done   | `instrumentation.ts` + 3 `sentry.*.config.ts`; DSN no-op gate |
| T7   | ✅ Done   | `next.config.ts` — `serverExternalPackages` + `withSentryConfig` |
| T8   | ✅ Done   | `src/app/error.tsx` — root segment boundary |
| T9   | ✅ Done   | `src/app/global-error.tsx` — owns `<html>/<body>` |
| T10  | ✅ Done   | `src/utils/actions/types.ts` — `ActionResult<T>` + `ok`/`fail` |
| T11  | ✅ Done   | `assessment/actions.ts` — `getRandomDiagnosticText` + `saveDiagnosticSession` migrated |
| T12  | ✅ Done   | `quiz/page.tsx` branches on `result.error` → renders `result.error.message` |

---

## Spec-Anchored Acceptance Criteria

### P1: Structured request-correlated logging

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + code expression | Result |
| ------------------------- | -------------------- | ----------------------------- | ------ |
| EL-01: WHEN any Server Action / Route Handler runs THEN it obtains a request-scoped logger carrying `requestId` (+ `userId` when known) via a single helper | A single async helper returns a child logger bound to `requestId`/`userId`/`module` | `src/utils/logging/request-logger.ts:5-17` — `export async function getRequestLogger(context?)` → `logger.child({ requestId, ...(module?), ...(userId?) })`; used across `assessment/actions.ts:28,53,66,91,119,141,173`, `admin/texts/actions.ts:48,73,100,156,183`, `dashboard/actions.ts:14,52`, `training/actions.ts:26,53,81,102,132`, `training/rsvp/complete/route.ts:32`, `utils/auth/admin.ts:30` | ✅ PASS |
| EL-02: WHEN an error is logged THEN the entry is valid JSON (prod) / pretty (dev) with `time`, `level`, `requestId`, operation name, error message + serialized error | Pino emits `time`+`level` natively; child binds `requestId`+`module`; errors logged via `err` serializer | `logger.ts:5-28` (JSON stdout prod / `pino-pretty` dev); `request-logger.ts:12-16` binds `requestId`/`module`; `assessment/actions.ts:29` — `log.error({ err: error }, "Failed to fetch diagnostic text")`. Runtime sensor output confirmed: `{"level":30,"time":...,"requestId":...,"msg":"..."}` | ✅ PASS |
| EL-03: WHEN a request flows through middleware THEN middleware attaches `x-request-id` (generating one if absent) so downstream actions read the same ID | Middleware sets the header on the **request** so `headers()` downstream returns it | `src/middleware.ts:5-11` — `const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID(); request.headers.set("x-request-id", requestId); const response = await updateSession(request); response.headers.set("x-request-id", requestId);`. **Fix (commit 2fc303f):** the header is now set on the **request BEFORE `updateSession`** (which forwards via `NextResponse.next({ request })`, `src/utils/supabase/middleware.ts:5-7`), so it reaches `headers()` downstream; the response `set` is kept as a client echo. `getRequestLogger` (`request-logger.ts:10`) now reads the propagated ID instead of minting a fresh UUID. **Code-anchored** — propagation path correct; behavioral confirmation across a live authenticated request deferred to the orchestrator's app drive. | ✅ PASS (re-verified) |
| EL-04: WHEN a secret field (`password`, `token`, `apiKey`, `authorization`, `access_token`, `refresh_token`) would be logged THEN the logger redacts it to `[REDACTED]` | Each listed field is replaced with `[REDACTED]` wherever it appears | `logger.ts:8-25` — `redact: { paths: ["password","token","apiKey","authorization","access_token","refresh_token","secret","*.password","*.token","*.apiKey","*.access_token","*.refresh_token","*.secret"], censor: "[REDACTED]" }`. **Fix (commit 2ca323d):** bare root paths added alongside the `*.` wildcards. **Re-verify runtime check** (NODE_ENV unset → JSON stdout, importing the real `logger.ts`): every root-level AND nested secret field output `"[REDACTED]"`; `normal` stayed `"visible"`. | ✅ PASS (re-verified) |
| EL-05: WHEN `pnpm build` runs THEN it succeeds with `pino`/`pino-pretty` declared as `serverExternalPackages` | Build exit 0; no worker.js bundling error | `next.config.ts:5` — `serverExternalPackages: ["pino", "pino-pretty"]`. `pnpm build` (SENTRY_DSN unset) → **exit 0** | ✅ PASS |

### P2: Centralized error capture (GlitchTip)

| Criterion | Spec-defined outcome | `file:line` + code expression | Result |
| --------- | -------------------- | ----------------------------- | ------ |
| EL-06: WHEN a Server Component / Route Handler / Server Action throws unhandled THEN `instrumentation.ts` `onRequestError` forwards to GlitchTip via `Sentry.captureRequestError` (incl. `routeType` context) | `onRequestError` exported as `Sentry.captureRequestError` | `instrumentation.ts:13-14` — `// Capture unhandled errors...` / `export const onRequestError = Sentry.captureRequestError;`; `register()` runtime-gates config imports (`instrumentation.ts:4-10`) | ✅ PASS |
| EL-07: WHEN the app boots THEN `sentry.server.config.ts` + `sentry.edge.config.ts` init `@sentry/nextjs` with `SENTRY_DSN` only when set (no-op when absent) | `enabled: !!process.env.SENTRY_DSN` | `sentry.server.config.ts:4-6` — `Sentry.init({ dsn: process.env.SENTRY_DSN, enabled: !!process.env.SENTRY_DSN, tracesSampleRate: ... })`; `sentry.edge.config.ts:4-6` identical; `sentry.client.config.ts:4-6` identical | ✅ PASS |
| EL-08: WHEN a client-render error escapes React THEN `global-error.tsx` calls `Sentry.captureException` and renders a monochromatic fallback | `captureException` in effect; black/white/gray UI | `src/app/global-error.tsx:14-16` — `useEffect(() => { Sentry.captureException(error); }, [error])`; `:20-41` — `bg-white`, `text-black`/`text-gray-*`, `Button` "Tentar novamente" | ✅ PASS |
| EL-09: WHEN `SENTRY_DSN` is unset THEN the app runs with zero error-capture side effects and no thrown errors about a missing DSN | No DSN error; `enabled: false` | `sentry.*.config.ts:5` — `enabled: !!process.env.SENTRY_DSN`; `pnpm build` with `SENTRY_DSN` unset → exit 0 (no DSN error). Runtime behavioral verify deferred to orchestrator. | ✅ PASS (code-anchored) |

### P3: User-facing error boundaries

| Criterion | Spec-defined outcome | `file:line` + code expression | Result |
| --------- | -------------------- | ----------------------------- | ------ |
| EL-10: WHEN a route segment's component throws during render THEN an `error.tsx` renders a monochromatic fallback with a retry button and does not crash the whole app | `"use client"` boundary, `reset()` button, monochromatic | `src/app/error.tsx:1` `"use client"`; `:15-17` captureException; `:20-37` `bg-white`/`text-black`/`text-gray-*`, `<Button variant="primary" onClick={reset}>Tentar novamente</Button>` | ✅ PASS |
| EL-11: WHEN the root layout itself errors THEN `global-error.tsx` renders a full HTML fallback owning `<html>`/`<body>` | Renders `<html><body>` | `src/app/global-error.tsx:19-41` — `<html lang="pt-BR"><body className="antialiased">...</body></html>` | ✅ PASS |
| EL-12: WHEN an error boundary renders THEN it reports to GlitchTip exactly once and shows `error.digest` as a reference code when present | `captureException` once per error; `digest` shown when defined | `error.tsx:15-17` — `useEffect(..., [error])` (runs once per error instance); `:26-30` — `{error.digest ? <p>Código de referência: {error.digest}</p> : null}`; `global-error.tsx:14-16` + `:28-32` identical | ✅ PASS (code-anchored) |

### P4: Structured Server Action results

| Criterion | Spec-defined outcome | `file:line` + code expression | Result |
| --------- | -------------------- | ----------------------------- | ------ |
| EL-13: WHEN a Server Action succeeds THEN it returns `{ data: T; error: null }` | `ok()` factory returns that shape | `src/utils/actions/types.ts:18-20` — `export function ok<T>(data: T): ActionResult<T> { return { data, error: null }; }`; used `assessment/actions.ts:37,100` | ✅ PASS |
| EL-14: WHEN a Server Action fails THEN it returns `{ data: null; error: { code; message; details? } }` AND logs the structured error with the request logger | `fail()` factory; logged via `getRequestLogger` | `src/utils/actions/types.ts:22-28` — `fail(code, message, details?)` → `{ data: null, error: { code, message, details } }`; `assessment/actions.ts:27-31` (db_error), `:33-35` (not_found), `:52-56` (unauthorized), `:65-69` (not_found), `:90-98` (db_error) — each preceded by `log.error({ err }, "Failed to ...")` | ✅ PASS |
| EL-15: WHEN at least one existing action (`getRandomDiagnosticText` / `saveDiagnosticSession`) is migrated THEN its caller renders a user-visible error message derived from `error.message` instead of a blank screen | Caller branches on `result.error` and surfaces `error.message` | `src/app/(authenticated)/assessment/quiz/page.tsx:117-119` — `if (result.error) { setError(result.error.message); return; }` (caller of `saveDiagnosticSession`). Note: `getRandomDiagnosticText`'s caller `startAssessment` (`assessment/actions.ts:225-228`) redirects to `/error` rather than rendering `error.message` — but the spec requires "at least one" caller; the quiz page satisfies it. | ✅ PASS |
| EL-16: WHEN an unmigrated action is left as-is THEN it still compiles and runs unchanged (no big-bang migration) | Unmigrated actions keep returning raw `T | null`; build passes | `admin/texts/actions.ts:70` `getTextById(...): Promise<Text | null>` unchanged; `quiz/page.tsx:41` still uses `if (!data)`. `pnpm build` → exit 0. | ✅ PASS |

**Status**: ✅ **All 16 ACs verified** (EL-03 & EL-04 re-verified round 1 — both closed) / 0 ⚠️ spec-precision gaps

---

## Edge Cases

- [x] **SENTRY_DSN unset → silent no-op, logging still works.** `sentry.*.config.ts:5` `enabled: !!process.env.SENTRY_DSN`; logger is independent of Sentry. Build passed with DSN unset. ✅
- [x] **GlitchTip unreachable → SDK fails gracefully; request completes; error still in Pino log.** Code-anchored — Sentry SDK swallows transport errors asynchronously; actions `return` the `ActionResult` regardless of Sentry. Runtime behavioral verify deferred. ✅ (code-anchored)
- [x] **Middleware on a path it shouldn't instrument → correlation ID propagates without breaking Supabase session refresh.** Supabase session refresh is NOT broken (`updateSession` called unchanged, `middleware.ts:10`). Correlation-ID propagation is now correct (see EL-03 re-verify): the header is set on the forwarded request, so it reaches downstream `headers()`; behavioral confirmation deferred to the orchestrator's app drive. ✅ (code-anchored)
- [x] **Non-serializable / circular error object → logger serializes safely.** All action log calls use Pino's `err` serializer (`log.error({ err: error }, ...)`, e.g. `assessment/actions.ts:29`); Pino's built-in `err` serializer handles circular refs without throwing. ✅ (code-anchored)
- [x] **Server Action with no `x-request-id` header → logger generates a UUID on the fly.** `request-logger.ts:10` — `headerList.get("x-request-id") ?? crypto.randomUUID()`. ✅ (this fallback is, in fact, the path that always fires today because of the EL-03 gap)

---

## Gate Check

- **Gate command**: `unset SENTRY_DSN; pnpm build` (Build-level gate per tasks.md; `pnpm lint` is NOT pass/fail — 83 pre-existing out-of-scope errors)
- **Result**: `pnpm build` → **exit 0** (✅ pass). Static prerender of 22/22 pages succeeded.
- **Test count before / after feature**: N/A — no test framework (CLAUDE.md). The "test count" delta concept does not apply; verification is build + behavioral.
- **Scoped lint gate** (`pnpm exec biome check <14 touched files>`): 5 errors / 7 warnings reported, **all pre-existing** (confirmed by running biome on the `c55317a` version of the same files — `noExplicitAny` at `actions.ts:151/208`, `noUnusedImports`/`noUnusedVariables`/`organizeImports` at `actions.ts:3/9/78`, `useImportType` at `middleware.ts:1`, `useParseIntRadix`/`useExhaustiveDependencies`/unused `err` at `quiz/page.tsx`). **Feature-introduced lint errors = 0.** ✅
- **Failures**: none at the gate.
- **Re-verify round 1**: `unset SENTRY_DSN; pnpm build` → **exit 0** again after fixes 2fc303f + 2ca323d. The 1 biome `useImportType` WARNING on `middleware.ts:1` is pre-existing (`import { type NextRequest }` was already present at `c55317a`), not introduced by the fix.

---

## Discrimination Sensor (adapted — no test runner)

Sensor depth: **lightweight** (this is not a P0 path). Mutations run in scratch state only; real working tree restored after each.

| # | Mutation | File:line | Description | Killed? |
| - | -------- | --------- | ----------- | ------- |
| 1 | `ok()` returns `{ data: null, error: null }` (breaks `data: T` contract) | `src/utils/actions/types.ts:19` | `return { data, error: null }` → `return { data: null, error: null }`; ran `pnpm build` | ✅ **Killed by tsc** — `Type error: Type '{ data: null; error: null; }' is not assignable to type 'ActionResult<T>'. Type 'null' is not assignable to type 'T'.` (build exit 1). Restored via `git checkout`. |
| 2a | Remove `"*.token"` from redact paths | `src/utils/logging/logger.ts:11` | Deleted the `"*.token",` line; ran runtime Node script importing the real `logger.ts` with a nested `auth.token` field | ✅ **Killed at runtime** — nested `token` flipped from `"[REDACTED]"` → `"nested-token"` (observable behavior change proves the redact config is load-bearing). Restored via `git checkout`. |
| 2b | (Finding, not a mutation) Top-level `password`/`token`/`apiKey`/`access_token`/`refresh_token`/`secret` already NOT redacted by the unmutated code | `src/utils/logging/logger.ts:10-16` | Runtime output: only `authorization` redacted at root; `*.X` wildcards do not match root keys | ❌ **Survived** (was the EL-04 gap). **Re-verified round 1:** after fix 2ca323d added bare root paths, the same runtime check now redacts ALL root-level AND nested secret fields → the gap is closed (the config is now load-bearing for root keys too). |
| 3 | `sentry.*.config.ts` `enabled: true` (force-enable with no DSN) | `sentry.server.config.ts:5` | Hypothetical mutation; no test runner asserts no-op behavior | ⏭️ **Code-anchored; behavioral discrimination deferred to app-level verification.** Build passing with `SENTRY_DSN` unset + `enabled: !!SENTRY_DSN` is the available evidence; tsc cannot catch a behavioral no-op regression. Not claimed as killed. |

**Result**: 2 killed (1 tsc, 1 runtime), 1 code-anchored-deferred; the EL-04 surviving mutant was resolved by the fix (re-verified at runtime).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| No features beyond what was asked | ✅ — `instrumentation-client.ts` is the standard Next.js hook for client Sentry init (needed for `global-error.tsx` `captureException`); no extra integrations (no Replay/Profiling, per design) |
| No abstractions for single-use code | ✅ — `ok`/`fail` factories are reused across 5 failure paths; `getRequestLogger` reused across ~12 call sites |
| No unnecessary "flexibility" | ✅ — `LOG_LEVEL`/`SENTRY_*` env knobs are spec'd, not gold-plating |
| Only touched files required for task | ✅ — diff is limited to the listed feature files + mechanical `console.*` removals |
| Didn't "improve" unrelated code | ✅ — `console.*` swaps preserved existing return shapes for unmigrated actions |
| Matches existing patterns/style | ✅ — Server Actions, `createClient()`, `Button`/`Card` reuse per `agent_docs/ui-ux_guidelines.mdc` |
| Would senior engineer approve? | ✅ (all 16 ACs verified after re-verify) |
| Spec-anchored outcome check (asserted values match spec) | ✅ for 16/16 (EL-03 & EL-04 re-verified and closed) |
| Per-layer Coverage Expectation met | ✅ — build gate is the configured coverage layer; no tests required by matrix |
| Every verification maps to a spec AC / edge case / Done-when | ✅ |
| Documented guidelines followed | ✅ — `CLAUDE.md` (no test framework, Server Actions, monochromatic UI), `agent_docs/ui-ux_guidelines.mdc` (Card/Button, black/white/gray), `docs/business_rules.md` (WPM calc preserved in `saveDiagnosticSession`) |

---

## Fix Plans

> **Re-verify round 1 (after orchestrator applied fixes):** both fixes confirmed below.
> Original fix-task text retained for traceability; see the "Resolved" note atop each.

### Fix 1: Middleware does not propagate `x-request-id` to downstream server code (EL-03) — Major — ✅ RESOLVED (commit 2fc303f)

- **Root cause**: `src/middleware.ts:7` set the header on the `response` object only. `headers()` in Server Components/Actions reads the **request** headers, which `updateSession` forwards via `NextResponse.next({ request })` using the **unmutated** original request — so the ID never reached downstream. Every `getRequestLogger()` call fell back to `crypto.randomUUID()` (a different ID per call), breaking request-wide correlation.
- **Applied fix**: `src/middleware.ts:9` — `request.headers.set("x-request-id", requestId);` BEFORE `await updateSession(request)` (response `set` kept as client echo). Mirrors the file's existing `request.cookies.set(...)` idiom.
- **Re-verify (code-anchored)**: read `src/middleware.ts:4-12` + `src/utils/supabase/middleware.ts:5-7` — the forwarded request now carries `x-request-id`, so `getRequestLogger` (`request-logger.ts:10`) reads it instead of minting a fresh UUID. Propagation path is correct. Behavioral confirmation across a live authenticated request deferred to the orchestrator's app drive (requires running app + Supabase).
- **Priority**: Major (correlation is the core DX promise of P1).

### Fix 2: Top-level secret fields are not redacted (EL-04) — Major (security-adjacent) — ✅ RESOLVED (commit 2ca323d)

- **Root cause**: `src/utils/logging/logger.ts:10-16` used only `*.password`, `*.token`, etc. Pino's `*.` wildcard matches **nested** paths only, not root-level keys. Only `authorization` (listed without `*.`) was redacted at root.
- **Applied fix**: `src/utils/logging/logger.ts:9-23` — bare root paths (`password`, `token`, `apiKey`, `authorization`, `access_token`, `refresh_token`, `secret`) added alongside the `*.` wildcards.
- **Re-verify (runtime)**: ran `node --experimental-strip-types` on a temp script importing the real `logger.ts`, logging `{ password, token, apiKey, authorization, access_token, refresh_token, secret, nested: { token, password, ... }, normal }`. Output: **every root-level AND nested secret field = `"[REDACTED]"`**; `normal` = `"visible"`. This is the real discrimination evidence for EL-04 — the redact config is now load-bearing for root keys too. Temp script deleted; no real code modified.
- **Priority**: Major (secret leakage in logs).

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| EL-01 | Pending | ✅ Verified |
| EL-02 | Pending | ✅ Verified |
| EL-03 | Pending | ✅ Verified (re-verified round 1, code-anchored) |
| EL-04 | Pending | ✅ Verified (re-verified round 1, runtime) |
| EL-05 | Pending | ✅ Verified |
| EL-06 | Pending | ✅ Verified |
| EL-07 | Pending | ✅ Verified |
| EL-08 | Pending | ✅ Verified |
| EL-09 | Pending | ✅ Verified (code-anchored) |
| EL-10 | Pending | ✅ Verified |
| EL-11 | Pending | ✅ Verified |
| EL-12 | Pending | ✅ Verified (code-anchored) |
| EL-13 | Pending | ✅ Verified |
| EL-14 | Pending | ✅ Verified |
| EL-15 | Pending | ✅ Verified |
| EL-16 | Pending | ✅ Verified |

---

## Summary

**Overall**: ✅ **Ready** (all 16 ACs verified after re-verify round 1)

**Spec-anchored check**: 16/16 ACs matched spec outcome | 0 spec-precision gaps | 0 GAPs
**Gate**: `pnpm build` → exit 0 (SENTRY_DSN unset); scoped lint = 0 feature-introduced errors
**Sensor** (adapted): 3 mutations — 2 killed (1 tsc, 1 runtime), 1 code-anchored-deferred; the EL-04 surviving mutant was resolved by the fix (re-verified at runtime)

**What works**: Pino structured logging across all server surfaces (zero `console.*` in `src/`); `getRequestLogger` async helper binding `requestId`/`userId`/`module`; middleware propagates `x-request-id` on the forwarded request (EL-03 fixed); Pino `err` serializer for safe error serialization; secret redaction at both root and nested paths (EL-04 fixed); dev pretty / prod JSON transport; `ActionResult<T>` discriminated union with `ok`/`fail` enforced by tsc; `assessment/actions.ts` migrated with `quiz/page.tsx` rendering `error.message`; Sentry/GlitchTip instrumentation with `enabled: !!SENTRY_DSN` no-op gate; `error.tsx` + `global-error.tsx` monochromatic fallbacks with `captureException` + `error.digest` reference code; `serverExternalPackages` for pino; build passes.

**Issues found**: none remaining. Both round-0 gaps (EL-03, EL-04) closed in re-verify round 1.

**Next steps**: Orchestrator's behavioral pass — boot `pnpm dev` + Supabase, throw synthetic errors in a route/Server Component/Server Action, confirm Pino log lines carry the SAME `requestId` as the middleware-generated `x-request-id` response header (EL-03 behavioral close), confirm `error.tsx`/`global-error.tsx` fallbacks render, confirm GlitchTip no-ops cleanly with `SENTRY_DSN` unset and captures when set.

**Next steps**: Route Fix 1 + Fix 2 back to an implementer; re-verify those two ACs (max 3 fix→re-verify iterations). Both are small, localized edits.

---

## Behavioral Verification (orchestrator pass, post-Verifier)

Run after the Verifier PASS, against a live `pnpm dev` server (Supabase local
backend optional for the items below). Records what was confirmed at runtime vs.
deferred to the user's environment.

| AC | Behavioral check | Result |
| -- | ---------------- | ------ |
| EL-09 | `pnpm dev` boots cleanly with `SENTRY_DSN` unset — Ready in ~2.6s, no DSN errors, no error-capture side effects | ✅ Confirmed at runtime |
| EL-03 (partial) | `x-request-id` response header present on `/login` (e.g. `x-request-id: 6127045f-…`) — middleware emits the header end-to-end | ✅ Confirmed at runtime (response echo) |
| — (boot hygiene) | `@sentry/nextjs` "ACTION REQUIRED" warning about missing `onRouterTransitionStart` → eliminated by `export const onRouterTransitionStart = Sentry.captureRouterTransitionStart` in `instrumentation-client.ts` (commit 511f945); `grep -c "ACTION REQUIRED"` = 0 after dev restart | ✅ Confirmed at runtime |
| EL-03 (full) | Same `requestId` appears in a Pino log line as in the middleware `x-request-id` response header across a live **authenticated** request | ⏸️ Deferred — needs running Supabase local backend to complete an authed round-trip |
| EL-10 / EL-11 / EL-12 | `error.tsx` / `global-error.tsx` actually render a monochromatic fallback + `error.digest` reference on a thrown render | ⏸️ Deferred — needs a synthetic throw driven through a live route |
| EL-06 / EL-07 (capture) | GlitchTip receives an event when `SENTRY_DSN` is set to a live GlitchTip instance | ⏸️ Deferred — needs a running GlitchTip instance + `SENTRY_DSN` |

**Behavioral gate verdict**: feasible portion ✅ confirmed (clean boot, header
emission, boot warning eliminated). The three deferred items require the user's
running Supabase backend (for an authenticated round-trip) and/or a live
GlitchTip DSN; they are offered as a joint drive-through, not blockers — the
no-op-gated design means the app is fully functional without them.

**Final commit added in this pass**: `511f945 fix(observability): export onRouterTransitionStart to silence Sentry boot warning`.