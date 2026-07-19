---
last_mapped_commit: 46ae8c4be55612ea89f855a285ca2ac3b02d3020
focus: arch
---

# Architecture

**Analysis Date:** 2026-07-19

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                        Next.js 15 App Router (Edge/Node)                  │
├──────────────────┬─────────────────────┬─────────────────────────────────┤
│   (auth) routes  │ (authenticated) UI  │       (immersive) routes         │
│  login/signup/   │  dashboard / assess- │  /training/rsvp/session (full-  │
│  auth/confirm    │  ment / training /   │  screen RSVP, no Sidebar)        │
│                  │  admin/texts         │                                 │
│ `src/app/(auth)` │ `src/app/(authenti…)`│ `src/app/(immersive)`           │
└──────┬───────────┴──────────┬──────────┴────────────┬────────────────────┘
       │                      │                          │
       ▼                      ▼                          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Middleware (session refresh + redirect guards + x-request-id injection)  │
│  `src/middleware.ts` → `src/utils/supabase/middleware.ts`                │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Server Actions (writes) & Route Handlers (genuine HTTP)                 │
│  `actions.ts` colocated per route group · `route.ts` for HTTP endpoints   │
│  Helpers: `src/utils/actions/types.ts` ({ok|fail}→ActionResult<T>)       │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────┬─────────────────────────────────────────────┐
│  Supabase SSR clients      │  Domain logic & infra                       │
│  server.ts (async)         │  `src/lib/reading.ts` categorizeReader       │
│  client.ts (sync browser)  │  `src/lib/utils.ts` calculateWpm /          │
│  NEVER instantiate         │     isPassingComprehension /                │
│  @supabase/supabase-js     │     calculateComprehensionResult            │
│  directly                  │  `src/lib/llm/*` OpenAI-compatible chat      │
└────────────────────────────┴─────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Supabase Postgres (RLS on every table) + LLM endpoint (Ollama/OpenAI)   │
└──────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root middleware | Inject `x-request-id`; delegate to `updateSession` | `src/middleware.ts` |
| Session refresh + route guards | Refresh auth cookies; redirect unauth→`/login`, auth→`/dashboard` for `/login`+`/signup` | `src/utils/supabase/middleware.ts` |
| Server Supabase client | Async client for Server Components/Actions; `setAll` swallows errors (middleware refreshes) | `src/utils/supabase/server.ts` |
| Browser Supabase client | Sync `createBrowserClient` for Client Components | `src/utils/supabase/client.ts` |
| Admin guard | `checkAdminAccess()` redirects non-admins; `getUserRole()` queries `profiles.role` | `src/utils/auth/admin.ts` |
| Auth error mapping | `mapAuthError()` → `ActionResult` codes | `src/utils/auth/errors.ts` |
| Action result helpers | `ok<T>()` / `fail()` + `ActionErrorCode` union | `src/utils/actions/types.ts` |
| Request logger | Pino child logger keyed by `x-request-id` from `headers()` | `src/utils/logging/request-logger.ts` |
| Root logger | Pino singleton with secret redaction (dev→pino-pretty) | `src/utils/logging/logger.ts` |
| Reading metrics | `calculateWpm`, `isPassingComprehension`, `calculateComprehensionResult` (pass threshold 60%) | `src/lib/utils.ts` |
| Reader categorization | WPM × `ReadingMethod` → category label | `src/lib/reading.ts` |
| LLM client | OpenAI-compatible `/chat/completions` POST w/ AbortController timeout | `src/lib/llm/client.ts` |
| LLM quiz generator | `generateQuiz` + `QuizGenerationError`; Zod schema | `src/lib/llm/quiz-schema.ts` |
| DB types mirror | Enums + interfaces mirroring `supabase/migrations/` | `src/types/database.ts` |
| Authenticated shell | Sidebar + main pane layout | `src/app/(authenticated)/layout.tsx` |
| Admin shell | Calls `checkAdminAccess()` before rendering | `src/app/(authenticated)/admin/layout.tsx` |
| Immersive shell | Full-screen, no Sidebar | `src/app/(immersive)/layout.tsx` |
| Sidebar nav | Client comp; queries role via `getUserRole()` to reveal Admin link | `src/components/Sidebar.tsx` |

## Pattern Overview

**Overall:** Next.js 15 App Router Server-Component-first architecture with colocated Server Actions; RLS-enforced Postgres via Supabase SSR clients; route-handler HTTP endpoints used only for genuine HTTP.

**Key Characteristics:**
- Server-Component-first: pages are async server components by default; `"use client"` added only where browser state (`useState`, `useSearchParams`, `window`, RsvpDisplay) is required.
- Writes go through **Server Actions** colocated as `actions.ts` in the route group; mutation entry points return `ActionResult<T>` (`{data,error}` discriminated union) for caller-side handling.
- `route.ts` files exist only for true HTTP endpoints (client `fetch` posts): `src/app/(auth)/auth/confirm/route.ts` (OTP verify GET), `src/app/(authenticated)/assessment/start/route.ts` (delegates to `startAssessment()`), `src/app/(authenticated)/training/rsvp/complete/route.ts` (RSVP completion → JSON `{sessionId,hasQuiz}`).
- Supabase clients are **always** obtained via `src/utils/supabase/{server,client,middleware}.ts`; never instantiate `@supabase/supabase-js` directly.
- WPM and comprehension metrics are computed **server-side** (in actions or `src/lib/utils.ts`); client only collects `readingTimeMs` / `durationSeconds` and posts them.
- `revalidatePath` is called in mutations that change list/snapshot pages (`/training`, `/dashboard`, `/admin/texts`).
- Request-scoped logging via `getRequestLogger({module})` reads the `x-request-id` header injected by middleware.

## Layers

**Presentation (React Server/Client Components):**
- Location: `src/app/**/page.tsx`, `src/components/**`
- Contains: route pages, primitives (`src/components/ui/*`), wrapped components (`Button`, `Card`, `QuizQuestion`, `RsvpDisplay`, `Sidebar`, `Timer`, `RichTextEditor`, etc.)
- Depends on: Server Actions, `src/lib/*`, `src/types/database.ts`
- Used by: Next.js router

**Server Actions layer:**
- Location: `src/app/(authenticated)/**/actions.ts`, `src/app/(auth)/login/actions.ts`
- Contains: `"use server"` mutations and queries
- Depends on: Supabase server client, `src/utils/actions/types.ts`, `src/lib/*`, `getRequestLogger`
- Used by: Client and Server Components, two `route.ts` HTTP wrappers

**Route Handlers (HTTP):**
- Location: `src/app/(auth)/auth/confirm/route.ts`, `src/app/(authenticated)/assessment/start/route.ts`, `src/app/(authenticated)/training/rsvp/complete/route.ts`
- Contains: HTTP `GET`/`POST` only — pure delegation or HTTP-shaped JSON responses
- Depends on: Server Actions, Supabase server client
- Used by: client `fetch()`, email-OTP callback

**Domain lib:**
- Location: `src/lib/**`
- Contains: pure-ish helpers (`reading.ts`, `utils.ts`) and infra clients (`lib/llm/client.ts`, `lib/llm/quiz-schema.ts`)
- Depends on: `src/types/database.ts`
- Used by: Server Actions

**Infra utilities:**
- Location: `src/utils/**`
- Contains: Supabase clients, auth/admin, error mapping, logging
- Depends on: `@supabase/ssr`, `pino`, `next/headers`, `next/navigation`
- Used by: Actions, middleware, Sidebar (client)

**Persistence:**
- Supabase Postgres — schema in `supabase/migrations/`; TS mirrors in `src/types/database.ts`. RLS enabled on every table.

## Data Flow

### Diagnostic Assessment Flow

1. User POSTs `/assessment/start` (`src/app/(authenticated)/assessment/start/route.ts:3`) → `startAssessment()` (`src/app/(authenticated)/assessment/actions.ts:288`) authenticates, fetches latest `pt-BR` diagnostic text, `redirect` to `/assessment/reading?textId=…`.
2. `/assessment/reading/page.tsx` renders the text with reading guard (no upward scroll); user finishes → client collects `readingTimeMs`, navigates to `/assessment/quiz`.
3. Quiz submission calls `saveDiagnosticSession()` (`actions.ts:41`) → server computes `wpm = num_words / readingTimeMs * 60000`, `targetWpm = round(wpm*1.2)`, persists to `diagnostic_session`, calls `set_user_level(1)` on first diagnostic, returns `AssessmentResult`.
4. `/assessment/results/page.tsx` renders WPM, comprehension, reader category (`categorizeReader`), suggested target.

### RSVP Training + Cognitive Validation Flow

1. `/training/rsvp/session/page.tsx` (immersive; client) fetches text via `getTextById()` and renders `RsvpDisplay` at per-word `60000 / targetWpm` ms.
2. On completion, client POSTs to `/training/rsvp/complete` (`src/app/(authenticated)/training/rsvp/complete/route.ts:7`) with `{textId, targetWpm, durationSeconds}`.
3. Route calls `createTrainingSession()` (`training/actions.ts:118`) → inserts `training_session` (no score yet), `revalidatePath("/training")`.
4. Route queries `text.quiz_json`, returns `{sessionId, hasQuiz}`. Client navigates to `/training/rsvp/quiz?sessionId=…` when `hasQuiz`, else `/training/rsvp/feedback`.
5. `/training/rsvp/quiz/page.tsx` fetches `getTrainingSessionDetails()` + `getTextQuizData()`, presents questions, submits `submitTrainingQuiz(sessionId, answers)` (`training/actions.ts:349`).
6. `submitTrainingQuiz` server-scores via `calculateServerScore`, derives `passed = isPassingComprehension(score)`, updates `training_session{comprehension_score, passed}`, then updates `profiles.benchmark_wpm` (pass→`target_wpm`, fail→`target_wpm*0.9` via `calculateComprehensionResult`), `revalidatePath` of `/training` and `/dashboard`.
7. `/training/rsvp/feedback/page.tsx` reads `getTrainingSessionResult(sessionId)` and shows score/pass/next target.

### Auth Flow

1. `/login` page → `login()` Server Action (`src/app/(auth)/login/actions.ts:12`) → `signInWithPassword` → `revalidatePath("/", "layout")` + `redirect("/dashboard")`. Errors flow through `mapAuthError()` → `fail()`.
2. `/signup` → `signup()` validates password/terms, `signUp`, then immediate `signInWithPassword` (email confirmation disabled), redirect to dashboard.
3. Email-OTP callback: GET `/auth/confirm` (`src/app/(auth)/auth/confirm/route.ts`) verifies OTP via `supabase.auth.verifyOtp`, `redirect(next || "/")`.
4. `logout()` — `signOut()` + `redirect("/login")`.
5. Every request hits `src/middleware.ts` → `updateSession` — `getUser()` refreshes cookies; unauth users redirected away from protected paths; auth users bounced from `/login`+`/signup` to `/dashboard`.

**State Management:**
- No client store (no Redux/Zustand). State is local React state in Client Components; persistent state lives in Postgres; server data fetched per-render via Server Actions or Server Components.
- `benchmark_wpm` (profiles) is the **source of truth** for next session's suggested WPM; `target_wpm` on training_session is per-session.

## Key Abstractions

**`ActionResult<T>` discriminated union:**
- Purpose: Standardized Server Action return shape for caller-safe branching on `data` vs `error`.
- Examples: `src/app/(auth)/login/actions.ts`, `src/app/(authenticated)/assessment/actions.ts`, `src/app/(authenticated)/dashboard/actions.ts:133`
- Pattern: `const {data, error} = await action(); if (error) … else data` — error `code` is one of `unauthorized|not_found|db_error|validation|unknown`; `message` is pt-BR user-facing; `details` is logged (never surfaced).

**Supabase client accessors:**
- Purpose: Single point of Supabase client creation; cookies wired correctly for SSR; service role never exposed to browser.
- Examples: `src/utils/supabase/server.ts`, `src/utils/supabase/client.ts`, `src/utils/supabase/middleware.ts`
- Pattern: `const supabase = await createClient();` (server) or `createClient()` (client). Server `setAll` swallows errors — safe **only** because middleware refreshes sessions.

**`getUserRole()` / `checkAdminAccess()`:**
- Purpose: Role is **not** a JWT claim — it lives in `profiles.role` and is queried per request.
- Examples: `src/utils/auth/admin.ts`
- Pattern: `checkAdminAccess()` is `"use server"` and `redirect`s away; layout/prefixed admin routes call it first (`src/app/(authenticated)/admin/layout.tsx:9`).

**Route Groups:**
- Purpose: Group routes that share a layout without affecting URL.
- Examples: `(auth)`, `(authenticated)`, `(immersive)`
- Pattern: `(immersive)` provides a chrome-free full-screen shell for RSVP reading; other groups compose around `Sidebar`.

## Entry Points

**Next.js app:**
- Location: `src/app/layout.tsx` (root layout, `lang="pt-BR"`, Geist fonts) + `src/app/page.tsx` (landing page marketing)
- Triggers: HTTP requests
- Responsibilities: HTML shell, root metadata, landing hero

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: All requests matching `config.matcher` (excludes `_next/static`, `_next/image`, static assets, favicon).
- Responsibilities: Set/forward `x-request-id`; call `updateSession`.

**Instrumentation:**
- Location: `instrumentation.ts`
- Triggers: Next.js server boot (nodejs/edge runtimes)
- Responsibilities: Register Sentry config; `onRequestError` captures Server Component/middleware/route-handler errors.

## Architectural Constraints

- **Threading:** Node.js single-threaded event loop for Server Components/Actions/Route Handlers; Edge runtime supported via `next.config.ts` and `instrumentation.ts` edge branch. LLM client uses `AbortController` with 120s default timeout (`src/lib/llm/client.ts`).
- **Global state:** Module-level singletons: `logger` in `src/utils/logging/logger.ts`; per-request logger is a child, not a singleton. No global mutable app state.
- **Circular imports:** None known — layers flow downward (UI → Actions → lib/utils → types).
- **Cookie/session coupling:** Server `setAll` in `src/utils/supabase/server.ts` intentionally swallows errors because `src/utils/supabase/middleware.ts` refreshes sessions on every request. **Do not "fix" `setAll` without removing that coupling.**
- **RLS as security boundary:** All tables have RLS enabled; authenticated users read all `text`, read/insert only their own sessions (`auth.uid() = user_id`), admin text writes gated by `public.is_admin()` SECURITY DEFINER. The role check is per-request query, not a JWT claim.
- **Service role key:** Never exposed to the client. Privileged operations (e.g. `set_user_level`) run via SECURITY DEFINER RPCs invoked from the user-scoped server client.
- **Random text selection:** Supabase/postgrest cannot safely express `ORDER BY random()`, so `getRandomTrainingText()` (`training/actions.ts:81`) fetches IDs then picks in JS.
- **Email confirmation:** Disabled in `supabase/config.toml`; signup auto-signs-in.

## Anti-Patterns

### Direct Supabase instantiation

**What happens:** Reaching for `import { createClient } from "@supabase/supabase-js"` in a new file.
**Why it's wrong:** Bypasses cookie wiring / SSR auth refresh; breaks RLS context.
**Do this instead:** Always use `src/utils/supabase/server.ts` (async, server) or `src/utils/supabase/client.ts` (sync, browser) — see `AGENTS.md`.

### Client-side metric computation

**What happens:** Computing WPM or comprehension score in the browser.
**Why it's wrong:** Client timings are user-tamperable; WPM must derive from authoritative `text.num_words` server-side.
**Do this instead:** Use `calculateWpm(numWords, readingTimeMs)` in `src/lib/utils.ts` inside Server Actions; client only collects raw timings/durations.

### Adding `route.ts` for writes

**What happens:** Naming a new write endpoint `something/route.ts` because it feels familiar.
**Why it's wrong:** Adds an unnecessary HTTP layer; bypasses the Server Action progressive-enhancement story and `revalidatePath` ergonomics.
**Do this instead:** Add a Server Action to the colocated `actions.ts`. Reserve `route.ts` for true HTTP (e.g. RsvpDisplay `fetch` completion, email OTP).

## Error Handling

**Strategy:** `ActionResult<T>` `{data, error}` discriminated union for Server Actions; HTTP status codes for `route.ts`; `redirect()` for guard failures.

**Patterns:**
- Server Actions return `fail(code, message, details)` with pt-BR `message` and pure-logging `details`; successful path returns `ok(data)`.
- HTTP route handlers return `NextResponse.json({error}, {status})` and `log.error` server-side.
- Auth errors centralized through `mapAuthError(error, mode)` in `src/utils/auth/errors.ts`.
- Unhandled render/route errors caught by Next `error.tsx` (`src/app/error.tsx`) and `src/app/global-error.tsx`; Sentry `onRequestError` in `instrumentation.ts`.
- LLM errors normalized as `LlmClientError` (`src/lib/llm/client.ts:22`); quiz generation surfaces as `QuizGenerationError` (`src/lib/llm/quiz-schema.ts`).

## Cross-Cutting Concerns

**Logging:** Pino (`src/utils/logging/logger.ts`) with redaction of `password|token|apiKey|authorization|*_token|secret`. Server Actions/Route Handlers obtain a per-request child via `getRequestLogger({module})` which keys on the `x-request-id` header injected by `src/middleware.ts`. Dev uses `pino-pretty`; production plain JSON.

**Validation:** Server Actions validate `FormData` inline (length/word bounds in `dashboard/actions.ts:prepareTrainingText`); admin text writes validate `quiz_json` via Zod `quizDataSchema` in `src/app/(authenticated)/admin/texts/schemas.ts` (normalized by `normalizeQuiz` before insert).

**Authentication:** Supabase Auth (email/password, optional OTP via `/auth/confirm`). Email confirmation disabled in `supabase/config.toml`; signup auto-signs-in. Session cookies refreshed by middleware on every request. Admin gate via `checkAdminAccess()` (queries `profiles.role`, redirects non-admins).

**Observability:** Sentry initialized per-runtime via `instrumentation.ts` + `sentry.{server,edge,client}.config.ts`. Pino logger writes to stdout. No dedicated tracing/APM beyond request IDs.

---

*Architecture analysis: 2026-07-19*