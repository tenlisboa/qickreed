# Login Error Handling — Validation

**Date**: 2026-07-10
**Spec**: `.specs/features/login-error-handling/spec.md`
**Tasks**: `.specs/features/login-error-handling/tasks.md`
**Diff range**: `128c7d1..84953ff` (6 commits on `main`)
**Verifier**: independent sub-agent (author ≠ verifier; fresh derivation)

---

## Verdict: PASS

- **Spec-anchored check**: 10/10 requirements covered, 0 spec-precision gaps. All 5 exact pt-BR login error strings match byte-for-byte; anti-enumeration guard confirmed.
- **Gate**: `pnpm lint` = 19 warnings / 0 errors (matches AD-002 baseline of 19; 0 new); `pnpm build` = pass.
- **Discrimination sensor**: N/A (AD-002 — no test framework; rationale below).
- **Behavioral**: deferred to user (live auth drive-through); static render confirmed via build + curl.

---

## Task Completion

| Task | Status   | Notes |
| ---- | -------- | ----- |
| T1 — `mapAuthError` helper | Done | `src/utils/auth/errors.ts` — all 6 cases + anti-enumeration |
| T2 — `SubmitButton` wrapper | Done | `src/components/SubmitButton.tsx` — useFormStatus + disabled guard |
| T3 — Login/signup → ActionResult | Done | `src/app/(auth)/login/actions.ts` — fail() + English log, blind redirect removed |
| T4 — Login inline Alert + loading | Done | `src/app/(auth)/login/page.tsx` — useActionState + Alert + SubmitButton |
| T5 — Signup inline Alert + loading | Done | `src/app/(auth)/signup/page.tsx` — parity treatment |
| T6 — `/error` fallback styled | Done | `src/app/error/page.tsx` — pt-BR + Card + Button-as-Link to /login |

---

## Spec-Anchored Acceptance Criteria

| Req/AC | Spec-defined outcome | `file:line` + evidence | Covered? |
| ------ | -------------------- | ---------------------- | -------- |
| LEH-01 (P1 AC1) invalid credentials → "Email ou senha inválidos" inline, no /error redirect | exact pt-BR string; inline Alert; no redirect | `src/utils/auth/errors.ts:48-53` — `message.includes("invalid login credentials")` → `message: "Email ou senha inválidos"`; `src/app/(auth)/login/actions.ts:27-31` returns `fail(...)` (no `redirect("/error")`); `src/app/(auth)/login/page.tsx:15,30-32` `useActionState` + `<Alert variant="error">{state.error.message}</Alert>` | YES |
| LEH-02 (P1 AC2) email not confirmed → "Por favor, confirme seu email antes de fazer login" | exact pt-BR string; inline | `src/utils/auth/errors.ts:32-37` — `message.includes("email not confirmed")` → `message: "Por favor, confirme seu email antes de fazer login"`; rendered via same Alert path (login/page.tsx:30-32) | YES |
| LEH-03 (P1 AC3) rate limit (429 / too_many_requests) → "Muitas tentativas. Aguarde alguns minutos" | exact pt-BR string; inline | `src/utils/auth/errors.ts:24-29` — `error.status === 429 \|\| message.includes("too many requests")` → `message: "Muitas tentativas. Aguarde alguns minutos"` | YES |
| LEH-04 (P1 AC4) network/timeout → "Erro de conexão. Tente novamente" | exact pt-BR string; inline | `src/utils/auth/errors.ts:56-65` — `message.includes("network") \|\| .includes("timeout") \|\| .includes("fetch")` → `message: "Erro de conexão. Tente novamente"` | YES |
| LEH-05 (P1 AC5) generic fallback → "Erro ao fazer login. Tente novamente" | exact pt-BR string; inline | `src/utils/auth/errors.ts:6-9,68-72` — `GENERIC_MESSAGE.login = "Erro ao fazer login. Tente novamente"`; default return | YES |
| LEH-06 (P1 AC6) success → redirect("/") + revalidatePath, no error alert | redirect dashboard; no alert | `src/app/(auth)/login/actions.ts:34-35` — `revalidatePath("/", "layout"); redirect("/");` | YES |
| LEH-07 (P1 AC7) submit pending → loading + disabled, re-enable on settle | disabled while pending via useFormStatus | `src/components/SubmitButton.tsx:25,33,36-40` — `useFormStatus()`, `disabled={pending \|\| disabled}`, Spinner + pendingLabel when pending; `src/app/(auth)/login/page.tsx:71-77` uses `<SubmitButton pendingLabel="Entrando…">` | YES |
| LEH-08 (P2 AC1) signup detectable failure → inline Alert, no /error | inline Alert; no redirect | `src/app/(auth)/login/actions.ts:53-57` returns `fail(mapAuthError(error,"signup"))`; `src/app/(auth)/signup/page.tsx:15,29-32` Alert; `src/utils/auth/errors.ts:40-46` signup "already registered" → "Este email já está cadastrado. Faça login ou use outro email." | YES |
| LEH-09 (P2 AC2) signup success → redirect("/") + no alert | redirect dashboard | `src/app/(auth)/login/actions.ts:60-61` — `revalidatePath("/", "layout"); redirect("/");` | YES |
| LEH-10 (P3 AC1) /error → neobrutalism styled, pt-BR "Algo deu errado", "Voltar para o login" link | styled; pt-BR; link to /login | `src/app/error/page.tsx:5-21` — Card + `<h1>Algo deu errado</h1>` + `<Button asChild variant="primary"><Link href="/login">Voltar para o login</Link></Button>` | YES |
| LEH-10 (P3 AC2) /error link → WCAG AA contrast + visible focus-brutal + ≥44px tap | focus-brutal; ≥44px; AA contrast | `src/components/ui/button.tsx:29` base class `focus-brutal`; size `default: "h-11"` (=44px) applies via Slot to the Link; `bg-main` (#FFD23F) + `text-black` = black-on-yellow, passes AA | YES |
| Edge: anti-enumeration — "Usuário não encontrado" NEVER surfaced; user-not-found + wrong-password both → "Email ou senha inválidos" | no separate user-not-found branch; same message | `src/utils/auth/errors.ts:48-53` only matches `invalid login credentials` (GoTrue folds both cases); grep confirms no "Usuário não encontrado" string anywhere in src/; no "user not found" branch | YES |
| Edge: empty fields → browser `required` blocks submission | required on inputs | `src/app/(auth)/login/page.tsx:41,55` `required`; `src/app/(auth)/signup/page.tsx:41,55,67,79` `required` on email/password/confirm/checkbox | YES |
| Edge: double-click → pending-state blocks | disabled while pending | SubmitButton.tsx:33 `disabled={pending \|\| disabled}` | YES |
| AD-001 conformance: login/signup return ActionResult via ok()/fail() | ActionResult<null> via fail() | `src/app/(auth)/login/actions.ts:15,31,41,57` — `Promise<ActionResult<null>>` + `fail(code,message,details)` | YES |
| AD-004: user msg pt-BR, logs English, details carries raw error (not shown) | pt-BR messages; English log msg; raw error in details | errors.ts all messages pt-BR; `actions.ts:29` `log.warn({err: error, email}, "Login failed")` (English); `actions.ts:55` "Signup failed" (English); `details: error` (raw, line 28/56); page renders only `state.error.message` (never details) | YES |

**Status**: All 10 LEH requirements + all 4 edge cases + both AD conformance checks covered. 0 spec-precision gaps.

---

## Discrimination Sensor

**N/A — AD-002 (no test framework).**

Rationale: AD-002 in `.specs/STATE.md` explicitly states "No test framework" and overrides the spec-driven skill's default mutation/discrimination sensor. The repo has no `test` script, no test runner, and no test dependencies (confirmed in CLAUDE.md). The feature spec's own "Out of Scope" table declares "Mutation/discrimination sensor — Requires a test runner (none). AD-002 overrides the skill's default." Per the validate.md skill, the sensor targets behavior-level semantics via a test runner; with no runner, no mutation can be killed/survived. The empirical guarantee is instead provided by the deterministic `pnpm lint && pnpm build` gate + the spec-anchored AC review + deferred behavioral drive-through. No tests were invented (constraint honored).

---

## Behavioral Verification

**Live auth drive-through: deferred to user.** A full headless login drive-through (submitting bad credentials to a live Supabase auth backend and observing each pt-BR inline error) requires browser automation + live Supabase auth responses, which is out of scope for a headless read-only verifier. This is consistent with the project's established handoff pattern (STATE.md "Deferred to user" for authenticated behavioral drive-throughs).

**Static confirmation performed (within scope):**
- `pnpm build` succeeded — proves compilation of /login, /signup, /error (all listed as static-prerendered routes in build output: `○ /login 4.34 kB`, `○ /signup 4.49 kB`, `○ /error 0 B`).
- `pnpm dev` booted clean on port 3001; `curl` returned HTTP 200 for all three routes:
  - `/login` → 200; markup contains `name="email"`, `name="password"`, "Sign In" label.
  - `/signup` → 200; markup contains `name="email"`, `name="confirmPassword"`, terms checkbox, "Create Account" label.
  - `/error` → 200; markup contains "Algo deu errado", "Voltar para o login", `href="/login"`.
- Dev server killed after check (no lingering process; confirmed `NO NEXT PROCESSES`).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code (no features beyond asked) | YES |
| Surgical changes (only touched files required) | YES — 6 files, all in scope |
| No scope creep | YES |
| Matches existing patterns/style | YES — reuses Button/Card/Alert/Spinner wrappers; neobrutalism tokens; ActionResult/fail convention |
| Spec-anchored outcome check (asserted values match spec) | YES — all 5 pt-BR strings byte-exact |
| Per-layer Coverage Expectation (routes happy+edge+error) | YES — success (redirect), all 5 error cases, /error fallback, double-submit, empty-fields |
| Every code path maps to a spec requirement — no unclaimed code | YES |
| Documented guidelines followed: `agent_docs/design.md` + `agent_docs/system.md` + `.claude/rules/design-system.md` | YES — neobrutalism Card/Button/Alert, focus-brutal, ≥44px (h-11), 2-accent palette (#FFD23F primary), pt-BR |

---

## Edge Cases

- [x] Anti-enumeration: "Usuário não encontrado" never surfaced; invalid-credentials + user-not-found both map to "Email ou senha inválidos" (`errors.ts:48-53`; grep confirmed no forbidden string).
- [x] Empty fields: browser `required` blocks submission before action (login/page.tsx:41,55; signup/page.tsx:41,55,67,79).
- [x] Action throws before responding: handled by `app/error.tsx` boundary (unchanged, Sentry-wired); `/error` route is the manual-redirect fallback (now styled).
- [x] Double-click: pending-state disables submit (SubmitButton.tsx:33).

---

## Gate Check

- **Gate command** (tasks.md / AD-002): `pnpm lint && pnpm build`
- **`pnpm lint`**: PASS — 0 errors, 19 warnings. The 19 warnings are the documented pre-existing baseline (STATE.md: "19 baseline warnings"; non-null-assertion + header-order warnings in supabase/server.ts and middleware). **0 new warnings introduced** by this feature (diff touches none of the warning sites).
- **`pnpm build`**: PASS — all 22 routes compiled; /login, /signup, /error statically generated.
- **Test count before/after**: N/A — no test framework (AD-002).
- **Failures**: none.

---

## Diff/Commit Range Covered

`128c7d1..84953ff` (6 commits):
- `24c33ad` feat(auth): add Supabase auth error mapping to ActionResult
- `a2df392` feat(ui): add SubmitButton with useFormStatus loading + double-submit guard
- `e946113` refactor(auth): return ActionResult from login/signup instead of blind redirect
- `9fc0dd8` feat(auth): show inline pt-BR login errors with loading state
- `f4d2d5d` feat(auth): show inline pt-BR signup errors with loading state
- `84953ff` feat(auth): style /error fallback page with pt-BR message and login link

Files in scope (all reviewed): `src/utils/auth/errors.ts` (new), `src/components/SubmitButton.tsx` (new), `src/app/(auth)/login/actions.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/app/error/page.tsx`.

---

## Fix Plans

None — no gaps found.

---

## Requirement Traceability Update (recommended — spec.md not modified per read-only constraint)

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| LEH-01 | Implementing | Verified |
| LEH-02 | Implementing | Verified |
| LEH-03 | Implementing | Verified |
| LEH-04 | Implementing | Verified |
| LEH-05 | Implementing | Verified |
| LEH-06 | Implementing | Verified |
| LEH-07 | Implementing | Verified |
| LEH-08 | Implementing | Verified |
| LEH-09 | Implementing | Verified |
| LEH-10 | Implementing | Verified |

---

## Summary

**Overall**: Ready.

- **Spec-anchored check**: 10/10 requirements matched spec outcome; 0 spec-precision gaps; all 5 exact pt-BR strings byte-exact.
- **Sensor**: N/A (AD-002).
- **Gate**: `pnpm lint` 0 errors / 19 baseline warnings (0 new); `pnpm build` pass.
- **AD-001**: login/signup return `ActionResult<null>` via `fail()` — conformant.
- **AD-004**: user messages pt-BR, English Pino logs via `getRequestLogger({module})`, raw error in `details` (never rendered) — conformant.
- **Anti-enumeration**: confirmed — no "Usuário não encontrado" oracle.

**What works**: all 5 login error mappings render inline via `<Alert variant="error">` without redirect; signup parity incl. "already registered"; SubmitButton disables on pending (double-submit guard); success path `revalidatePath` + `redirect("/")`; `/error` fallback styled pt-BR with 44px focus-brutal login link.

**Issues found**: none.

**Next steps**: user-side behavioral drive-through (submit bad credentials to live Supabase, confirm each inline pt-BR message); update spec.md LEH-NN statuses to Verified (deferred to maintain spec.md, per read-only constraint).