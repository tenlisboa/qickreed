# .specs Project State

## Decisions

| ID | Decision | Status | Date | Context |
| -- | -------- | ------ | ---- | ------- |
| AD-001 | **Server Actions return `ActionResult<T>` (`{ data, error }` discriminated union) via `ok()`/`fail()` helpers in `src/utils/actions/types.ts`.** This is the project standard for all Server Actions going forward; migrate existing actions incrementally as touched. | active | 2026-07-09 | error-logging feature design — establishes the convention for surfacing real errors instead of swallowing them. |
| AD-002 | **No test framework.** The per-task gate is `pnpm lint && pnpm build`; final verification is behavioral (drive the app). Do not invent test commands. Overrides the spec-driven skill's test-per-AC default. | active | 2026-07-09 | CLAUDE.md states no test framework exists; user confirmed build+lint gate + behavioral verify. |
| AD-003 | **Logging: Pino** (singleton in `src/utils/logging/logger.ts`, pretty-dev/JSON-prod, secret redaction). **Error monitoring: GlitchTip via `@sentry/nextjs`** (Sentry-protocol-compatible, self-hosted; no-op when `SENTRY_DSN` unset). | active | 2026-07-09 | User chose OSS/self-hosted only; research confirmed GlitchTip as de-facto Sentry drop-in. |
| AD-004 | **Log messages in English** (machine/dev-facing); **user-facing `ActionError.message` in pt-BR** (matches existing app strings). | active | 2026-07-09 | Consistency: logs for devs, UI for pt-BR users. |

## Handoff

**Status:** error-logging feature — **complete** ✅
**Implementation:** all 5 phases landed (commits `6caa170`..`511f945`); Verifier PASS 16/16 ACs (EL-03 & EL-04 gaps found-and-fixed, re-verified); behavioral pass confirmed the feasible portion (clean boot with `SENTRY_DSN` unset, `x-request-id` response header emitted, `onRouterTransitionStart` boot warning eliminated).
**Deferred (need user's environment, not blockers):** (1) live authenticated round-trip confirming the same `requestId` in Pino logs as in the `x-request-id` header; (2) `error.tsx`/`global-error.tsx` rendering on a synthetic throw; (3) real GlitchTip capture with a live DSN.
**Env vars to set when plugging in GlitchTip later:** `SENTRY_DSN` (enables capture); optional `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `GLITCHTIP_URL` (sourcemap upload). All unset → app runs fully functional, no-op.
**Next step (optional):** joint drive-through of the 3 deferred behavioral items with the user's Supabase + optional GlitchTip DSN. Separately, the 83 pre-existing lint errors remain out of scope unless the user wants a cleanup pass.
**Files of record:** `.specs/features/error-logging/{spec,design,tasks,validation}.md`