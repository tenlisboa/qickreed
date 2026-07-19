---
last_mapped_commit: 46ae8c4be55612ea89f855a285ca2ac3b02d3020
focus: quality
---

# Coding Conventions

**Analysis Date:** 2026-07-19

## Naming Patterns

**Files:**
- React components: PascalCase with default export — `src/components/Button.tsx`, `src/components/QuizQuestion.tsx`, `src/app/(authenticated)/dashboard/TrainingInputCard.tsx`.
- UI primitives (neobrutal-ui): lowercase kebab-case under `src/components/ui/` — `src/components/ui/button.tsx`, `src/components/ui/form-control.tsx`, `src/components/ui/select.tsx`. These are the only lowercase source files.
- Route directories: kebab-case — `(authenticated)/admin/texts/edit/[id]/`, `(auth)/auth/confirm/`, `(authenticated)/training/rsvp/feedback/`.
- Utilities and non-component modules: camelCase or kebab-case — `src/utils/auth/admin.ts`, `src/utils/logging/request-logger.ts`, `src/lib/utils.ts`, `src/middleware.ts`.
- Co-located files in a route directory share the directory's casing: `actions.ts`, `schemas.ts`, `route.ts` (Next.js convention).
- Server Action files are always named `actions.ts` (colocated under the route), e.g. `src/app/(authenticated)/training/actions.ts`, `src/app/(auth)/login/actions.ts`.

**Functions:**
- camelCase for all functions and methods — `createClient()`, `checkAdminAccess()`, `calculateWpm()`, `submitTrainingQuiz()`, `getRandomTrainingText()`.
- Server Actions that mutate/write data use verbs: `createText`, `updateText`, `deleteText`, `submitTrainingQuiz`, `prepareTrainingText`.
- Read-only Server Actions use `get*` / `is*` / `has*` / `check*` — `getTrainingHistory`, `getTextById`, `checkTextInUse`, `isPassingComprehension`.
- Client event handlers: `handle<Event>` — `handleAnswerSelect`, `handleContentChange`, `handleQuizChange`, `handleFormSubmit`.

**Variables:**
- camelCase for locals and module constants (`randomId`, `wordCount`, `remaining`).
- Module-level immutable constants: UPPER_SNAKE_CASE — `MIN_CHARS` (`src/app/(authenticated)/dashboard/TrainingInputCard.tsx`), `SLOW` / `SUBVOCAL_CEILING` (`src/lib/reading.ts`), `GENERIC_MESSAGE` (`src/utils/auth/errors.ts`), `QUIZ_QUESTION_TYPES` (`src/app/(authenticated)/admin/texts/schemas.ts`).

**Types:**
- `interface` for data shapes (DTOs, DB rows, props) — `interface Text`, `interface QuizData`, `interface TrainingHistory`, `interface ButtonProps`.
- `type` alias for unions and mappings — `type ActionErrorCode`, `type AuthMode = "login" | "signup"`, `type ActionResult<T>` (discriminated union).
- Enums are used for DB column mirrors: `enum TextType`, `enum TrainingType`, `enum UserRole`, `enum ReadingMethod` in `src/types/database.ts`.
- PascalCase for all type/interface names; generic params single uppercase letter (`<T>`).
- Exported types co-located with the code that owns them: action result types in `src/utils/actions/types.ts`, schema-inferred types (`type TextFormData = z.infer<typeof textSchema>`) in `src/app/(authenticated)/admin/texts/schemas.ts`.

## Code Style

**Formatting:**
- Biome 2.2.0 is the only formatter (`src/` enforced via `biome.json`).
- 2-space indentation, double quotes for strings, trailing commas, semicolons (Biome defaults).
- `organizeImports: "on"` — imports are auto-sorted; do NOT hand-order or reorder imports.
- Run `pnpm format` (biome `format --write`) and `pnpm lint` (biome `check`); do not restate formatting rules in code or comments.

**Linting:**
- Biome linter with `recommended` rules plus `next` and `react` recommended domains (`biome.json`).
- `noUnknownAtRules` is OFF (Tailwind v4 `@theme`/`@apply` rules must not warn).
- VCS integration enabled (`useIgnoreFile: true`); `node_modules`, `.next`, `dist`, `build` are ignored.
- TypeScript `strict: true` (`tsconfig.json`); avoid `any` — known escape-hatches with `any` exist (e.g. `as any` around `zodResolver` and `setValue("quiz", ... as any)` in `src/app/(authenticated)/admin/texts/components/TextForm.tsx`, and `user: any` in `src/utils/auth/admin.ts`'s return type) and should NOT be proliferated.

## Import Organization

**Order (Biome `organizeImports` handles this automatically):**
1. Node built-ins (`node:path`, `next/headers`, `next/navigation`, `next/cache`, `next/server`).
2. External packages (`@supabase/ssr`, `@heroicons/react`, `react`, `zod`, `react-hook-form`, `pino`).
3. `@/` path-aliased internal imports (`@/lib/...`, `@/utils/...`, `@/components/...`, `@/types/database`).
4. Relative imports (`./actions`, `../schemas`, `../../actions`).

**Path Aliases:**
- `@/*` → `./src/*` (declared in `tsconfig.json` `paths` and `vitest.config.ts` `resolve.alias`). Use `@/` for anything under `src/` that is not in the same directory; use relative imports only for siblings/near children inside a route folder.

**Type-only imports:** use `import type { ... }` for types and enums that are only used as types (`import type { UserRole } from "@/types/database"`, `import type { ActionResult } from "@/utils/actions/types"`).

## Error Handling

**Server Actions (discriminated `ActionResult<T>`):**
- Action handlers that need to return recoverable errors use the `ActionResult<T>` union from `src/utils/actions/types.ts` and the `ok()` / `fail()` helpers:
  ```ts
  // src/utils/actions/types.ts
  export type ActionResult<T> =
    | { data: T; error: null }
    | { data: null; error: ActionError };
  ```
- `ActionError.code` is one of `"unauthorized" | "not_found" | "db_error" | "validation" | "unknown"`; `message` is user-facing (pt-BR); `details` carries the raw error for logging and is NEVER returned to the UI.
- Login/signup follow this pattern (`src/app/(auth)/login/actions.ts`): on auth error, `mapAuthError()` produces `{ code, message, details }`, the action calls `fail(code, message, details)`, and the form renders `state?.error.message`.

**Action handlers that return data or success flags:**
- Some actions return `{ success: boolean; error?: string }` instead of `ActionResult` (e.g. `submitTrainingQuiz` in `src/app/(authenticated)/training/actions.ts`, `deleteText`/`createText`/`updateText` in `src/app/(authenticated)/admin/texts/actions.ts`). When extending these, prefer migrating to `ActionResult` for consistency; do not introduce a third shape.

**Redirects vs returns:**
- Auth/role gates call `redirect()` and never return — use `checkAdminAccess()` (`src/utils/auth/admin.ts`) at the top of every admin Server Action/page.
- Data-fetch actions return `null` on failure and log; they do NOT throw (e.g. `getRandomTrainingText`, `getTrainingHistory`).
- `getTexts` in `src/app/(authenticated)/admin/texts/actions.ts` is the exception — it `throw new Error("Erro ao buscar textos")`. Do not copy this; prefer returning `null` or an `ActionResult`.

**Route Handlers (HTTP):**
- Use `NextResponse.json({ error }, { status })` with explicit status codes — 400 for bad input, 500 for server errors (`src/app/(authenticated)/training/rsvp/complete/route.ts`).
- Wrap the body in `try/catch`, log the error via `getRequestLogger`, and return a generic pt-BR message to the client (never the raw `error.message`).
- Route handlers are thin HTTP adapters — delegate business logic to colocated `actions.ts` (see `src/app/(authenticated)/assessment/start/route.ts` which only calls `startAssessment()`).

**Client error display:**
- Use the neobrutal `Alert` component (`src/components/ui/alert.tsx`) with `variant="error"` (red `bg-error`) for form/server errors; `variant="success"` is non-color (per design system — success is not green).
- Inline validation errors: `<span className="bg-error ... border-[3px] border-black">` next to the field (see `src/app/(authenticated)/admin/texts/components/TextForm.tsx`).

## Logging

**Framework:** Pino (`pino` + `pino-pretty` in dev) initialized in `src/utils/logging/logger.ts`. Per-request scoped logging via `getRequestLogger({ module })` from `src/utils/logging/request-logger.ts` (correlates on the `x-request-id` header set by `src/middleware.ts`).

**Patterns:**
- Always obtain a logger inside the Server Action / Route Handler, not at module scope: `const log = await getRequestLogger({ module: "submitTrainingQuiz" });`
- Pass structured context as the first arg and the message as the second: `log.error({ err: error }, "Failed to update training session");`
- Use `log.warn` for expected-but-noted failures (`log.warn("No training texts available")`, login failures), `log.error` for unexpected failures, `log.info` for operational milestones (e.g. skipping cognitive validation when no quiz).
- The Pino logger redacts `password`, `token`, `apiKey`, `authorization`, `access_token`, `refresh_token`, `secret` and their nested forms (`*.password`, etc.) — do not bypass this by string-interpolating secrets into messages.

## Comments

**When to comment:**
- Comment the WHY, not the WHAT. Document business rules, intentional suppression of Supabase behavior, and decisions that look wrong but are correct.
- Examples of good comments in this codebase:
  - `src/utils/supabase/server.ts` — explains why `setAll` swallowing errors is correct (middleware refreshes sessions).
  - `src/app/(auth)/login/actions.ts` — "Email confirmation is disabled in this project… so sign in immediately after signup".
  - `src/app/(authenticated)/training/actions.ts` — "Keep the randomization business rule in code: Supabase/postgrest-js cannot express `ORDER BY random()` safely".
  - `src/utils/auth/errors.ts` — JSDoc on `mapAuthError` explaining user-enumeration prevention.

**Never comment out code** — delete it (ask the user first if non-trivial). This is an AGENTS.md rule.

**JSDoc/TSDoc:**
- Used sparingly, mainly on exported helpers with non-obvious semantics (`mapAuthError`, `DashboardTimelinePoint`'s docstring on `ppm`/`comprehension` semantics in `src/types/database.ts`).
- Inline `//` comments for short WHY notes; block `/** */` for public API contracts.

## Function Design

**Size:** Prefer small, single-purpose functions. Pure helpers (`calculateWpm`, `isPassingComprehension`, `calculateComprehensionResult` in `src/lib/utils.ts`) are a few lines and unit-testable; keep new business-rule math in `src/lib/` as pure functions, not inside Server Actions.

**Parameters:** Named, typed params; prefer object destructuring for 3+ args. Server Actions read `FormData` via `formData.get("name") as string` (login) or via zod parsing — never trust client-provided types blindly.

**Return Values:**
- Pure helpers return primitives/objects.
- Server Actions return `ActionResult<T>`, `{ success, error?, id? }`, or `T | null` (data fetches).
- Route Handlers return `NextResponse`/`Response`.
- Functions that combine processing and DB writes return the created/updated entity id so the caller can navigate (`createTrainingSession` returns `string | null`, `createText` returns `{ id? }`).

## Module Design

**Exports:**
- Components: single default export (`export default function Button(...)`); named exports only for supporting types/variants (`export type ButtonProps`, `export { buttonVariants }`).
- Utils/actions: named exports only (`export async function getTrainingHistory()`, `export function cn()`).
- Schemas: export the zod schema, its inferred type, and any reusable constants (`export const quizDataSchema`, `export type QuizDataInput`, `export const QUIZ_QUESTION_TYPES`).

**Barrel files:** None used. Import directly from the file that owns the symbol (`@/components/Button`, `@/utils/auth/admin`). Do not add `index.ts` re-exports.

**"use server" / "use client" placement:**
- `use server` at the top of every `actions.ts` file (`src/app/(authenticated)/training/actions.ts`, `src/utils/auth/admin.ts`).
- `use client` at the top of any file that uses hooks, event handlers, or browser APIs (`src/components/QuizQuestion.tsx`, `src/app/(authenticated)/dashboard/TrainingInputCard.tsx`).

## Server Actions vs Route Handlers

**Prefer Server Actions for writes.** Use `actions.ts` colocated under the route. Reserve `route.ts` for genuine HTTP endpoints triggered from the client (`fetch`/XHR), e.g.:
- `src/app/(authenticated)/assessment/start/route.ts` — POST adapter to `startAssessment()`.
- `src/app/(authenticated)/training/rsvp/complete/route.ts` — POST from the RSVP client to persist a session.
- `src/app/(auth)/auth/confirm/route.ts` — auth callback.

If you only need form submission with progressive enhancement, use a Server Action + `<form action={formAction}>` and the `useActionState` hook (see `src/app/(authenticated)/dashboard/TrainingInputCard.tsx`).

## Supabase Client Conventions

- Never instantiate `@supabase/supabase-js` directly. Use the helpers:
  - `src/utils/supabase/server.ts` → `createClient()` (async) for Server Components and Server Actions.
  - `src/utils/supabase/client.ts` → `createClient()` (sync) for Client Components.
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the anon/publishable key, **not** the service key). The service key must never reach the client.
- The user role lives in `profiles.role` (queried per request) — **not** a JWT claim. Gate privileged writes via `checkAdminAccess()` (`src/utils/auth/admin.ts`) and the `is_admin()` RLS policy on `text`.

## Design System Constraints (neobrutalism)

When touching UI, follow (codified in `agent_docs/design.md` and `agent_docs/system.md`):
- 3px solid black borders (`border-[3px] border-black`), hard zero-blur offset shadows (`shadow-brutal` / `-sm` / `-lg`), square corners (`rounded-none` / `rounded-base` where `--radius: 0`), flat fills, physical hover/active translate.
- Two accents only: `--main` (`#FFD23F`, primary/active/highlights) and `--error` (`#FF6B6B`, errors only). Text on accents is always black. **Success is non-color** — use a checkmark icon, not green.
- **DaisyUI is fully removed — do not reintroduce it or any DaisyUI class.**
- Prefer the wrapper components in `src/components/{Button,Card,ScrollLockTextArea,QuizQuestion,DeleteTextModal,Sidebar,Timer,RsvpDisplay,RichTextEditor}.tsx` so call sites stay stable; use Heroicons (`@heroicons/react`) for icons.
- Accessibility: every input needs `<label htmlFor>` and `required` where applicable; every interactive element needs a visible `focus-brutal` state; meet WCAG AA contrast.

---

*Convention analysis: 2026-07-19*