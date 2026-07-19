---
last_mapped_commit: 46ae8c4be55612ea89f855a285ca2ac3b02d3020
focus: tech
---

# External Integrations

**Analysis Date:** 2026-07-19

## APIs & External Services

**Database / Backend-as-a-Service:**
- Supabase — Postgres, Auth, Storage, Realtime, Edge Functions
  - SDK/Client: `@supabase/supabase-js` 2.75.0 + `@supabase/ssr` 0.7.0
  - Three client factories (never instantiate `@supabase/supabase-js` directly):
    - `src/utils/supabase/server.ts` — `createClient()` (async, Server Components / Server Actions / Route Handlers)
    - `src/utils/supabase/client.ts` — `createClient()` (sync, Client Components)
    - `src/utils/supabase/middleware.ts` — `updateSession()` consumed by `src/middleware.ts` for session refresh on every matched request
  - Auth: env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable/anon key, **not** service-role). Sessions are cookie-based; the server client's `setAll` swallows errors intentionally because middleware refreshes sessions.
  - Admin helper: `src/utils/auth/admin.ts` — `checkAdminAccess()` / `getUserRole()` (queries `profiles.role` per request; role is **not** a JWT claim)

**LLM (OpenAI-compatible chat completions):**
- Service: OpenAI-compatible endpoint — default Ollama at `http://localhost:11434/v1`, model `llama3.1`
  - Client: `src/lib/llm/client.ts` — `callChat()` posts to `${LLM_BASE_URL}/chat/completions` with Bearer auth when `LLM_API_KEY` is set; 120s default timeout, `AbortSignal` support, custom `LlmClientError`. Used to generate comprehension quizzes for pasted training text (QICA-14).
  - Auth: optional `LLM_API_KEY` (Bearer). None required for local Ollama.
  - Config: `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` (all optional — see `.env.example`)

**Error Tracking (optional):**
- GlitchTip / Sentry — self-hostable Sentry-compatible
  - SDK: `@sentry/nextjs` 10.64.0
  - Config files: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` (each `Sentry.init` with `SENTRY_DSN`, disabled when DSN unset)
  - Build integration: `withSentryConfig` in `next.config.ts` (uses `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `GLITCHTIP_URL`); source map uploads disabled without `SENTRY_AUTH_TOKEN`

## Data Storage

**Databases:**
- PostgreSQL 17 (Supabase)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + anon key (REST/GraphQL over HTTPS via `@supabase/ssr`); direct DB ports only used locally (`supabase/config.toml`: 54322 DB, 54321 API)
  - Client: Supabase JS client through the three factories above
  - Migrations: `supabase/migrations/` (8 SQL files — initial tables, RLS optimization, profiles/roles, training_type, user training text input, reading method/level, post-RSVP cognitive validation, seed diagnostic/training texts)
  - Tables: `text`, `diagnostic_session`, `training_session`, `profiles` (TS mirrors in `src/types/database.ts`)
  - RLS enabled on all tables; admin text management gated by `public.is_admin()` SECURITY DEFINER function

**File Storage:**
- Supabase Storage (enabled in `supabase/config.toml`, 50 MiB limit; no buckets configured by default). App currently relies on Postgres columns (`quiz_json`) for content — no Storage SDK usage detected in `src/`.

**Caching:**
- None (no Redis/Memcached/edge KV); session refresh + Postgres are the only state sources

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email/password, email OTP)
  - Implementation: `src/app/(auth)/login/actions.ts`, `src/app/(auth)/signup/…`, `src/app/(auth)/auth/confirm/route.ts` (HTTP route handler for email-confirm redirects); session refresh in `src/utils/supabase/middleware.ts`
  - Middleware (`src/middleware.ts`): sets `x-request-id` header, delegates to `updateSession`, redirects unauthenticated users to `/login` (except `/`, `/login`, `/signup`, `/auth`, `/error`), bounces authenticated users away from `/login|/signup` to `/dashboard`
  - Local config: email signup on, email confirmation off, anon sign-in off, no OAuth/SMS/MFA providers enabled
  - Profile lifecycle: `profiles` row auto-created on signup via `on_auth_user_created` trigger; default role `member`

**Roles:**
- `profiles.role` ∈ `member` | `admin` (per-request lookup, not a JWT claim). Admin guard: `checkAdminAccess()` in `src/utils/auth/admin.ts` redirects non-admins away.

## Monitoring & Observability

**Error Tracking:**
- GlitchTip / Sentry via `@sentry/nextjs` (see above) — opt-in via `SENTRY_DSN`

**Logs:**
- `pino` 10.3.1 + `pino-pretty` 13.1.3 (marked as `serverExternalPackages` in `next.config.ts`)
- `x-request-id` propagated through `src/middleware.ts` for request correlation

**Realtime / Analytics:**
- Supabase Realtime enabled locally (`supabase/config.toml`) — no realtime subscriptions detected in `src/` app code yet
- Supabase Analytics (port 54327, Postgres backend) available locally

## CI/CD & Deployment

**Hosting:**
- Not specified in repo (no Dockerfile / fly.toml / vercel.json / render.yaml). Default target is any Node host running `next start` after `next build --turbopack`.

**CI Pipeline:**
- None detected in repo (no `.github/workflows/`, no `.circleci/`, no `bitbucket-pipelines.yml`). CI is implied-only via `silent: !process.env.CI` in `next.config.ts` Sentry config.

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable/anon key (never the service-role key)

**Optional env vars:**
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `GLITCHTIP_URL` — error tracking (no-op if absent)
- `LLM_BASE_URL` (default `http://localhost:11434/v1`), `LLM_MODEL` (default `llama3.1`), `LLM_API_KEY` — LLM quiz generation
- `CI` — toggles Sentry build verbosity

**Secrets location:**
- `.env` (gitignored, present — existence noted, contents never read)
- `.env.example` committed as documentation of the var names only
- Service-role key must never be embedded in client bundles; privileged writes route through Server Actions that re-check role via `src/utils/auth/admin.ts`

## Webhooks & Callbacks

**Incoming:**
- `src/app/(auth)/auth/confirm/route.ts` — Route Handler invoked by Supabase email-confirmation links; redirects into the authenticated area
- `src/app/(authenticated)/assessment/start/route.ts` — Route Handler starting a diagnostic session (HTTP endpoint, not a Server Action)
- `src/app/(authenticated)/training/rsvp/complete/route.ts` — Route Handler finalizing an RSVP training session (pure HTTP entry, persists a `TrainingSession`)

**Outgoing:**
- `POST ${LLM_BASE_URL}/chat/completions` — LLM quiz generation (`src/lib/llm/client.ts`)
- Outbound to GlitchTip / Sentry ingestion endpoints (DSN-driven) when `SENTRY_DSN` is set

---

*Integration audit: 2026-07-19*