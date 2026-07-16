# Login Error Handling Enhancement Specification

## Problem Statement

Login (and signup) failures in `src/app/(auth)/login/actions.ts` blindly `redirect("/error")`
on any auth error — users get a generic page with no context, no specific message, and no way
back. The form has no loading state, so double-submits are possible. This makes auth failures
opaque and hostile, especially for non-technical pt-BR users.

## Goals

- [ ] Users see a **specific pt-BR message** inline on the login/signup form for each detectable
  auth failure (invalid credentials, unconfirmed email, rate limit, network, generic) — no
  redirect to a generic page for these cases.
- [ ] Submit button shows a **loading/pending state** and prevents double-submission while the
  Server Action runs.
- [ ] Login + signup actions migrate to the **`ActionResult` via `ok()`/`fail()`** convention
  (AD-001), returning a typed error instead of swallowing it into a blind redirect.
- [ ] The `/error` fallback route is enhanced into a real **critical-error fallback** (pt-BR,
  styled, link back to login) for the unexpected/critical cases that cannot be shown inline.

## Out of Scope

| Feature                                           | Reason                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| Password reset / "forgot password" flow logic    | Not broken; only the existing link stays. Out of TASK.md scope.       |
| OAuth / social login error handling               | Not implemented in the codebase.                                      |
| New auth-specific `ActionErrorCode` enum members | Existing codes (`unauthorized`/`unknown`) suffice; raw Supabase error goes in `details` for dev observability. Avoids touching shared types for a Medium feature. |
| Unit/integration test suite                      | AD-002: no test framework. Gate is `pnpm lint && pnpm build`; final verify is behavioral. |
| Mutation/discrimination sensor                   | Requires a test runner (none). AD-002 overrides the skill's default.  |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here — nothing is left silently unclear.

| Assumption / decision                                                          | Chosen default                                                                                                                       | Rationale                                                                                                                        | Confirmed? |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Error-surfacing mechanism                                                      | `useActionState` + inline `<Alert>` from returned `ActionResult`, **not** URL search params                                          | AD-001 mandates `ActionResult` via `ok()`/`fail()`; redirect throws and cannot return a result. User confirmed over TASK.md's search-params snippet. | y          |
| Supabase anti-enumeration folds "user not found" into "Invalid login credentials" | "Usuário não encontrado" is **not** a separately detectable case; user-not-found and wrong-password both map to "Email ou senha inválidos" | GoTrue intentionally returns the same message for both to prevent user enumeration. Detecting them separately would re-introduce an enumeration oracle. | y (security) |
| Error code mapping                                                             | invalid-credentials / email-not-confirmed → `unauthorized`; rate-limit / network / generic → `unknown`                               | Existing `ActionErrorCode` has no auth codes; precise pt-BR distinction lives in `message`, precise dev distinction in `details` (raw Supabase error, English — AD-003/004). | y          |
| Signup parity                                                                  | Apply identical error handling to `signup`                                                                                          | Same `actions.ts`, same blind-redirect bug. User confirmed.                                                                     | y          |
| `/error` route role                                                            | Keep + enhance as critical-error fallback (pt-BR, styled, "back to login" link)                                                     | User confirmed. Reached only for unexpected/critical errors that cannot be shown inline (e.g. action throws before responding). | y          |
| Loading-state component                                                         | New shared `src/components/SubmitButton.tsx` (client, `useFormStatus`)                                                              | No existing `useFormStatus` usage; this feature establishes the pattern. Reusable wrapper per design-system "reuse, don't rebuild". | y          |
| Error mapping helper location                                                   | New `src/utils/auth/errors.ts` — `mapAuthError(supabaseError): ActionError`                                                        | Shared by `login` + `signup`; keeps actions thin; centralizes the 6 cases + pt-BR messages.                                      | y          |

**Open questions:** none — all resolved or logged above.

**Remaining implicit-requirement dimensions N/A for this scope** (Medium): idempotency/retry,
concurrency/ordering, data lifecycle/expiry, state-transition integrity — none apply to surfacing
an auth error to the user. **Present dimensions** covered below: auth boundaries & rate limits
(rate-limit case), failure/partial-failure (network/timeout), observability (Pino log + raw error
in `details`; `app/error.tsx` already reports to Sentry).

---

## User Stories

### P1: Inline specific auth errors on login ⭐ MVP

**User Story**: As a returning user, I want to see exactly why my login failed (wrong password,
unconfirmed email, too many attempts, connection issue) right on the login form, so I can fix it
without guessing or hitting a dead-end page.

**Why P1**: This is the core pain — the blind `/error` redirect. Without it the feature ships nothing.

**Acceptance Criteria**:

1. WHEN login fails with wrong email/password THEN the login form SHALL render an inline
   `<Alert variant="error">` reading "Email ou senha inválidos" and SHALL NOT redirect away from
   `/login`.
2. WHEN login fails because the email is not confirmed THEN the form SHALL render "Por favor,
   confirme seu email antes de fazer login" inline.
3. WHEN login fails due to rate limiting (Supabase `too_many_requests` / 429) THEN the form SHALL
   render "Muitas tentativas. Aguarde alguns minutos" inline.
4. WHEN login fails due to a network/timeout error THEN the form SHALL render "Erro de conexão.
   Tente novamente" inline.
5. WHEN login fails for any other/unknown reason THEN the form SHALL render "Erro ao fazer login.
   Tente novamente" inline.
6. WHEN login succeeds THEN the action SHALL `redirect("/")` (dashboard) and SHALL NOT show an
   error alert.
7. WHEN the submit is in flight THEN the submit button SHALL show a loading state and SHALL be
   disabled to prevent double-submission; it SHALL re-enable when the action settles.

**Independent Test**: Drive `/login` with a wrong password → see "Email ou senha inválidos" inline
(AD-002 behavioral verify). Each error case is exercised by triggering the corresponding Supabase
failure.

---

### P2: Signup error parity

**User Story**: As a new user, I want signup failures shown inline with specific pt-BR messages,
so I'm not bounced to a dead-end page.

**Why P2**: Same bug, same file; user confirmed parity. Not MVP only because the auth error
*library* (`mapAuthError`) is built in P1 and reused here.

**Acceptance Criteria**:

1. WHEN signup fails for a detectable reason THEN the signup form SHALL render the matching
   inline `<Alert variant="error">` and SHALL NOT redirect to `/error`.
2. WHEN signup succeeds THEN the action SHALL `redirect("/")` and SHALL NOT show an error alert.
3. WHEN signup is in flight THEN the submit button SHALL show loading state and prevent
   double-submission.

**Independent Test**: Drive `/signup` with an already-registered email or weak password → see the
matching inline error.

---

### P3: Critical-error fallback page

**User Story**: As a user who hits a genuinely unexpected error, I want a clear pt-BR page that
tells me something went wrong and lets me get back to login.

**Why P3**: The `/error` route is now rarely reached (auth cases are inline), but when it is, the
current "Sorry, something went wrong" unstyled English stub is poor. Low-cost polish.

**Acceptance Criteria**:

1. WHEN an unexpected/critical error reaches the `/error` route THEN the page SHALL render a
   neobrutalism-styled pt-BR message ("Algo deu errado") + a "Voltar para o login" link.
2. WHEN rendered THEN the page SHALL meet WCAG AA contrast and have a visible `focus-brutal` on
   the link.

**Independent Test**: Navigate directly to `/error` → see styled pt-BR page with working login link.

---

## Edge Cases

- WHEN Supabase returns "Invalid login credentials" for a non-existent user THEN the system SHALL
  show "Email ou senha inválidos" (same as wrong password) — **never** "Usuário não encontrado",
  to avoid restoring a user-enumeration oracle.
- WHEN the form is submitted with empty fields THEN browser `required` validation SHALL block
  submission before the action runs (existing inputs keep `required`).
- WHEN the action throws (not returns `fail`) before responding THEN the `app/error.tsx`
  boundary (Sentry-wired) SHALL catch it; `/error` route is the manual-redirect fallback.
- WHEN the user double-clicks submit THEN the pending-state button SHALL prevent a second
  submission.

---

## Requirement Traceability

| Requirement ID | Story                 | Phase      | Status  |
| -------------- | --------------------- | ---------- | ------- |
| LEH-01         | P1: Inline login errs | Implement  | Verified |
| LEH-02         | P1: Email-not-confirmed message | Implement | Verified |
| LEH-03         | P1: Rate-limit message        | Implement | Verified |
| LEH-04         | P1: Network/timeout message   | Implement | Verified |
| LEH-05         | P1: Generic fallback message  | Implement | Verified |
| LEH-06         | P1: Success → redirect("/")   | Implement | Verified |
| LEH-07         | P1: Loading state + double-submit guard | Implement | Verified |
| LEH-08         | P2: Signup inline errors       | Implement | Verified |
| LEH-09         | P2: Signup success → redirect  | Implement | Verified |
| LEH-10         | P3: `/error` fallback styled + pt-BR + login link | Implement | Verified |

**ID format:** `LEH-NN` (Login Error Handling). **Status:** Pending → Implementing → Verified.
**Coverage:** 10 total, 10 mapped to implementation, 0 unmapped.

---

## Success Criteria

- [ ] All 6 detectable auth-failure cases show their specific pt-BR message inline on login (and
  signup) — no redirect to `/error` for these.
- [ ] Submit button shows loading + blocks double-submit (AD-002 behavioral verify).
- [ ] `login`/`signup` actions return `ActionResult` via `ok()`/`fail()` (AD-001 conformance).
- [ ] Gate green: `pnpm lint` (0 new errors) && `pnpm build` pass (AD-002).
- [ ] `/error` fallback page is styled, pt-BR, with a working login link.
- [ ] No user-enumeration oracle introduced (user-not-found stays folded into invalid-credentials).