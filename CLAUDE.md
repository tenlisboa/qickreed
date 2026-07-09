# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QickReed is a speed-reading trainer. Users take a diagnostic reading assessment (WPM + comprehension) to establish a baseline, then train with RSVP (Rapid Serial Visual Presentation) to increase reading speed.

Stack: Next.js 15 (App Router, Turbopack) + React 19 + TypeScript + Supabase (Postgres + auth), Tailwind CSS v4 + DaisyUI, Biome for lint/format, **pnpm** as package manager.

## Commands

- `pnpm dev` — dev server (Turbopack) on http://localhost:3000
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm lint` — `biome check`
- `pnpm format` — `biome format --write`

There is **no test framework** configured (no `test` script, no test deps) — do not invent test commands.

Supabase local backend: use the `supabase` CLI against `supabase/` (migrations in `supabase/migrations/`). Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the anon/publishable key, **not** the service key).

## Directory Structure

```
src/
├── app/
│   ├── (auth)/              # login, signup, auth/confirm — auth mutations via Server Actions
│   ├── (authenticated)/     # protected: dashboard, training, assessment, admin
│   ├── error/
│   ├── layout.tsx / page.tsx / globals.css
│   └── middleware.ts        # session refresh (delegates to utils/supabase/middleware)
├── components/              # reusable React components
├── types/database.ts        # TS mirrors of the DB schema — keep in sync with migrations
└── utils/
    ├── auth/admin.ts        # checkAdminAccess(), getUserRole()
    └── supabase/            # server.ts / client.ts / middleware.ts
agent_docs/                  # project rules (.mdc)
docs/                        # business_rules.md + features/ behavioral spec
supabase/                    # config.toml + migrations/
```

## Supabase Clients & Auth

Use the existing helpers — never instantiate `@supabase/supabase-js` directly:

- `src/utils/supabase/server.ts` → `createClient()` (async) — Server Components & Server Actions
- `src/utils/supabase/client.ts` → `createClient()` (sync) — Client Components
- `src/utils/auth/admin.ts` → `checkAdminAccess()` / `getUserRole()`

The user role is **not** a JWT claim — it lives in the `profiles.role` column and is queried per request. The `setAll` cookie handler in the server client intentionally swallows errors when called from a Server Component; this is correct only because middleware refreshes sessions — don't "fix" it without removing that coupling.

Prefer **Server Actions** (`actions.ts` colocated under the route) over API routes for data writes. `route.ts` files exist only for genuine HTTP endpoints (e.g. `assessment/start/route.ts`, `training/rsvp/complete/route.ts`, `auth/confirm`).

## Data Model & RLS

Schema lives in `supabase/migrations/`; TS mirrors in `src/types/database.ts` (enums `TextType`, `TrainingType`, `UserRole`; interfaces `Text`, `DiagnosticSession`, `TrainingSession`, etc.). Keep them in sync when changing schema.

- `text` — `type` (`diagnostic` | `training`), `num_words` (pre-calculated and authoritative — WPM is computed server-side from this + `reading_time_ms`), `quiz_json`, `language` (default `pt-BR`).
- `diagnostic_session` — WPM + comprehension per assessment, owned by user (`auth.uid() = user_id`).
- `training_session` — RSVP sessions: `target_wpm`, `duration_time_s`, `training_type` (`rsvp`).
- `profiles` — `id` ↔ `auth.users.id`, `role` (`member` | `admin`). Auto-created on signup via the `on_auth_user_created` trigger, default `member`.
- `public.is_admin()` — SECURITY DEFINER helper used by RLS policies for admin-only text management.

RLS is enabled on every table: authenticated users read all `text`; users read/insert only their own sessions; admin text management is gated by `is_admin()`.

<important if="you are building or modifying UI, screens, or components">
Styling is a strict **monochromatic** design system — black/white/gray only, no color accents. Use Tailwind CSS v4 + DaisyUI component classes (not hand-rolled CSS), and Heroicons for icons. Follow the full spec in `agent_docs/ui-ux_guidelines.mdc` for card/input/button class conventions, the DaisyUI component list, and focus/hover/transition classes.

Accessibility: every input needs an associated `<label htmlFor>`, `required` where applicable, and a visible focus state. Mobile-first; use Tailwind responsive prefixes.
</important>

<important if="you are working on the assessment or RSVP training logic">
Read `docs/business_rules.md` for the behavioral spec before implementing. Compute all metrics server-side, never on the client:

- WPM = `num_words / (reading_time_ms / 60000)`, using the pre-calculated `text.num_words`.
- Initial RSVP target = baseline WPM × 1.20 (configurable).
- RSVP per-word display time = `60000 / target_wpm` ms; user-adjustable WPM range 80–800 (MVP).

Assessment rules: no upward scroll/regression during reading; the comprehension quiz runs immediately after "Finish Reading"; persist a `DiagnosticSession`.

RSVP training: words display at a single fixed focal point; auto-pause when the user leaves the tab/app and resume in place; persist a `TrainingSession` (no comprehension test in this phase).
</important>

<important if="you are working on admin features or privileged writes">
Admin routes must call `checkAdminAccess()` from `src/utils/auth/admin.ts` first — it `redirect`s unauthenticated/non-admin users away. Admin text management is gated by the `is_admin()` RLS policy on `text`. Never expose the service-role key to the client; route privileged writes through Server Actions that re-check the role.
</important>

## Conventions

- File naming: components PascalCase with default export; route dirs kebab-case; utilities camelCase/kebab-case.
- In pages, unwrap `params`/`searchParams` promises with React's `use()` hook.
- Never comment out code — delete it (confirm with the user first if non-trivial).
- `strict` TypeScript; avoid `any`.

Biome enforces formatting and import ordering (`organizeImports` is on) — don't restate those rules by hand; run `pnpm lint` / `pnpm format`.

Review `docs/` (`business_rules.md`, `docs/features/`) and the relevant `agent_docs/*.mdc` before implementing non-trivial features.