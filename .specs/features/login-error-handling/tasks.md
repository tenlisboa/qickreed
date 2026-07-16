# Tasks — Login Error Handling Enhancement

> **Gate (AD-002 — no test framework):** every task runs `pnpm lint && pnpm build` as the
> deterministic gate. No unit/integration tests exist; final verification is behavioral
> (drive the app) + spec-anchored AC review by the Verifier. Test Adequacy Review (Checks A–D)
> is N/A — no test runner; the Verifier re-derives coverage from `spec.md` ACs against the
> implementation diff instead.

## Execution Plan (phases = 1 → inline, no sub-agents)

| Task | Title                                              | Deps   | Gate   |
| ---- | -------------------------------------------------- | ------ | ------ |
| T1   | Auth error mapping helper (`src/utils/auth/errors.ts`) | —    | build  |
| T2   | `SubmitButton` client wrapper (`useFormStatus`)    | —      | build  |
| T3   | Refactor `login`/`signup` actions → `ActionResult` | T1     | build  |
| T4   | Login page: `useActionState` + inline `Alert`      | T2,T3  | build  |
| T5   | Signup page: same treatment                        | T2,T3  | build  |
| T6   | Enhance `/error` fallback page                    | —      | build  |

---

## T1 — Auth error mapping helper

**Files:** `src/utils/auth/errors.ts` (new)
**Deps:** none
**Done when:**
- Exports `mapAuthError(error, mode: "login" | "signup"): ActionError` mapping Supabase auth
  errors to `{ code, message (pt-BR), details (raw error, English-for-logs) }`.
- Covers LEH-01 invalid credentials → "Email ou senha inválidos" (`unauthorized`)
- Covers LEH-02 email not confirmed → "Por favor, confirme seu email antes de fazer login" (`unauthorized`)
- Covers LEH-03 rate limit (status 429 / "too many requests") → "Muitas tentativas. Aguarde alguns minutos" (`unknown`)
- Covers LEH-04 network/timeout → "Erro de conexão. Tente novamente" (`unknown`)
- Covers LEH-05 generic fallback, mode-aware ("Erro ao fazer login…" / "Erro ao criar conta…") (`unknown`)
- Signup "User already registered" → "Este email já está cadastrado. Faça login ou use outro email." (`unauthorized`)
- Never surfaces "user not found" separately (anti-enumeration — spec Edge Case).
**Gate:** `pnpm lint && pnpm build`
**Commit:** `feat(auth): add Supabase auth error mapping to ActionResult`

## T2 — SubmitButton client wrapper

**Files:** `src/components/SubmitButton.tsx` (new)
**Deps:** none
**Done when:**
- Client component (`"use client"`) using `useFormStatus()` from `react-dom`.
- Renders the existing `Button` wrapper (no new variant) with a `Spinner` (size sm) + pt-BR
  "Entrando…" / generic pending label while `pending`.
- `disabled={pending}` to block double-submit (LEH-07).
**Gate:** `pnpm lint && pnpm build`
**Commit:** `feat(ui): add SubmitButton with useFormStatus loading + double-submit guard`

## T3 — Refactor login/signup actions to ActionResult

**Files:** `src/app/(auth)/login/actions.ts`
**Deps:** T1
**Done when:**
- `login(formData)` returns `Promise<ActionResult<null>>`: on error → `fail(...)` via
  `mapAuthError(error, "login")` + English Pino log via `getRequestLogger({ module: "login" })`
  (no redirect); on success → `revalidatePath` + `redirect("/")` (LEH-06).
- `signup(formData)` returns `Promise<ActionResult<null>>`: same via `mapAuthError(error, "signup")`,
  module `"signup"` (LEH-09).
- The blind `redirect("/error")` is removed from both.
- `logout()` unchanged.
**Gate:** `pnpm lint && pnpm build`
**Commit:** `refactor(auth): return ActionResult from login/signup instead of blind redirect`

## T4 — Login page inline error + loading state

**Files:** `src/app/(auth)/login/page.tsx`
**Deps:** T2, T3
**Done when:**
- Client component using `useActionState(login, null)`; `<form action={action}>`.
- When `state?.error` → render `<Alert variant="error">{state.error.message}</Alert>` above the
  form fields (LEH-01…05).
- Submit uses `<SubmitButton>` (LEH-07).
- Inputs keep `required` + `htmlFor` labels (a11y preserved). `focus-brutal` preserved.
**Gate:** `pnpm lint && pnpm build`
**Commit:** `feat(auth): show inline pt-BR login errors with loading state`

## T5 — Signup page inline error + loading state

**Files:** `src/app/(auth)/signup/page.tsx`
**Deps:** T2, T3
**Done when:**
- Client component using `useActionState(signup, null)`; inline `<Alert variant="error">` on
  `state?.error` (LEH-08); `<SubmitButton>` (LEH-07 parity).
- Existing confirm-password/terms controls preserved.
**Gate:** `pnpm lint && pnpm build`
**Commit:** `feat(auth): show inline pt-BR signup errors with loading state`

## T6 — Enhance /error fallback page

**Files:** `src/app/error/page.tsx`
**Deps:** none
**Done when:**
- Styled neobrutalism page (reuse `Card` + `Button`-as-Link or styled Link), pt-BR "Algo deu
  errado" + short explanation + "Voltar para o login" link to `/login` (LEH-10).
- `focus-brutal` on the link; WCAG AA contrast; ≥44px tap target.
**Gate:** `pnpm lint && pnpm build`
**Commit:** `feat(auth): style /error fallback page with pt-BR message and login link`

---

## Requirement → Task coverage

| Req ID | Task |
| ------ | ---- |
| LEH-01..05 | T1 (mapping) + T4 (render) |
| LEH-06     | T3 |
| LEH-07     | T2 (+ T4/T5 render) |
| LEH-08     | T1 + T5 |
| LEH-09     | T3 |
| LEH-10     | T6 |

All 10 requirements mapped; 0 unmapped.