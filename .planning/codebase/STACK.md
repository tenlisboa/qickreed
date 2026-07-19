---
last_mapped_commit: 46ae8c4be55612ea89f855a285ca2ac3b02d3020
focus: tech
---

# Technology Stack

**Analysis Date:** 2026-07-19

## Languages

**Primary:**
- TypeScript 5 — all application source under `src/` (`src/app/`, `src/components/`, `src/utils/`, `src/lib/`)
- SQL (PostgreSQL dialect) — Supabase migrations in `supabase/migrations/*.sql` (schema definitions, RLS policies, triggers)

**Secondary:**
- CSS — Tailwind v4 tokens in `src/app/globals.css` (neobrutalism design system)
- TOML — `supabase/config.toml` (local backend configuration)
- JSON — Biome, tsconfig, package manifests

## Runtime

**Environment:**
- Node.js (LTS implied via `@types/node` ^20); Next.js 15.5.4 runs on the Node runtime for SSR/Server Actions and the edge runtime only for `middleware.ts`-adjacent work
- Browser — DOM runtime for Client Components (target via `browserslist: "> 1%"`)

**Package Manager:**
- pnpm (declared in `AGENTS.md`)
- Lockfile: present (`pnpm-lock.yaml` tracked by repo — `pnpm` is canonical)

## Frameworks

**Core:**
- Next.js 15.5.4 (App Router, Turbopack) — fullstack framework; entry configured in `next.config.ts`
- React 19.1.8 / react-dom 19.1.8 — UI library
- Tailwind CSS v4 (`tailwindcss` ^4) via `@tailwindcss/postcss` plugin in `postcss.config.mjs`; no `tailwind.config.*` — v4 uses CSS-first config in `src/app/globals.css`

**Testing:**
- Vitest 4.1.10 (`vitest.config.ts`) with globals + jsdom environment
- `@testing-library/react` 16.3.2, `@testing-library/jest-dom` 6.9.1, `@testing-library/dom` 10.4.1, jsdom 29
- `@vitejs/plugin-react` 6.0.3 for JSX transform in tests

**Build/Dev:**
- Turbopack (`next dev --turbopack`, `next build --turbopack`) — scripts in `package.json`
- Biome 2.2.0 — formatter + linter (`biome.json`), `organizeImports` on
- Supabase CLI 2.109.1 (devDep) — local backend (`supabase/config.toml`, migrations)

**Observability:**
- `@sentry/nextjs` 10.64.0 — wired through `sentry.{client,server,edge}.config.ts` and `next.config.ts` (via `withSentryConfig`). Points at GlitchTip (`GLITCHTIP_URL`) when configured; no-op without `SENTRY_DSN`
- `pino` 10.3.1 + `pino-pretty` 13.1.3 — structured logging (declared as `serverExternalPackages` in `next.config.ts`)

## Key Dependencies

**Critical (app logic):**
- `@supabase/ssr` 0.7.0 + `@supabase/supabase-js` 2.75.0 — auth + Postgres + storage clients (`src/utils/supabase/{server,client,middleware}.ts`)
- `react-hook-form` 7.65.0 + `@hookform/resolvers` 5.2.2 + `zod` 4.1.12 — form state + schema validation
- `dompurify` 3.3.0 (with `@types/dompurify`) — HTML sanitization for rich text (used by `src/components/RichTextEditor.tsx`)
- `react-quill-new` 3.6.0 — Quill rich text editor backing `RichTextEditor`
- `recharts` 3.2.1 — charts (dashboard analytics)
- `class-variance-authority` 0.7.1 + `clsx` 2.1.1 + `tailwind-merge` 3.6.0 — variant styling for UI primitives (`src/components/ui/*`)
- `@heroicons/react` 2.2.0 + `lucide-react` 1.23.0 — icon sets
- `@base-ui/react` 1.6.0 — unstyled headless primitives
- `import-in-the-middle` 3.3.1 + `require-in-the-middle` 8.0.1 — OpenTelemetry-style hook shims (required by Sentry)

**Infrastructure:**
- Supabase (Postgres 17 major_version, see `supabase/config.toml`) — database, auth, storage, realtime, edge functions
- GlitchTip / Sentry — error tracking (self-hostable; optional)

## Configuration

**Environment:**
- `.env` present (contains secrets — never read/quote); `.env.example` committed as documentation
- Required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon/publishable key, **not** service-role)
- Optional vars: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `GLITCHTIP_URL`, `LLM_BASE_URL` (default `http://localhost:11434/v1` → Ollama), `LLM_MODEL` (default `llama3.1`), `LLM_API_KEY`

**Build:**
- `next.config.ts` — `serverExternalPackages: ["pino", "pino-pretty"]`; wrapped by `withSentryConfig` (sourcemaps disabled unless `SENTRY_AUTH_TOKEN` set)
- `tsconfig.json` — `strict`, `target: ES2017`, `moduleResolution: bundler`, path alias `@/* → ./src/*`, `jsx: preserve`, Next plugin
- `biome.json` — 2-space indent, linter with Next + React recommended domains, `organizeImports: on`
- `postcss.config.mjs` — only `@tailwindcss/postcss` plugin
- `vitest.config.ts` — jsdom + globals, setup at `src/__tests__/setup.ts`, `@` alias, coverage reporters `text/json/html`
- `sentry.{client,server,edge}.config.ts` — `tracesSampleRate` 1.0 in dev / 0.1 in prod; disabled entirely without `SENTRY_DSN`

**Supabase local (`supabase/config.toml`):**
- `project_id = "qickreed"`; API port 54321; DB port 54322 (Postgres 17); Studio 54323; Realtime enabled; Edge runtime Deno 2 (`per_worker`); Inbucket email catcher 54324; Storage enabled (50 MiB limit)
- Auth: email signup on, email confirmation off, JWT expiry 3600s, refresh token rotation on, anonymous sign-in off, no OAuth/SMS/MFA enabled
- Seed at `supabase/seed.sql` (referenced via `[db.seed].sql_paths`)

## Platform Requirements

**Development:**
- Node.js 20+ (per `@types/node` ^20)
- pnpm (required package manager)
- Supabase CLI (`pnpm exec supabase` or global) for local backend (`supabase start`)
- (Optional) Ollama listening at `http://localhost:11434/v1` for LLM-powered quiz generation
- (Optional) GlitchTip instance for local error capture

**Production:**
- Next.js standalone output via `next start` (Turbopack build)
- Hosted Supabase project (Postgres 17, Auth, Storage) — env vars supplied at deploy
- No containerization files detected at repo root (no Dockerfile/compose)

---

*Stack analysis: 2026-07-19*