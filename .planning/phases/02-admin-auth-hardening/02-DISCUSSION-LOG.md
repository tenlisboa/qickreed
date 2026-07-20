# Phase 2: Admin Auth Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 2-Admin-Auth-Hardening
**Areas discussed:** Non-admin failure mode, Reads authorization policy, ActionResult refactor scope, Regression test coverage

---

## Non-admin failure mode

### Q1 — Direct-POST failure behavior

| Option | Description | Selected |
|--------|-------------|----------|
| redirect() (keep current) | Call `await checkAdminAccess()` first; it redirects on non-admin. Action never returns. Matches criterion 1 literally and current behavior. Browser + curl attackers both see a 30x redirect. Tests must assert NEXT_REDIRECT is thrown. | ✓ |
| verifyAdmin() returning fail("forbidden") | New helper that returns `ActionResult<Never> fail("forbidden")` instead of redirecting. Action returns error to caller. Programmatic attackers see a structured forbidden response. | |
| Both — redirect for browser calls, fail() for direct POST | Keep checkAdminAccess() (redirect) for happy path; add verifyAdmin() for direct-POST edge cases. Too complex — actions don't know the caller. | |

**User's choice:** redirect() (keep current)
**Notes:** Criterion 1 says "redirected away" — literal reading wins. Roadmap Notes about `ActionResult<T>` applies to the action's success/error return shape, not the auth-block path.

### Q2 — Block logging

| Option | Description | Selected |
|--------|-------------|----------|
| Log warn before redirect | Add `log.warn({ userId, action }, ...)` inside `checkAdminAccess()` before redirect. Gives GlitchTip/Sentry visibility into repeat offenders. | ✓ |
| No logging — keep silent redirect | The redirect IS the signal. Logging adds noise for non-admins who hit stale form tabs. | |
| Log only on direct-POST signal | Detect programmatic call (Referer / content-type). Complex + false negatives. | |

**User's choice:** Log warn before redirect
**Notes:** Defense-in-depth audit trail; warn level (not error) since blocked attempt ≠ malfunction.

### Q3 — Continue/finish area

| Option | Description | Selected |
|--------|-------------|----------|
| Next area | Move to Reads authorization policy | ✓ |
| More questions | Continue this area (test ergonomics for NEXT_REDIRECT, ordering vs createClient, error message text) | |

**User's choice:** Next area

---

## Reads authorization policy

### Q1 — getTexts policy

| Option | Description | Selected |
|--------|-------------|----------|
| Add checkAdminAccess() first | getTexts becomes admin-only at both app + DB layers. Matches RLS intent (admin list is the only consumer). | ✓ |
| Return fail("forbidden") for non-admins | Verify role in-action and return fail. Inconsistent failure modes vs mutating actions (which redirect). | |
| Keep open (document as deliberate) | Authenticated users can list all texts (titles only). Minimal security gain from locking down. | |

**User's choice:** Add checkAdminAccess() first

### Q2 — getTextById policy

| Option | Description | Selected |
|--------|-------------|----------|
| Keep public-authenticated read (document) | Stays as-is; SEC-02 satisfied by documenting rationale in CONTEXT.md. Shared read used by assessment/training. | |
| Split into getTextById (public-auth) + getAdminTextById (admin) | Two functions; admin edit gets audited copy. More footprint, duplicates 8 callers' imports. | |
| Restrict to owned session callers via context check | Refuses if text ID not linked to caller's session. Breaks diagnostic-start (text fetched before session row exists). | |

**User's choice (free text):** Restrict to owned session and refactor the diagnostic-start so it can start a session first.

### Q3 — Scope reconciliation for the user's Q2 choice

| Option | Description | Selected |
|--------|-------------|----------|
| Defer owned-session tightening to a new phase | Phase 2 keeps getTextById public-auth-read with rationale recorded. New phase does diagnostic-start + training-start pre-create refactors. Clean separation; no regression risk. | ✓ |
| Fold into Phase 2 | Phase 2 expands to cover reads-ownership + diagnostic-start + training-rsvp-start refactors. Higher regression risk on shipped capabilities. | |
| Phase 2 does reads-ownership only; defer the start refactor | Locks getTextById against owned session now. Inevitably breaks assessment + training. Not viable. | |

**User's choice:** Defer owned-session tightening to a new phase
After the scope reality-check showed that the user's Q2 choice requires refactoring two shipped flows (assessment + training) outside Phase 2's stated goal, the user chose to defer the tightening. Final getTextById policy: keep public-auth-read, document rationale.

### Q4 — Rationale record location

| Option | Description | Selected |
|--------|-------------|----------|
| CONTEXT.md only (this phase) | Decisions live in 02-CONTEXT.md. Researcher + planner read it. Sufficient for v1. | ✓ |
| Also annotate the code (`// public-auth — see 02-CONTEXT.md`) | Inline comment above getTextById export. Tiny docs cost. | |
| Both, plus a CHANGELOG/security note in REQUIREMENTS.md | Heavyweight for a single-function policy. Skip. | |

**User's choice:** CONTEXT.md only (this phase)

---

## ActionResult refactor scope

### Q1 — Refactor width

| Option | Description | Selected |
|--------|-------------|----------|
| All 5 actions to ActionResult<T> | Mutating actions become `ActionResult<{ id: string }>` etc. Reads become `ActionResult<TextListResult>` and `ActionResult<Text \| null>`. Single convention across the file; callers updated. | ✓ |
| Only the 3 mutating actions | Reads keep current shapes (throws / null-return). Smaller diff but two conventions in one file. getTexts can't return fail("forbidden"). | |
| Only what getTexts needs for fail("forbidden") | Minimal: only getTexts migrates. Mutating actions keep ad-hoc. Inconsistent. | |

**User's choice:** All 5 actions to ActionResult<T>

### Q2 — Error code mapping

| Option | Description | Selected |
|--------|-------------|----------|
| You decide — planner maps codes | Planner maps: pre-RLS db failures → db_error, missing text → not_found, etc. The forbidden path won't fire because checkAdminAccess() redirects first. | ✓ |
| Lock the mapping in CONTEXT.md now | Specify exact code per case now. Prescriptive but locks details planner is better positioned to refine. | |
| Skip migration — don't change error shapes | Conflict with roadmap Notes. Not viable. | |

**User's choice:** You decide — planner maps codes

---

## Regression test coverage

### Q1 — Coverage breadth

| Option | Description | Selected |
|--------|-------------|----------|
| Server Action security regression tests | Tests cover: (1) mutating actions call checkAdminAccess first; (2) getTexts forbidden for non-admin; (3) getTextById open for non-admin (documents deliberate open read). Mock supabase-js + checkAdminAccess. | ✓ |
| Skip tests — Phase 2 is a refactor, verified by lint+build | No new tests. Hardening correctness asserted by manual verification + lint/build only. | |
| Smoke test only (getTexts forbidden for non-admin) | One test asserting the central auth-bypass is blocked. Smaller footprint. | |

**User's choice:** Server Action security regression tests

### Q2 — Mocking strategy

| Option | Description | Selected |
|--------|-------------|----------|
| vi.mock('@/utils/auth/admin') with a fake checkAdminAccess | Replace with stub that resolves (admin) or throws (non-admin). Tests focus on action logic + calling order + return shape. | |
| Mock at the supabase level only | Stub `createClient()` + `auth.getUser()` + profiles query. Tests checkAdminAccess end-to-end including the redirect throw. Higher fidelity but brittler — coupled to Next internals. | ✓ |
| Planner decides | Capture "add tests" as a decision; let planner + executor pick strategy. | |

**User's choice:** Mock at the supabase level only
**Notes:** User explicitly chose higher-fidelity supabase-level mocking despite the brittleness warning. Tests will exercise `checkAdminAccess()` end-to-end; the planner/executor must handle the `redirect()` throw in the test env (assert on observable side effects: no Supabase mutating call, action did not return normally) rather than asserting the redirect URL string.

### Q3 — Quality gate

| Option | Description | Selected |
|--------|-------------|----------|
| Keep `lint && build` gate, vitest additive (AD-002) | Per AD-002 + PROJECT.md constraints. Tests pass when run but the per-task gate doesn't run them. Phase 4 owns any gate-policy doc update. | ✓ |
| Add `pnpm test:run` to the per-task gate from Phase 2 | Bake tests into the gate now. Conflicts with Phase 4's doc role. | |

**User's choice:** Keep `lint && build` gate, vitest additive (AD-002)

---

## Done check

### Q1 — Anything else unclear?

| Option | Description | Selected |
|--------|-------------|----------|
| I'm ready for context | Write 02-CONTEXT.md with the 4 captured decisions + the deferred owned-session tightening. Commit it. | ✓ |
| Explore more gray areas | 2-4 additional gray areas (ordering vs createClient, log wording, QuizEditor reuse, revalidatePath after redirect). | |

**User's choice:** I'm ready for context

---

## Agent's Discretion

- Exact `ActionErrorCode` mapping per case (planner picks against real code paths; suggested starting point in D-08 of CONTEXT.md).
- Whether to inline `checkTextInUse` into `deleteText` or leave it as a separately exported function.
- Logger module-tag string inside `checkAdminAccess()`.
- Test file naming and grouping.
- Optional regression assertion that `revalidatePath` is NOT called when the auth block throws.

## Deferred Ideas

- **Owned-session tightening for `getTextById`** + refactors of `assessment/start` and `training/rsvp/start` to pre-create session rows before the reading page fetches text. → new future phase (candidate name: "Owned Read Authorization"). Note: should be considered together with the `prepareTrainingText` user-submitted-text exposure concern (CONCERNS.md).
- C-2 `setAll` cookie swallow narrowing — v2 COOKIE-01/02 (already deferred).
- `as unknown as` / `as any` Supabase join casts removal (including `checkAdminAccess`'s `user: any` return type) — v2 TYPE-01/02 (already deferred).
- AGENTS.md alignment with vitest toolchain — Phase 4.