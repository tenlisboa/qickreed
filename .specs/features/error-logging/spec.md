# Error Handling & Logging Specification

## Problem Statement

The development experience is compromised by poor error handling and logging. Server Actions catch Supabase errors, `console.error` them with ad-hoc, inconsistent messages (mixed Portuguese/English), and swallow the failure by returning `null`/`[]`/`false` — so the user sees a blank state and the developer has only a context-free line in the terminal. There are no error boundaries, no structured logging, no correlation IDs, and no centralized error capture. When something breaks in dev or production, there is no quick path to root cause.

## Goals

- [ ] Structured, request-correlated logging across Server Actions, Route Handlers, and Server Components — replacing every bare `console.error`/`console.log`.
- [ ] Centralized error capture (GlitchTip, Sentry-compatible, self-hosted) for both server errors and client-render errors, in dev and production.
- [ ] User-facing error boundaries (`error.tsx` / `global-error.tsx`) so a render failure shows a monochromatic fallback instead of a blank page.
- [ ] A discriminated `{ data, error }` Server Action result type so the UI can surface real error messages; refactored incrementally on the actions touched.
- [ ] Every logged error is traceable via a per-request correlation ID threaded from middleware → action → log → GlitchTip.

## Out of Scope

| Feature | Reason |
| --- | --- |
| OpenTelemetry traces / APM waterfalls | GlitchTip has basic transactions only; full tracing is a separate initiative. |
| Log aggregation platform (Datadog/BetterStack) | Production logs go to stdout (container/PM capture); no external sink wired now. |
| Session Replay / Profiling | GlitchTip does not support these Sentry features. |
| Refactoring every Server Action at once | Hybrid approach: type + helpers now, refactor per-action as touched. |
| Source map upload automation in CI | Optional follow-up; SDK still reports minified errors usefully. |
| Metrics / uptime monitoring | Separate observability concern. |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Error monitoring backend | GlitchTip (self-hosted, Sentry-compatible), used via `@sentry/nextjs` SDK | User chose OSS/self-hosted only; GlitchTip is the de-facto OSS Sentry drop-in. | y |
| DSN env var name | `SENTRY_DSN` (reused by Sentry SDK; points at GlitchTip host) | The SDK reads `SENTRY_DSN`; naming it this way means zero magic. | y |
| Logging library | Pino (singleton + per-request child loggers) | Fastest structured JSON logger in the Node ecosystem; `pino-pretty` for dev. | y |
| Server Action error shape | `ActionResult<T> = { data: T; error: null } \| { data: null; error: ActionError }` | Discriminated union, single interpretation, UI-renderable. | y |
| Correlation ID source | Generated in middleware, set as `x-request-id` response/request header; read via `headers()` in actions | Middleware already wraps every matched route. | y |
| GlitchTip unreachable | Sentry SDK fails gracefully (no throw); logging never blocks the request | External-dependency-failure dimension. | y |
| PII / secrets in logs | Pino `redact` paths for auth fields; never log JWTs/access tokens | Auth-boundary dimension. | y |
| Log level | `info` default in prod, `debug` in dev; overridable via `LOG_LEVEL` | Standard discipline. | y |
| Scope tier | Complex — full Design + Tasks phases | Two tools, new infra files, error-boundary UI, type refactor, ~10 files. | y |

**Open questions:** none — all resolved or logged above.

## User Stories

### P1: Structured request-correlated logging ⭐ MVP

**User Story**: As a developer, I want every server-side error and key event logged as structured JSON with a per-request correlation ID, so that I can trace a single request's path and pinpoint failures without grepping ad-hoc console strings.

**Why P1**: This is the core DX fix the TASK.md asks for; everything else builds on it.

**Acceptance Criteria**:

1. WHEN any Server Action or Route Handler runs THEN it SHALL obtain a request-scoped logger carrying `requestId` (and `userId` when known) via a single helper.
2. WHEN an error is logged THEN the log entry SHALL be valid JSON (prod) or pretty-printed (dev) containing at minimum `time`, `level`, `requestId`, the operation name, and the error message + serialized error object.
3. WHEN a request flows through middleware THEN middleware SHALL attach an `x-request-id` header (generating one if absent) so downstream actions read the same ID.
4. WHEN a secret field (`password`, `token`, `apiKey`, `authorization`, `access_token`, `refresh_token`) would be logged THEN the logger SHALL redact it to `[REDACTED]`.
5. WHEN `pnpm build` runs THEN it SHALL succeed with `pino`/`pino-pretty` declared as `serverExternalPackages` (no worker.js bundling error).

**Independent Test**: Trigger an erroring Server Action locally → `pnpm dev` terminal shows a pretty JSON line with a matching `requestId`; a synthetic `logger.error` in a route handler produces a JSON line in prod mode (`LOG_LEVEL=info pnpm start`).

---

### P2: Centralized error capture (GlitchTip) ⭐

**User Story**: As a developer, I want unhandled server errors and client render errors automatically captured to GlitchTip, so that I get a grouped, stack-traced record of every failure in dev and production.

**Why P2**: Closes the "can't debug quickly" gap for errors that escape try/catch — the ones that crash a render or 500 a route.

**Acceptance Criteria**:

1. WHEN a Server Component render, Route Handler, or Server Action throws an unhandled error THEN `instrumentation.ts` `onRequestError` SHALL forward it to GlitchTip via `Sentry.captureRequestError`, including `routeType` context.
2. WHEN the app boots THEN `sentry.server.config.ts` and `sentry.edge.config.ts` SHALL initialize `@sentry/nextjs` with `SENTRY_DSN` only when set (no-op when absent, so local dev without GlitchTip still runs).
3. WHEN a client-render error escapes React THEN `global-error.tsx` SHALL call `Sentry.captureException` and render a monochromatic fallback.
4. WHEN `SENTRY_DSN` is unset THEN the app SHALL run with zero error-capture side effects and no thrown errors about a missing DSN.

**Independent Test**: With `SENTRY_DSN` pointed at a GlitchTip project, throw a synthetic error in a route handler and in a Server Component → the event appears in the GlitchTip dashboard with a stack trace.

---

### P3: User-facing error boundaries

**User Story**: As a user, I want a failed screen to show a clean "something went wrong, try again" fallback rather than a blank page or crash, so that I can recover and keep using the app.

**Why P3**: Direct UX improvement; pairs with error capture so every boundary-triggered error is also reported.

**Acceptance Criteria**:

1. WHEN a route segment's Server/Client Component throws during render THEN an `error.tsx` in that segment (or the nearest parent) SHALL render a monochromatic fallback with a retry button and not crash the whole app.
2. WHEN the root layout itself errors THEN `global-error.tsx` SHALL render a full HTML fallback (it owns `<html>`/`<body>`).
3. WHEN an error boundary renders THEN it SHALL report the error to GlitchTip exactly once and show the `error.digest` as a reference code when present.

**Independent Test**: Temporarily `throw` inside a route component → the route shows the fallback; remove the throw → the route renders normally.

---

### P4: Structured Server Action results

**User Story**: As a developer, I want Server Actions to return a typed `{ data, error }` result so the UI can show meaningful error messages instead of silently rendering empty states.

**Why P4**: The hybrid refactor — type + helpers land now, each action migrates as it is touched.

**Acceptance Criteria**:

1. WHEN a Server Action succeeds THEN it SHALL return `{ data: T; error: null }`.
2. WHEN a Server Action fails (Supabase error, auth failure, not-found) THEN it SHALL return `{ data: null; error: { code: ActionErrorCode; message: string; details?: unknown } }` AND log the structured error with the request logger.
3. WHEN at least one existing action (the one most likely to surface a blank state — `getRandomDiagnosticText` / `saveDiagnosticSession`) is migrated THEN its caller SHALL render a user-visible error message derived from `error.message` instead of a blank screen.
4. WHEN an unmigrated action is left as-is THEN it SHALL still compile and run unchanged (no forced big-bang migration).

**Independent Test**: Call the migrated action with a non-existent `textId` → caller renders the returned `error.message`; revert and the old null-returning path still compiles.

---

## Edge Cases

- WHEN `SENTRY_DSN` is unset (local dev without GlitchTip) THEN error capture is a silent no-op and logging still works.
- WHEN GlitchTip is unreachable THEN Sentry SDK SHALL fail gracefully (no uncaught throw); the request SHALL still complete and the error SHALL still be in the Pino log.
- WHEN middleware runs on a path it shouldn't instrument THEN the correlation ID SHALL still propagate without breaking the Supabase session refresh.
- WHEN an error object is non-serializable or circular THEN the logger SHALL serialize it safely (Pino handles via `err` serializer) without throwing.
- WHEN a Server Action runs outside a request with no `x-request-id` header THEN the logger SHALL generate a UUID on the fly so logs are never correlation-less.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| EL-01 | P1 | Design | ✅ Verified |
| EL-02 | P1 | Design | ✅ Verified |
| EL-03 | P1 | Design | ✅ Verified (re-verified round 1, code-anchored) |
| EL-04 | P1 | Design | ✅ Verified (re-verified round 1, runtime) |
| EL-05 | P1 | Design | ✅ Verified |
| EL-06 | P2 | Design | ✅ Verified |
| EL-07 | P2 | Design | ✅ Verified |
| EL-08 | P2 | Design | ✅ Verified |
| EL-09 | P2 | Design | ✅ Verified (code-anchored) |
| EL-10 | P3 | Design | ✅ Verified |
| EL-11 | P3 | Design | ✅ Verified |
| EL-12 | P3 | Design | ✅ Verified (code-anchored) |
| EL-13 | P4 | Design | ✅ Verified |
| EL-14 | P4 | Design | ✅ Verified |
| EL-15 | P4 | Design | ✅ Verified |
| EL-16 | P4 | Design | ✅ Verified |

**Coverage:** 16 total, 16 mapped to tasks, 16 verified. See `validation.md`.

## Success Criteria

- [ ] Zero bare `console.error`/`console.log` calls remain in `src/` (replaced by the logger).
- [ ] A thrown error in any route, Server Action, or Server Component shows up in GlitchTip with a stack trace and `requestId` tag.
- [ ] A failed render shows a monochromatic fallback, not a blank page.
- [ ] `pnpm build` and `pnpm lint` pass with the new tooling.
- [ ] At least one Server Action migrated to `ActionResult<T>` with its caller rendering a real error message.