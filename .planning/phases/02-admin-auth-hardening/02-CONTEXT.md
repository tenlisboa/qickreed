# Phase 2: Admin Auth Hardening - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Defense-in-depth so mutating admin Server Actions in `src/app/(authenticated)/admin/texts/actions.ts` (`createText`, `updateText`, `deleteText`) re-check the role via `checkAdminAccess()` as their **first statement** — independent of `admin/layout.tsx` — before reaching any Supabase mutating call. The two read actions (`getTexts`, `getTextById`) get a deliberate, documented authorization policy. All 5 actions are migrated to `ActionResult<T>` via `ok()`/`fail()` (AD-001) — replacing the current ad-hoc `{ success, error? }` shapes — so a non-admin who reaches an RLS-rejected mutation no longer sees a misleading `success: true`.

**In scope:**
- Add `await checkAdminAccess()` as the first statement of `createText`, `updateText`, `deleteText`.
- Make `getTexts` admin-only at the application layer (call `checkAdminAccess()` first). Document `getTextById` as deliberately public-authenticated-read.
- Migrate all 5 actions to `ActionResult<T>` via `ok()`/`fail()` from `src/utils/actions/types.ts`.
- Add a Pino `warn` log inside `checkAdminAccess()` (or a guardian wrapper) when a non-admin is blocked, before the redirect throws.
- Add Server Action security regression tests covering: admin succeeds / non-admin blocked before Supabase call / `getTexts` forbidden for non-admin / `getTextById` returns data for authenticated non-admin (documents the deliberate open read).
- Keep the per-task quality gate at `pnpm lint && pnpm build` (AD-002); vitest runs as additive coverage.

**Out of scope (deferred):**
- Tightening `getTextById` to require an owned-session row (the "owned read" policy) + the prerequisite refactors to `assessment/start` and `training/rsvp/start` that pre-create session rows. Tracked under "Deferred Ideas" — own future phase.
- Narrowing the `setAll` cookie handler in `src/utils/supabase/server.ts:15-25` (v2 COOKIE-01/02).
- Removing `as unknown as` / `as any` casts (v2 TYPE-01/02).
- AGENTS.md docs alignment (Phase 4 owns it).

</domain>

<decisions>
## Implementation Decisions

### Non-admin failure mode (mutating actions)
- **D-01:** Use the existing `checkAdminAccess()` from `src/utils/auth/admin.ts` unchanged — it calls Next's `redirect()` on non-admin, throwing `NEXT_REDIRECT` and stopping the action before any Supabase call. Mutating actions simply add `await checkAdminAccess()` as their first statement. Do NOT introduce a new `verifyAdmin()`-style helper returning `fail("forbidden")`. Roadmap success criterion 1 ("redirected away by `checkAdminAccess()`") is satisfied literally; the roadmap Notes sentence about `ActionResult<T>` applies to the action's *return* shape on the success/error paths, not to the auth-block path.
- **D-02:** Add a Pino `warn` log inside `checkAdminAccess()` immediately before the `redirect("/dashboard")` for the non-admin case. English message (AD-004) including `userId` and calling context (action/module name if available via the logger module tag). Rationale: gives GlitchTip/Sentry repeat-offender visibility without changing the redirect UX. The existing `error` log on profile-fetch failure stays as-is.

### Reads authorization policy (SEC-02)
- **D-03:** `getTexts` (admin list with search + pagination; sole caller is `src/app/(authenticated)/admin/texts/page.tsx`) becomes admin-only at the application layer. Add `await checkAdminAccess()` as its first statement, mirroring the mutating actions. Non-admins get the same `redirect()` behavior — consistent failure mode across the file.
- **D-04:** `getTextById` stays **public-authenticated-read** (no app-layer auth check). Rationale: it has 8 callers across assessment reading (`assessment/reading/page.tsx:28`), assessment quiz (`assessment/quiz/page.tsx:30`), training RSVP session (`training/rsvp/session/page.tsx:25`), and the admin edit page — all of them are legitimate authenticated-user flows. RLS already permits any authenticated user to read all `text` rows. This is a deliberate, documented choice — NOT an accident. SEC-02 is satisfied by this recording. Do not "re-tighten" by adding a role check here.
- **D-05:** The rationale for D-04 lives in `02-CONTEXT.md` only. Do not add inline source-code comments above `getTextById`. (Rationale: keep the file clean; CONTEXT.md is the canonical record for downstream agents. If the team later wants nullable inline docs, that's a separate decision.)

### ActionResult refactor scope
- **D-06:** Migrate **all 5** actions in `src/app/(authenticated)/admin/texts/actions.ts` to `ActionResult<T>` via `ok()`/`fail()` from `src/utils/actions/types.ts`. New return types:
  - `getTexts(params): Promise<ActionResult<TextListResult>>` — `fail("forbidden" | "db_error", ...)` paths.
  - `getTextById(id): Promise<ActionResult<Text | null>>` — `fail("db_error", ...)`, `ok(null)` when the row is missing (no need for `not_found` since missing rows are a normal empty case in the public-read flow).
  - `createText(data): Promise<ActionResult<{ id: string }>>`.
  - `updateText(id, data): Promise<ActionResult<null>>`.
  - `deleteText(id): Promise<ActionResult<null>>`.
- **D-07:** The authentic block path on mutating actions and `getTexts` is **`redirect()`** (per D-01/D-03) — these actions never return `fail("unauthorized")` for the auth case because `checkAdminAccess()` throws before the return. The `unauthorized` error code stays available on the union for actions that choose it later, but no Phase 2 action emits it.
- **D-08:** Planner + executor pick the exact `ActionErrorCode` per case (`unauthorized | not_found | db_error | validation | unknown` from `src/utils/actions/types.ts`) against the real code paths. Suggested starting point: `checkTextInUse` rejection in `deleteText` → `fail("validation", "Este texto não pode ser deletado pois está sendo usado em sessões de avaliação.")`; Supabase errors → `fail("db_error", "Erro ao ...")` matching current pt-BR strings. Quiz normalization (already silently returns `null` on parse failure — no error case) does NOT introduce a `validation` code unless the planner surfaces a real need.
- **D-09:** Update callers to consume `ActionResult<T>`:
  - `src/app/(authenticated)/admin/texts/page.tsx` (calls `getTexts` twice) — branch on `result.error` vs `result.data`.
  - `src/app/(authenticated)/admin/texts/edit/[id]/page.tsx` (calls `getTextById`, `updateText`).
  - `src/app/(authenticated)/admin/texts/create/page.tsx` (calls `createText`).
  - `src/components/DeleteTextModal.tsx` (calls `deleteText`).
  - Non-admin callers of `getTextById` (`assessment/reading/page.tsx`, `assessment/quiz/page.tsx`, `training/rsvp/session/page.tsx`) — branch on `result.data` only; `result.error` is not expected because there's no auth check in `getTextById` (if it occurs it's a db_error and the existing "couldn't fetch text" branches already handle null — convert accordingly).
  - Do NOT change the assessment/training UI behavior; only adjust how they unwrap the return.

### Regression test coverage
- **D-10:** Add vitest tests in `src/__tests__/` covering:
  1. For each mutating action (`createText`, `updateText`, `deleteText`): when the caller is a non-admin, `checkAdminAccess()` is invoked before any Supabase insert/update/delete — assert no Supabase mutating call was made. The redirect throw is observed (the action does not return normally).
  2. For each mutating action: when the caller is an admin, the Supabase mutating call is invoked and `ok(...)` is returned. `revalidatePath` is called (mock).
  3. `getTexts` blocks non-admins (same redirect throw); returns `ok(TextListResult)` for admins.
  4. `getTextById` returns `ok(Text)` for an authenticated non-admin — documents the deliberate open-read policy from D-04 (regression test for "do not re-tighten this").
  5. Error paths: Supabase insert error → `fail("db_error", ...)`.
- **D-11:** Test mocking strategy: **mock at the supabase level only** — do NOT `vi.mock('@/utils/auth/admin')`. Stub `@/utils/supabase/server`'s `createClient()` to return a fake supabase client whose `auth.getUser()` returns admin vs. member profiles, and whose `.from().select/insert/update/delete` methods assert order/calls. This exercises `checkAdminAccess()` end-to-end including the `redirect()` throw. Planner/executor must handle the `redirect()` throw shape (Next's `NEXT_REDIRECT` is a special error; in the test env it may surface differently — assert on observable side effects: no Supabase mutating call + the action did not return a value). Do not assert on the redirect URL string specifically — that's brittle.
- **D-12:** Quality gate stays `pnpm lint && pnpm build` (AD-002). New tests must pass when run (`pnpm test:run`), but `pnpm test:run` is NOT added to the per-task gate in Phase 2. Phase 4 owns any gate-policy doc update.

### Agent's Discretion
- Exact `ActionErrorCode` mapping per case (D-08).
- Whether to refactor `checkTextInUse` (currently a separately exported function — `deleteText` calls it before mutating; with D-01 it's transitively auth-gated) to inline its check or leave it. Planner's call.
- Logger module-tag string inside `checkAdminAccess()` (e.g. `"checkAdminAccess"` vs `"adminGuard"`). Executor chooses.
- Test file naming and grouping (`admin-texts-actions.security.test.ts` or split per action). Executor chooses.
- Whether to add a regression assertion that `revalidatePath` is NOT called when the auth block throws (since the throw short-circuits it). Executor judgment — nice-to-have.

### Folded Todos
None — no pending todos matched this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project contracts (locked decisions)
- `.specs/STATE.md` — AD-001 (`ActionResult<T>` via `ok()`/`fail()`), AD-002 (test framework status + gate policy), AD-003 (Pino + GlitchTip via `@sentry/nextjs`), AD-004 (English logs / pt-BR user messages). These govern the return shape, logging language, and quality gate for this phase.
- `.planning/REQUIREMENTS.md` §Security — SEC-01 (mutating actions call `checkAdminAccess()` first), SEC-02 (reads policy — admin-only fail OR public-read with documented rationale).
- `.planning/ROADMAP.md` §Phase 2 — Goal, success criteria 1–4, Notes ("Return `ActionResult<T>` via `fail()`/`ok()` (AD-001) rather than ad-hoc shapes").
- `.planning/PROJECT.md` §Constraints / §Key Decisions — RLS-locked schema, `is_admin()` SECURITY DEFINER helper, "RLS still gates writes — this phase complements not replaces it".

### Codebase map (brownfield reference)
- `.planning/codebase/ARCHITECTURE.md` — Server Action conventions and auth layer overview.
- `.planning/codebase/STRUCTURE.md` — file layout for `src/utils/auth/`, `src/utils/actions/`, admin route group.
- `.planning/codebase/CONCERNS.md` — C-2 (`setAll` cookie swallow — deferred v2, cited here so planner doesn't accidentally widen Phase 2 to fix it); "Server Actions rely on layout for admin authorization" (the gap this phase closes); "submitTrainingQuiz returns fabricated values" (Phase 3, not Phase 2).
- `.planning/codebase/INTEGRATIONS.md` — Supabase client wiring.
- `.planning/codebase/TESTING.md` — vitest 4 + Testing Library + jsdom setup; test home is `src/__tests__/`.

### Source files touched by this phase
- `src/app/(authenticated)/admin/texts/actions.ts` — the 5 actions reworked.
- `src/utils/auth/admin.ts` — `checkAdminAccess()` gains the warn log (D-02).
- `src/utils/actions/types.ts` — `ActionResult<T>`, `ok()`, `fail()`, `ActionErrorCode` (already exists — no change expected).
- Callers to update: `src/app/(authenticated)/admin/texts/page.tsx`, `src/app/(authenticated)/admin/texts/edit/[id]/page.tsx`, `src/app/(authenticated)/admin/texts/create/page.tsx`, `src/components/DeleteTextModal.tsx`, `src/app/(authenticated)/assessment/reading/page.tsx`, `src/app/(authenticated)/assessment/quiz/page.tsx`, `src/app/(immersive)/training/rsvp/session/page.tsx`.

### Schema / RLS
- `supabase/migrations/20251016113130_create_profiles_and_roles.sql` — `profiles.role`, `is_admin()` SECURITY DEFINER, SELECT policy "Text is viewable by authenticated users". Confirms `getTextById` open read is RLS-permitted today.

### NOT applicable
- `agent_docs/design.md` / `agent_docs/system.md` — UI design contract. Phase 2 has no UI changes (admin form UX is unchanged). Do NOT block on these.
- `docs/business_rules.md` — reading/RSVP behavioral spec. Phase 2 doesn't touch those flows. Do NOT block on it.
- `AGENTS.md` — will be refreshed in Phase 4. Reading is fine but do not edit it in Phase 2.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/utils/actions/types.ts` — `ActionResult<T>`, `ok()`, `fail()`, `ActionError`, `ActionErrorCode` already ship. The assessment actions in `src/app/(authenticated)/assessment/actions.ts` already call `ok()`/`fail()` — use them as the convention reference for the planner (e.g. `saveDiagnosticSession` at `assessment/actions.ts:99`).
- `src/utils/auth/admin.ts` — `checkAdminAccess()` already returns `{ user, role }` and `redirect()`s on non-admin; `getUserRole()` is the non-throwing sibling if a future caller wants that. Phase 2 only needs to add the warn log + ensure mutating actions and `getTexts` call it first.
- `src/utils/logging/request-logger.ts` — `getRequestLogger({ module })` is the Pino accessor used everywhere in the codebase. Use the same pattern inside `checkAdminAccess()`.
- `src/utils/supabase/server.ts` — `createClient()` async server client. Always the entry point for server-side Supabase; never instantiate `@supabase/supabase-js` directly (project convention).

### Established Patterns
- Server Actions are `"use server"` exported functions; mutation actions return `ActionResult<T>` (AD-001). See `assessment/actions.ts` as the reference.
- Mutating admin actions then call `revalidatePath(...)` on success — keep that pattern in the `ok(...)` branch.
- Logger messages are English, user-facing error messages are pt-BR (AD-004).
- Errors propagate as `fail(code, pt-BR-message, details)`; `details` is logged, never shown to the user.

### Integration Points
- Admin mutations are blocked at the DB by `is_admin()` RLS today; Phase 2 closes the application-layer gap so non-admins never reach RLS for these 5 actions. The RLS policies themselves DO NOT change in Phase 2.
- `getTextById` is the shared read entrypoint for assessment + training + admin edit. Phase 2 changes its **return shape** (to `ActionResult<Text | null>`) — non-admin callers must be updated to unwrap; their logic (read-the-text-by-id) is otherwise unchanged.
- `checkAdminAccess()` sits in `src/utils/auth/admin.ts` which is itself `"use server"`. It is safe to call from inside another Server Action (Next supports this). The redirect throw crosses the action boundary cleanly.

</code_context>

<specifics>
## Specific Ideas

- The user was explicit that programmatic direct-POST attackers should be **redirected** by `checkAdminAccess()` rather than receive an in-band `fail("forbidden")` payload — the failure mode is observable as a redirect response, not as a structured error. Don't "improve" this by switching to a return-error model; the redirect throw is the chosen mechanism.
- The user wants a Pino `warn` log on every non-admin block (not `error`) — it's a blocked-attempt signal, not an application malfunction. Use `log.warn`, not `log.error`.
- The user's reads-policy intent behind `getTextById` is "authenticated user reading a text they're about to consume" — the tightening to "owned session" is acknowledged as the *correct* end state but explicitly deferred to allow the assessment-start + training-start refactors to land in their own phase without regressing shipped flows. Don't sneak the ownership check back in.

</specifics>

<deferred>
## Deferred Ideas

### Owned-session tightening for `getTextById` (+ start-flow pre-create refactors)
**What:** Tighten `getTextById` so it only returns a `text` row when the caller has a `diagnostic_session` or `training_session` row referencing that `text_id`. Requires refactoring `assessment/start` and `training/rsvp/start` to INSERT a provisional session row **before** the reading/session page calls `getTextById`, then pass the session ID forward.
**Why deferred:** Forces non-trivial refactor of two SHIPPED capabilities (assessment + training RSVP, both validated in PROJECT.md). Surface is too large for a hardening phase and risks regressing user flows. Phase 2's stated goal is narrower (admin Server Action defense-in-depth).
**Where it goes:** A new phase (candidate name: "Owned Read Authorization") on the roadmap backlog. Tracks a future v1.x or v2 requirement. Not in this roadmap yet — add via `/gsd-phase --insert` when scoped.
**Related:** CONCERNS.md note about `prepareTrainingText` (`src/app/(authenticated)/dashboard/actions.ts:133-219`) — user-submitted training text rows are today readable by any authenticated user; the owned-session tightening would partially address this and should be considered together when that phase is planned.

### Out-of-scope注意事项 (do not pull into Phase 2)
- C-2 `setAll` cookie handler narrowing — v2 COOKIE-01/02.
- Removing `as unknown as` / `as any` Supabase join casts — v2 TYPE-01/02. (Note: `src/utils/auth/admin.ts` has `user: any` in the `checkAdminAccess` return type — Phase 4 or the TYPE-01 phase will fix it; Phase 2 leaves it alone.)
- AGENTS.md alignment with vitest toolchain — Phase 4.

### Reviewed Todos (not folded)
None — no pending todos matched the phase.

</deferred>

---

*Phase: 2-Admin-Auth-Hardening*
*Context gathered: 2026-07-19*