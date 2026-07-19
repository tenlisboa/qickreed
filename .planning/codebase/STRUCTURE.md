---
last_mapped_commit: 46ae8c4be55612ea89f855a285ca2ac3b02d3020
focus: arch
---

# Codebase Structure

**Analysis Date:** 2026-07-19

## Directory Layout

```
qickreed/
├── src/
│   ├── app/
│   │   ├── (auth)/                # auth routes group, no Sidebar
│   │   │   ├── auth/confirm/route.ts     # OTP verify (HTTP GET)
│   │   │   ├── login/                    # login page + actions.ts
│   │   │   └── signup/                   # signup page
│   │   ├── (authenticated)/       # protected routes with Sidebar shell
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx            # calls checkAdminAccess()
│   │   │   │   └── texts/{create,edit/[id],page.tsx,actions.ts,schemas.ts,components/}
│   │   │   ├── assessment/{page,reading,quiz,results,start/route}.tsx + actions.ts
│   │   │   ├── dashboard/{page.tsx,actions.ts,TrainingInputCard.tsx}
│   │   │   ├── training/{page.tsx,actions.ts,rsvp/}
│   │   │   │   └── rsvp/{page,quiz,feedback,complete/route}.tsx
│   │   │   └── layout.tsx                # Sidebar shell
│   │   ├── (immersive)/           # chrome-less full-screen
│   │   │   ├── layout.tsx
│   │   │   └── training/rsvp/session/page.tsx
│   │   ├── error/page.tsx
│   │   ├── error.tsx / global-error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx                    # root layout (Geist fonts, pt-BR)
│   │   └── page.tsx                      # marketing landing
│   ├── components/                # hand-rolled wrappers + ui/ primitives
│   │   ├── ui/                           # neobrutal-ui primitives
│   │   ├── Button.tsx Card.tsx Sidebar.tsx RsvpDisplay.tsx Timer.tsx
│   │   ├── QuizQuestion.tsx RichTextEditor.tsx ScrollLockTextArea.tsx
│   │   ├── DeleteTextModal.tsx ReadingMethodModal.tsx SubmitButton.tsx
│   ├── lib/
│   │   ├── llm/{client.ts,quiz-schema.ts}
│   │   ├── reading.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── database.ts                   # TS mirror of DB schema
│   ├── utils/
│   │   ├── actions/types.ts              # ActionResult<T> + ok/fail
│   │   ├── auth/{admin.ts,errors.ts}
│   │   ├── logging/{logger.ts,request-logger.ts}
│   │   └── supabase/{server.ts,client.ts,middleware.ts}
│   └── middleware.ts                     # exported from src root
├── src/__tests__/                  # vitest (utils.test.ts, setup.ts)
├── supabase/
│   ├── config.toml
│   └── migrations/                       # 8 SQL migration files
├── agent_docs/                           # .mdc rules + design.md / system.md
├── docs/                                 # business_rules.md + features/
├── .specs/                               # STATE.md decisions
├── .claude/skills/                       # project-loaded agent skills
├── .planning/                            # GSD planning artifacts
├── instrumentation.ts / sentry.*.config.ts
├── next.config.ts / tsconfig.json / biome.json / postcss.config.mjs
├── components.json                       # shadcn-style ui config (legacy)
├── package.json / pnpm-lock.yaml / pnpm-workspace.yaml
├── vitest.config.ts
└── AGENTS.md / MVP_SCOPE.md / README.md
```

## Directory Purposes

**`src/app/`:** Next.js App Router entry. All routes, layouts, pages, colocated Server Actions and HTTP route handlers live here. Organized by route group: `(auth)`, `(authenticated)`, `(immersive)`.

**`src/app/(auth)/`:** Public auth routes (no Sidebar). Contains `login/{page.tsx,actions.ts}`, `signup/page.tsx`, `auth/confirm/route.ts` (email OTP).

**`src/app/(authenticated)/`:** Protected routes rendered inside `Sidebar` shell. Subdirectories per feature: `dashboard`, `assessment`, `training` (+ `rsvp/*`), `admin/texts`. Every `actions.ts` is a `"use server"` module.

**`src/app/(authenticated)/admin/texts/`:** Admin text CRUD. `actions.ts` (server), `schemas.ts` (Zod), `components/{TextForm.tsx,QuizEditor.tsx}` (client form + quiz builder), `create/page.tsx`, `edit/[id]/page.tsx`, `page.tsx` (list). Protected by `admin/layout.tsx` `checkAdminAccess()`.

**`src/app/(immersive)/`:** Full-screen RSVP. `training/rsvp/session/page.tsx` is the only page; renders `RsvpDisplay` chrome-free.

**`src/components/`:** Shared React components. Wrappers (`Button.tsx`, `Card.tsx`, `Sidebar.tsx`, `RsvpDisplay.tsx`, `Timer.tsx`, `QuizQuestion.tsx`, `ScrollLockTextArea.tsx`, `RichTextEditor.tsx`, `ReadingMethodModal.tsx`, `DeleteTextModal.tsx`, `SubmitButton.tsx`) stabilize call sites. Primitives in `src/components/ui/*` use neobrutalism tokens from `src/app/globals.css`.

**`src/lib/`:** Pure domain logic (`reading.ts`, `utils.ts`) and infrastructure adapters (`lib/llm/{client,quiz-schema}.ts`). No React imports.

**`src/types/`:** TS mirrors of the DB schema. `database.ts` hosts enums (`TextType`, `TrainingType`, `UserRole`, `ReadingMethod`), interfaces (`Text`, `DiagnosticSession`, `TrainingSession`, `Profile`, `DashboardData`, `TrainingSessionResult`, etc.) and label maps (`READING_METHOD_LABELS`).

**`src/utils/`:** Cross-cutting infra. `actions/types.ts` (ActionResult), `auth/{admin,errors}.ts`, `logging/{logger,request-logger}.ts`, `supabase/{server,client,middleware}.ts`.

**`src/__tests__/`:** Vitest unit tests (only `utils.test.ts` + `setup.ts`).

**`supabase/`:** `config.toml` + `migrations/*.sql`. Schema and RLS source of truth.

**`agent_docs/`:** Project rules (`.mdc`) + `design.md`/`system.md` (neobrutal UI contract).

**`docs/`:** Business rules and behavioral spec (`business_rules.md`, `features/`).

**`.specs/`:** Architectural decisions (`STATE.md` — e.g. AD-005 design system).

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root HTML shell — `lang="pt-BR"`, Geist Sans/Mono fonts.
- `src/app/page.tsx`: Marketing landing; queries `getUser()` to switch CTA between guest and authed.
- `src/app/(authenticated)/layout.tsx`: Sidebar + main pane for protected routes.
- `src/app/(immersive)/layout.tsx`: Full-screen shell, no chrome.
- `src/middleware.ts`: Request pipeline — `x-request-id` + `updateSession`.
- `instrumentation.ts`: Sentry registration; `onRequestError`.

**Configuration:**
- `next.config.ts`: Next 15 config (Turbopack).
- `tsconfig.json`: Strict TS, path alias `@/*` → `./src/*`.
- `biome.json`: Lint/format rules; `organizeImports` on.
- `postcss.config.mjs`: Tailwind v4.
- `vitest.config.ts`: Test runner.
- `components.json`: shadcn-style UI config (legacy bootstrap).
- `supabase/config.toml`: Local Supabase backend.

**Core Logic:**
- `src/lib/utils.ts`: `cn`, `calculateWpm`, `isPassingComprehension`, `calculateComprehensionResult`.
- `src/lib/reading.ts`: `categorizeReader` (WPM × method → category).
- `src/lib/llm/client.ts`: `callChat` OpenAI-compatible chat client w/ timeout.
- `src/lib/llm/quiz-schema.ts`: `generateQuiz`, `QuizGenerationError`, Zod schema.
- `src/utils/actions/types.ts`: `ActionResult<T>`, `ok`, `fail`, `ActionErrorCode`.
- `src/utils/supabase/{server,client,middleware}.ts`: Supabase client accessors.
- `src/utils/auth/admin.ts`: `checkAdminAccess`, `getUserRole`.
- `src/utils/auth/errors.ts`: `mapAuthError`.
- `src/utils/logging/logger.ts`: Pino singleton with redaction.
- `src/utils/logging/request-logger.ts`: `getRequestLogger({module})`.
- `src/types/database.ts`: Enums and interfaces mirroring `supabase/migrations/`.

**HTTP Route Handlers:**
- `src/app/(auth)/auth/confirm/route.ts`: GET OTP verify.
- `src/app/(authenticated)/assessment/start/route.ts`: POST, delegates to `startAssessment()`.
- `src/app/(authenticated)/training/rsvp/complete/route.ts`: POST, `createTrainingSession()` + returns `{sessionId,hasQuiz}`.

**Server Actions (writes / queries):**
- `src/app/(auth)/login/actions.ts`: `login`, `signup`, `logout`.
- `src/app/(authenticated)/assessment/actions.ts`: `getRandomDiagnosticText`, `saveDiagnosticSession`, `getUserDiagnosticHistory`, `getLatestDiagnosticSession`, `checkUserHasAssessment`, `startAssessment`.
- `src/app/(authenticated)/dashboard/actions.ts`: `getDashboardData`, `prepareTrainingText`.
- `src/app/(authenticated)/training/actions.ts`: `getTrainingHistory`, `getRandomTrainingText`, `createTrainingSession`, `getLastDiagnosticWpm`, `getTrainingSessionById`, `getTrainingSessionResult`, `getTextQuizData`, `getTrainingSessionDetails`, `calculateServerScore`, `submitTrainingQuiz`, `getBenchmarkWpm`, `getTrainingTextTitle`.
- `src/app/(authenticated)/admin/texts/actions.ts`: `getTexts`, `getTextById`, `deleteText`, `checkTextInUse`, `createText`, `updateText`.

**Schema/Validation:**
- `src/app/(authenticated)/admin/texts/schemas.ts`: Zod `quizDataSchema`, `QuizQuestionType`, `TextFormData`.
- `src/types/database.ts`: TS schema mirror.

**Tests:**
- `src/__tests__/utils.test.ts`: Vitest unit tests.
- `src/__tests__/setup.ts`: Vitest setup.

## Naming Conventions

**Files (components):** PascalCase with default export — `Button.tsx`, `RsvpDisplay.tsx`, `QuizQuestion.tsx`.

**Files (UI primitives):** kebab/lowercase in `src/components/ui/` — `input.tsx`, `select.tsx`, `form-control.tsx`, `alert.tsx`.

**Files (routes):** Next convention — `page.tsx`, `layout.tsx`, `route.ts`, `actions.ts`, `schemas.ts`, `error.tsx`, `global-error.tsx`, `globals.css`.

**Files (utils/lib):** kebab-case — `request-logger.ts`, `quiz-schema.ts`.

**Route dirs:** kebab-case and Next route groups — `(auth)`, `(authenticated)`, `(immersive)`, `auth/confirm`, `assessment/start`, `admin/texts/edit/[id]`, `training/rsvp/feedback`.

**Functions:** camelCase for queries/mutations (`getDashboardData`, `prepareTrainingText`, `submitTrainingQuiz`, `createTrainingSession`); PascalCase for React components.

**Types/Interfaces:** PascalCase (`Text`, `TrainingSession`, `AssessmentResult`, `DashboardData`, `ActionResult<T>`).

**Enums:** PascalCase enum, UPPER_SNAKE for members (`TextType.DIAGNOSTIC`, `UserRole.ADMIN`, `ReadingMethod.INNER_VOICE`).

## Where to Add New Code

**New protected page (with Sidebar):** Create `src/app/(authenticated)/<feature>/page.tsx`. Add nav entry to `getNavigationItems(userRole)` in `src/components/Sidebar.tsx` if it should appear in the sidebar. If it needs writes, add colocated `src/app/(authenticated)/<feature>/actions.ts` (`"use server"`).

**New admin feature:** Place under `src/app/(authenticated)/admin/<feature>/`; protected automatically by `src/app/(authenticated)/admin/layout.tsx` (`checkAdminAccess()`). For privileged writes, re-check role in the action and rely on the `is_admin()` RLS policy.

**New full-screen (chrome-less) page:** Place under `src/app/(immersive)/...`. Use existing `src/app/(immersive)/layout.tsx`.

**New public/auth page:** Place under `src/app/(auth)/...`. No Sidebar shell.

**New Server Action:** Append to the colocated `actions.ts` of the relevant route group; return `ActionResult<T>` via `ok`/`fail` from `src/utils/actions/types.ts`; obtain Supabase via `await createClient()` from `src/utils/supabase/server.ts`; obtain logger via `getRequestLogger({module})`; call `revalidatePath` after mutations that affect cached pages.

**New HTTP endpoint (only if truly HTTP):** Create `<route>/route.ts`; import the Server Action it delegates to (see `assessment/start/route.ts` as template). Reserve for cases like RsvpDisplay `fetch` posts or external callbacks.

**New shared component:** Add to `src/components/<Name>.tsx` (PascalCase, default export) for wrappers, or `src/components/ui/<name>.tsx` for primitives. Prefer extending wrappers in `src/components/{Button,Card,...}.tsx` rather than inventing variants.

**New utility/helper:** Pure logic → `src/lib/<name>.ts` (no React imports). Infra adapter → `src/utils/<category>/<name>.ts`. New DB types/enums → `src/types/database.ts` and **mirror in supabase migration** (keep them in sync).

**New Supabase migration:** Add `supabase/migrations/<YYYYMMDDHHMMSS>_<name>.sql`; update `src/types/database.ts` and re-check RLS policies on touched tables.

**New test:** Co-locate or add to `src/__tests__/<name>.test.ts`; configure in `vitest.config.ts`.

## Special Directories

**`src/__tests__/`:** Vitest tests. Generated: No. Committed: Yes.

**`.next/`:** Next.js build output (Turbopack). Generated: Yes. Committed: No (gitignored).

**`node_modules/`:** pnpm install output. Generated: Yes. Committed: No.

**`.codegraph/`:** CodeGraph index. Generated: Yes. Committed: per-repo policy.

**`.planning/`:** GSD planning artifacts (`codebase/`, `STATE.md`, etc.). Generated: by tooling. Committed: Yes.

**`.specs/`:** Architectural decisions (AD-005 etc.) captured during spec. Committed: Yes.

**`.claude/skills/`:** Project agent skills (`supabase`, `supabase-postgres-best-practices`, `tlc-spec-driven`). Committed: Yes.

**`supabase/migrations/`:** Source-of-truth DB schema + RLS policies. Committed: Yes.

**`agent_docs/` & `docs/`:** Canonical design/business specs referenced by `AGENTS.md`. Comitted: Yes. Read both `agent_docs/design.md` and `agent_docs/system.md` before UI work; read `docs/business_rules.md` before assessment/RSVP logic.

---

*Structure analysis: 2026-07-19*