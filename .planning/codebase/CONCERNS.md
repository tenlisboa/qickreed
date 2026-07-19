---
last_mapped_commit: 46ae8c4be55612ea89f855a285ca2ac3b02d3020
focus: concerns
analysis_date: 2026-07-19
---

# Codebase Concerns

**Analysis Date:** 2026-07-19

## Tech Debt

### Server Actions rely on layout for admin authorization

- Issue: Admin Server Actions in `src/app/(authenticated)/admin/texts/actions.ts` (`createText`, `updateText`, `deleteText`, `getTexts`, `getTextById`) do **not** call `checkAdminAccess()` from `src/utils/auth/admin.ts`. They rely solely on `src/app/(authenticated)/admin/layout.tsx` invoking `checkAdminAccess()`. Next.js Server Actions are invoked via their own POST endpoint (`/__nextjs_original-stack-frame` style), **not** via the route's layout — so a malicious authed user can call the action directly without passing through the admin layout.
- Files: `src/app/(authenticated)/admin/texts/actions.ts`, `src/app/(authenticated)/admin/layout.tsx`
- Impact: Defense-in-depth is missing. RLS still gates writes — `is_admin()` blocks non-admin writes from taking effect (silently returning 0 rows affected for UPDATE/DELETE, raising for INSERT) and `normalizeQuiz` runs before the write — but the action returns misleading `success: true` even when RLS silently rejected the mutation. The verified leak path is read-only: `getTexts()`/`getTextById()` are not admin-only because `text` is SELECT-readable by any authenticated user. AGENTS.md explicitly requires: *"Admin routes must call `checkAdminAccess()` from `src/utils/auth/admin.ts` first … route privileged writes through Server Actions that re-check the role."* — that re-check is missing here.
- Fix approach: Add `await checkAdminAccess()` as the first statement of each mutating admin action (and optionally `getTexts`/`getTextById` if admin-only reads are intended). Return action result types from `src/utils/actions/types.ts` (`fail("forbidden", ...)`) rather than swallowing RLS errors as `success: true`.

### `setAll` cookie handler silently swallows all errors

- Issue: `src/utils/supabase/server.ts:15-25` wraps `cookieStore.set(...)` in `try { ... } catch {}` with an empty catch body. The comment notes this is intentional "if you have middleware refreshing user sessions" — but it swallows **every** cookie-set failure (not just the Server-Component "cannot mutate cookies" case), including genuinely broken/expired/Net decoding failures.
- Files: `src/utils/supabase/server.ts`, `src/utils/supabase/middleware.ts`, `src/middleware.ts`
- Impact: When middleware session-refresh stops working (matcher change, header propagation bug, or `getUser()` short-circuit), this catch becomes a silent black hole — users get into a half-authed state where their cookies fail to set but no error surfaces. AGENTS.md explicitly calls this out: *"don't 'fix' it without removing that coupling."*
- Fix approach: Narrow the catch to only swallow the known Server-Component `cookies()` "read-only" case (detect via the error name/message) and rethrow/log anything else. Alternatively re-key session refresh on a single mechanism (middleware-only) and remove the swallow entirely once coupling is verified by a contract test.

### Pervasive `as unknown as` / `as any` casts for nested joins

- Issue: Supabase nested joins (`text:text_id ( title )`) return objects whose shape isn't modeled in `src/types/database.ts`, forcing ad-hoc casts like `session.text as unknown as { title: string } | null` (6 occurrences) and `(session.text as any)?.title` (3 occurrences in `assessment/actions.ts`).
- Files: `src/app/(authenticated)/training/actions.ts` (lines 76, 214, 266, 330, 392, 449), `src/app/(authenticated)/assessment/actions.ts` (lines 199, 280), `src/app/(authenticated)/admin/texts/components/TextForm.tsx` (lines 56, 85), `src/app/(authenticated)/admin/texts/edit/[id]/page.tsx` (lines 60, 119), `src/app/(authenticated)/admin/texts/create/page.tsx` (line 30)
- Impact: Type-safety is lost on the join boundary; refactoring `text_id` typing or join shape will silently break callers. Also `checkAdminAccess` returns `Promise<{ user: any; role: UserRole }>` — the `any` for `user` propagates unsoundness to every admin page.
- Fix approach: Define a `SupabaseNested<Text, 'text'>` helper type or add explicit interfaces like `TrainingSessionWithText`/`DiagnosticSessionWithText` to `src/types/database.ts` and type the queries with `supabase.from('training_session').select<...>()`. Type the user as `User` from `@supabase/supabase-js` in `checkAdminAccess`.

### AGENTS.md is stale about the test framework

- Issue: AGENTS.md says *"There is **no test framework** configured (no `test` script, no test deps) — do not invent test commands."* Reality: `package.json` has `vitest@^4.1.10`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@vitejs/plugin-react`, scripts `test` (`vitest`) and `test:run` (`vitest run`), and there are test files in `src/__tests__/` (`setup.ts`, `utils.test.ts`).
- Files: `AGENTS.md`, `package.json`, `src/__tests__/utils.test.ts`, `src/__tests__/setup.ts`
- Impact: Future agents following AGENTS.md will refuse to write tests because the rule says none exist; conversely they won't know the established convention. The only covered module is `src/lib/utils.ts` (`calculateWpm`, `isPassingComprehension`, `calculateComprehensionResult`) — coverage is ~0 for the rest of the codebase.
- Fix approach: Update AGENTS.md to reflect vitest + the test scripts. Add a `vitest.config.ts` (none exists today — vitest falls back to defaults) and define a `jsdom` environment so `@testing-library/react` component tests work without per-file `// @vitest-environment jsdom` pragmas.

### Dead code: RSVP regression log never leaves the component

- Issue: `src/components/RsvpDisplay.tsx:194-200` collects `RegressionEvent`s into `regressionLogRef.current` on `selectstart`/`mousedown`, but that array is never sent anywhere or surfaced to the user or logged. The events just accumulate in memory.
- Files: `src/components/RsvpDisplay.tsx:57, 194-200, 253-269`
- Impact: AGENTS.md business rules say *"no upward scroll/regression during reading"* — the UI prevents it (via `selectstart.preventDefault()` + `mousedown.preventDefault()`) but the absence of detection plumbing means we have no analytics on rule violations and QA can't verify. The feature as-coded is half-built.
- Fix approach: Either wire `regressionLogRef.current` into the `onStop`/`onComplete` payload (POST to `/training/rsvp/complete` or a dedicated endpoint) and write to `training_session`/audit log; or delete the regression log plumbing and the `logRegression` callback to remove confusing dead code.

### `submitTrainingQuiz` returns fabricated values

- Issue: `src/app/(authenticated)/training/actions.ts:444-458` constructs the returned `TrainingSessionResult` with `duration_time_s: 0` and `created_at: new Date().toISOString()` — both **invented**. The real `duration_time_s` was stored during `createTrainingSession` (POST `/training/rsvp/complete`), and the real `created_at` from the DB row is never fetched.
- Files: `src/app/(authenticated)/training/actions.ts:349-459`, consumed by `src/app/(authenticated)/training/rsvp/feedback/page.tsx`
- Impact: The feedback page renders duration as "0:00" if it consumes this action's result directly, and the `created_at` shown is the submit time, not the session start time — drift that confuses users reviewing their sessions.
- Fix approach: After the UPDATE, re-SELECT `duration_time_s, created_at` from the row (`data.text` join is already available via a second query or a `.select('...').eq('id', sessionId).single()` post-update) and return those values rather than placeholders.

## Known Bugs

### Feedback/dashboard timeline mixes apples and oranges

- Symptoms: The dashboard "PPM over time" chart plots `diagnostic_session.wpm` (actual measured speed) and `training_session.target_wpm` (the speed the user *aimed* at, not the speed achieved) on the same `ppm` axis.
- Files: `src/app/(authenticated)/dashboard/actions.ts:86-104` (`getDashboardData()`), `src/app/(authenticated)/dashboard/page.tsx`
- Trigger: Any user with at least one diagnostic and one training session opens the dashboard.
- Workaround: None — the rendering uses `ppm` as label, so users see a blended series they reasonably interpret as "speed over time."

### Math.random() text selection re-runs full table scan

- Symptoms: `getRandomTrainingText()` (`src/app/(authenticated)/training/actions.ts:81-116`) and the "random" diagnostic selection path `getRandomDiagnosticText()` (`src/app/(authenticated)/assessment/actions.ts:16-39`, which is actually `ORDER BY created_at DESC LIMIT 1` — not random at all, just "latest diagnostic text") don't honor the documented "randomization business rule."
- Files: `src/app/(authenticated)/training/actions.ts:81-116`, `src/app/(authenticated)/assessment/actions.ts:16-39`
- Trigger: Every `/training` load that fetches a new training text.
- Workaround: None. The training path fetches all `text.id`s into client memory; assessment path silently returns newest text every time, defeating randomization.
- Note: `getRandomDiagnosticText` doesn't actually randomize — it's `ORDER BY created_at DESC LIMIT 1`, returning the newest diagnostic text persistently.

## Security Considerations

### Pasted user training texts leak to all authenticated users

- Risk: `prepareTrainingText` (`src/app/(authenticated)/dashboard/actions.ts:133-219`) inserts a `text` row owned by `user_id` but the SELECT policy `Text is viewable by authenticated users` (`supabase/migrations/20251016113130_create_profiles_and_roles.sql:61-62`) allows **any** authenticated user to read **all** `text` rows — including other users' privately pasted training content and any quiz the LLM generated from it. The same `text` table holds admin-authored content, so a blanket SELECT leaves user-submitted body content globally exposed.
- Files: `supabase/migrations/20260716005000_user_training_text_input.sql`, `supabase/migrations/20251016113130_create_profiles_and_roles.sql:60-62`, `src/app/(authenticated)/dashboard/actions.ts`
- Current mitigation: None at RLS layer. The privacy boundary is implicitly "anything I paste, anyone can read."
- Recommendations: Tighten `text` SELECT to `(user_id IS NULL AND type IN ('diagnostic','training')) OR user_id = auth.uid()` so admin/ownerless texts remain public while user-pasted training texts are only visible to their owner. Update `prepareTrainingText` to scope `getRandomTrainingText` and the dashboard dropdown to public texts plus owned texts.

### LLM endpoint called without rate-limiting or auth-tier isolation

- Risk: `src/lib/llm/client.ts` calls `LLM_BASE_URL` (default `http://localhost:11434/v1`) with up to a 120s `DEFAULT_TIMEOUT_MS` and 4096 max tokens. Each `prepareTrainingText` call (`dashboard/actions.ts:178`) triggers a fresh LLM generation on up to 12k chars of user input. There's no per-user rate-limiting and no queue. A single authenticated user can run the LLM endpoint hot by repeatedly pasting text, and the action waits synchronously for up to 2 minutes tying up the request.
- Files: `src/lib/llm/client.ts`, `src/lib/llm/quiz-schema.ts`, `src/app/(authenticated)/dashboard/actions.ts`
- Current mitigation: Input length ceilings (200–12,000 chars, 5–5,000 words) prevent oversized inputs. Otherwise unbounded.
- Recommendations: Add a Microsoft-style `last_called_at`/`count` per-user check (or a `rate_limit` table) before invoking `generateQuiz`. Consider moving the call to a queue/Edge function with a shorter client-facing timeout (10–20s) and a user-visible "gerando perguntas…" optimistic UI.

### Non-null assertions on query parameters

- Risk: `searchParams.get("textId")!` / `searchParams.get("sessionId")!` discard the null case before the early-return guard runs.
- Files: `src/app/(immersive)/training/rsvp/session/page.tsx:25` (`getTextById(textId!)`), `src/app/(authenticated)/training/rsvp/quiz/page.tsx:105` (`getTrainingSessionDetails(sessionId!)`), `src/app/(authenticated)/training/rsvp/feedback/page.tsx:41` (`getTrainingSessionResult(sessionId!)`)
- Current mitigation: The `useEffect` afterward redirects away when `textId`/`sessionId` is falsy — but only after the first render has already thrown inside `fetchText`/`getTrainingSessionResult` if the param is missing on the initial pass. The `!` lies to the type system about safety that the runtime doesn't actually provide pre-redirect.
- Recommendations: Drop the `!` and guard the early-return inside `fetchText` (e.g., `if (!textId) return;`).

## Performance Bottlenecks

### Diagnostic timeline fetches rows without pagination

- Problem: `getDashboardData` (`dashboard/actions.ts:35-123`) and `getUserDiagnosticHistory` (`assessment/actions.ts:157-201`) fetch all sessions for a user ordered by date with no `LIMIT`. `getTrainingHistory` (`training/actions.ts:40-79`) has the same shape.
- Files: `src/app/(authenticated)/dashboard/actions.ts`, `src/app/(authenticated)/assessment/actions.ts`, `src/app/(authenticated)/training/actions.ts`
- Cause: No upper bound on session count per user; long-term users pull every row on every dashboard load.
- Improvement path: Add `.limit(50)` (or a paginated window via `range`) and document the cap; render "load more" affordance in the dashboard and history routes.

### `getRandomTrainingText` returns entire ID set to the client

- Problem: Fetches every `text.id` where `type='training'` to pick one in JS via `Math.random()`. Today N is small (seed migrations add a handful) but it grows linearly with admin content volume.
- Files: `src/app/(authenticated)/training/actions.ts:81-116`
- Cause: PostgREST can't express `ORDER BY random()`; the workaround chose `select id, *` over a server-side `TABLESAMPLE`.
- Improvement path: Add a `text(type, id)`-indexed RPC `get_random_training_text()` using `ORDER BY random() LIMIT 1` (SECURITY DEFINER, RLS-safe) and call it via `.rpc()`.

## Fragile Areas

### Action result contract partially divergent

- Files: `src/utils/actions/types.ts`, `src/app/(authenticated)/assessment/actions.ts`, `src/app/(authenticated)/dashboard/actions.ts`, `src/app/(authenticated)/training/actions.ts`, `src/app/(authenticated)/admin/texts/actions.ts`
- Why fragile: Some actions return the typed `ActionResult<T>` from `src/utils/actions/types.ts` via `fail()`/`ok()` (assessment, dashboard `prepareTrainingText`); most others in `training/actions.ts` and `admin/texts/actions.ts` return `null` on error or ad-hoc `{ success: boolean; error?: string }`. Callers (especially client pages using `useActionState` for `prepareTrainingText`) have to handle multiple error shapes depending on which action they invoke. Refactoring any action's return shape risks silently breaking every caller — there's no contract test for it.
- Safe modification: Audit which actions return `ActionResult` vs ad-hoc shapes; promote the ad-hoc ones to `ActionResult<T>` and update their callers. Until then, do not assume a `null` return is the only "error path."
- Test coverage: None — the only test (`src/__tests__/utils.test.ts`) covers `lib/utils.ts` pure functions.

### RLS policy for `profiles` UPDATE lets admins rewrite each other's roles

- Files: `supabase/migrations/20251016113130_create_profiles_and_roles.sql:20-28`
- Why fragile: The policy is `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` — any admin can UPDATE any profile's `role` (including promoting themselves to admin and demoting other admins). `set_user_level` (`20260716010000_add_reading_method_and_level.sql`) deliberately routes around this by using SECURITY DEFINER, but the `profiles` UPDATE policy is still broad enough that an admin can flip another user's role to `member` (locking them out of admin area) or to `admin` (escalation).
- Safe modification: Tighten to `id = auth.uid() OR public.is_admin()` and add a separate guard preventing self-demotion. Add a return-type check.
- Test coverage: No SQL-level tests; this is a policy gap that won't show up in app code.

## Scaling Limits

### LLM quiz generation blocks the request thread for up to 2 minutes

- Current capacity: One concurrent `prepareTrainingText` invocation per worker; `LLM_BASE_URL` defaults to `http://localhost:11434/v1` (Ollama local).
- Limit: The default Next.js production runners (likely Node `next start`) don't have request streaming here; a single user pasting text saturates one worker for up to `DEFAULT_TIMEOUT_MS = 120_000ms`. Two users pasting simultaneously doubles response time linearly.
- Scaling path: Move to a queue (Supabase Queues / pg_cron job / a worker function) with an immediate provisional `textId` and a polled completion endpoint. Reduce client-facing timeout to 15–20s.

## Dependencies at Risk

### `import-in-the-middle` / `require-in-the-middle` are transitive OpenTelemetry shims

- Risk: Listed as direct deps in `package.json` (likely pulled in explicitly for `@sentry/nextjs`). Both are known to break on Node releases that change the loader hooks API (broke on Node 22 LTS; future ESM loader changes risk breakage).
- Impact: A breakage prevents the dev server from booting cleanly and surfaces only at runtime.
- Migration plan: Move them out of direct deps (let `@sentry/nextjs` resolve them) once Sentry's bundled version supports the current Node runtime; pin Node major via `.nvmrc` (file does not exist today — see Platform Requirements note in STACK.md scope).

### `next.config.ts` — unvalidated contents

- Risk: Not inspected in this concerns pass, but Sentry must be registered there per `@sentry/nextjs`. If the Sentry config injects the loader hooks above, every change to Next's Turbopack pipeline is a regression hazard.
- Migration plan: Add `next.config.ts` to the lint/CI surface and snapshot the registered `sentry` wrapper config.

## Missing Critical Features

### No request-level rate limiting

- Problem: Beyond the LLM concern above, there is no rate-limit on any mutation endpoint: `/assessment/start`, `/training/rsvp/complete`, `submitTrainingQuiz`, `prepareTrainingText`, admin text CRUD. A malicious authed user can hammer any of these to inflate WPM history or churn the `text` table.
- Blocks: Realistic multi-tenant deploy; commercial/production-readiness audit.

### No CSRF / origin check on `route.ts` POSTs

- Problem: `src/app/(authenticated)/assessment/start/route.ts` and `src/app/(authenticated)/training/rsvp/complete/route.ts` accept POSTs without checking `Origin`/`Sec-Fetch-Site`. Combined with same-site cookies (Supabase session), a cross-site form-based CSRF could force an unwanted text creation on a logged-in user's behalf.
- Blocks: Hardening pass before public availability.

## Test Coverage Gaps

### Server Actions and RLS policies: 0%

- What's not tested: No tests for `assessment/actions.ts`, `training/actions.ts`, `dashboard/actions.ts`, `admin/texts/actions.ts`. No SQL-level tests for RLS policies (`is_admin()`, the `text` and `profiles` policies, owner-only UPDATE). No test for `submitTrainingQuiz` ownership leakage. No test that `prepareTrainingText` rejects oversized/malicious inputs.
- Files: `src/app/(authenticated)/**/actions.ts`, `supabase/migrations/*.sql`
- Risk: The "AGENTS.md says no test framework" stale instruction actively discourages writing tests. Any refactor will land untested.
- Priority: High — start by adding type-only integration tests against `submitTrainingQuiz` ownership and RLS `text` SELECT/UPDATE as the two highest-risk surfaces.

### RsvpDisplay timer correctness: 0%

- What's not tested: `src/components/RsvpDisplay.tsx`'s `requestAnimationFrame` loop, pause/resume accounting (`totalPausedTime`), visibility-change auto-pause, and the 400-word mandatory break. These are the core speed-reading metrics; a regression here corrupts every `TrainingSession.benchmark_wpm` update chain.
- Files: `src/components/RsvpDisplay.tsx`
- Risk: High — a timer bug silently inflates WPM across the whole user base (`submitTrainingQuiz`→`profiles.benchmark_wpm`→next session's target).
- Priority: High — at minimum a `vitest` + `@testing-library/react` test using fake timers asserting: (a) clamp of WPM to [80,800], (b) `totalPausedTime` excludes visibility-hidden intervals, (c) `onComplete` fires with `durationSeconds`≈(end-start-paused)/1000.

---

*Concerns audit: 2026-07-19*