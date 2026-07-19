---
last_mapped_commit: 46ae8c4be55612ea89f855a285ca2ac3b02d3020
focus: quality
---

# Testing Patterns

**Analysis Date:** 2026-07-19

## Test Framework

> **Note on `AGENTS.md` vs. actual repo state.** `AGENTS.md` states "There is no test framework configured (no `test` script, no test deps)". That statement is **stale as of this commit (46ae8c4)**. The repo now HAS Vitest configured. Treat `AGENTS.md`'s claim as outdated; rely on the facts below and consider updating `AGENTS.md` in a follow-up.

**Runner:**
- Vitest 4.1.10 (`vitest` in `devDependencies`)
- Config: `vitest.config.ts` at project root

**Assertion library:**
- Vitest's built-in `expect` + `@testing-library/jest-dom` matchers (registered via setup file)
- React Testing Library 16.3.2 (`@testing-library/react`) and DOM Testing Library 10.4.1 are installed (for future component tests) but not yet exercised.

**Run commands:**
```bash
pnpm test          # vitest watch
pnpm test:run      # vitest run (single pass, CI-friendly)
```
(Both scripts are defined in `package.json`.)

**Config detail (`vitest.config.ts`):**
```ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,                       // describe/it/expect available without imports
    environment: "jsdom",               // DOM env (jsdom 29.1.1)
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    coverage: { reporter: ["text", "json", "html"] },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

- `test.globals: true` means `describe`/`it`/`expect` do NOT need to be imported — but the existing test (`src/__tests__/utils.test.ts`) imports them explicitly from `"vitest"`; either style works. Prefer explicit imports for clarity in new tests.
- `@vitejs/plugin-react` is enabled so JSX/TSX component tests compile.
- The `@` alias is mirrored from `tsconfig.json` so `@/lib/utils` resolves the same way it does in the app.

## Test File Organization

**Location:**
- Tests live under `src/__tests__/` (currently flat). The Vitest `include` glob also accepts co-located `*.test.ts` / `*.spec.ts` files anywhere under `src/`, so co-location with the module under test is permitted and encouraged for new tests.

**Naming:**
- `<module-name>.test.ts` — e.g. `src/__tests__/utils.test.ts` tests `src/lib/utils.ts`.
- For React components use `<ComponentName>.test.tsx`.

**Structure:**
```
src/
└── __tests__/
    ├── setup.ts          # global setup (@testing-library/jest-dom/vitest)
    └── utils.test.ts     # tests for src/lib/utils.ts
```

## Test Structure

**Suite organization** (verbatim from `src/__tests__/utils.test.ts`):
```ts
import { describe, expect, it } from "vitest";
import {
  calculateComprehensionResult,
  calculateWpm,
  isPassingComprehension,
} from "../lib/utils";

describe("WPM Calculation", () => {
  it("calculates WPM correctly using num_words and reading_time_ms", () => {
    const numWords = 500;
    const readingTimeMs = 60000; // 1 minute
    expect(calculateWpm(numWords, readingTimeMs)).toBe(500);
  });

  it("handles zero reading time gracefully", () => {
    expect(calculateWpm(100, 0)).toBe(0);
  });
});

describe("Comprehension Pass/Fail", () => {
  it("returns pass when comprehension >= 60%", () => { /* ... */ });
  it("calculates comprehension result with 10% reduction on fail", () => {
    const result = calculateComprehensionResult(50, 200);
    expect(result.passed).toBe(false);
    expect(result.newTargetWpm).toBe(180); // 200 * 0.9
  });
});
```

**Patterns:**
- One `describe` block per public function or behavior group.
- Multiple `it` per case; name describes the expected behavior in plain English.
- Arrange → Act → Assert order; keep cases independent (no shared mutable state).
- Boundary-value testing at business-rule thresholds (60% pass boundary, zero reading time).
- Comments inline only when clarifying arithmetic (`// 1 minute`, `// 200 * 0.9`).

**Setup/teardown:**
- `src/__tests__/setup.ts` registers jest-dom matchers globally:
  ```ts
  import "@testing-library/jest-dom/vitest";
  ```
- No per-test teardown needed today; add `beforeEach`/`afterEach` in the suite that needs it rather than globally.

## Mocking

**Framework:** Vitest's built-in `vi` (not yet used in the repo).

**Patterns (recommended for new tests):**
```ts
import { vi } from "vitest";

// Mock the server Supabase client so Server Actions can be exercised in isolation
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock Next.js server primitives that are not available in jsdom
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
```

**What to mock:**
- `@/utils/supabase/server` `createClient` — return a stub `from("...").select/insert/update/delete` builder.
- `next/headers`, `next/navigation`, `next/cache` — these Node/server modules are not available in jsdom and must be stubbed for any Server Action test.
- `@/utils/logging/request-logger` `getRequestLogger` — return a no-op logger (`{ error: vi.fn(), warn: vi.fn(), info: vi.fn() }`) to silence Pino output and avoid `async-hooks` request context in tests.
- External SDKs (`@supabase/ssr`, `react-quill-new`) when testing components that depend on them.

**What NOT to mock:**
- Pure helpers in `src/lib/` (`calculateWpm`, `isPassingComprehension`, `calculateComprehensionResult`, `categorizeReader`) — these are pure functions and the highest-value targets for real unit tests.
- `src/lib/utils.ts` `cn()` (clsx + tailwind-merge) — cheap to call directly; assert on outputs.

## Fixtures and Factories

**Test data:**
- The single existing test builds plain object literals inline (`{ numWords: 500, readingTimeMs: 60000 }`). No factories or fixtures exist.

**Location (when adding):**
- Co-locate small fixtures next to the test: `src/<area>/__fixtures__/` or `src/__tests__/fixtures/`.
- For larger or shared fixtures (e.g. a full `QuizData` payload mirroring `quizDataSchema` in `src/app/(authenticated)/admin/texts/schemas.ts`), put them in `src/__tests__/fixtures/` and import via the `@/` alias.
- Use zod schemas to *generate* valid fixtures (`quizDataSchema.parse({...})`) rather than hand-building JSON — this keeps fixtures valid as schemas evolve.

## Coverage

**Requirements:** None enforced (no CI threshold, no `--coverage` in the `test` scripts).

**View coverage:**
```bash
pnpm test:run --coverage     # writes text + json + html (per vitest.config.ts reporters)
```
HTML report lands under the default `coverage/` directory (gitignored; confirm `.gitignore` covers it before committing any changes).

**Gap note:** Coverage today is limited to `src/lib/utils.ts`'s three pure helpers (`calculateWpm`, `isPassingComprehension`, `calculateComprehensionResult`). Everything else — `src/lib/reading.ts` (`categorizeReader`), Server Actions, Route Handlers, components, and the `mapAuthError` / `normalizeQuiz` validators — is uncovered (see CONCERNS.md for the full gap list).

## Test Types

**Unit tests:**
- The only type present. Fast, pure-function tests against `src/lib/utils.ts`. Always compute metrics server-side (`docs/business_rules.md`), so metric math is the canonical unit-test target.

**Integration tests:**
- Not present. When adding, exercise Server Actions with a mocked Supabase client (see Mocking above) rather than hitting a real Postgres. The local Supabase stack (`supabase/`) is for manual/e2e validation, not Vitest runs.

**E2E tests:**
- Not used. No Playwright/Cypress dependency. If end-to-end coverage is needed later, Playwright is the natural fit for a Next.js App Router app and can drive the local Supabase backend via `supabase start`.

## Common Patterns

**Async testing:**
```ts
// Server Actions return Promises — use async/await in the test
it("returns null when user is not authenticated", async () => {
  vi.mocked(createClient).mockResolvedValueOnce(stubUnauthedClient());
  expect(await getRandomTrainingText()).toBeNull();
});
```

**Error testing:**
```ts
it("throws on malformed quiz payload", () => {
  expect(() => quizDataSchema.parse({ questions: [] })).toThrow();
});
```
For Server Actions that use `ActionResult<T>`, assert on the discriminated union shape, not on thrown exceptions:
```ts
const res = await login(null, formData);
expect(res.error?.code).toBe("unauthorized");
expect(res.data).toBeNull();
```

## Current State & Recommendations

- **Existing coverage**: `src/__tests__/utils.test.ts` — 8 `it` blocks covering WPM math and the comprehension pass/fail threshold (60%) + 10% WPM reduction on fail.
- **Recommended next targets** (priority order):
  1. `src/lib/reading.ts` `categorizeReader` — pure, has multiple branches (reading method × WPM thresholds), high-value and low-effort.
  2. `src/utils/auth/errors.ts` `mapAuthError` — pure, branches over Supabase error messages; currently has zero coverage despite handling user-enumeration safety.
  3. `src/app/(authenticated)/admin/texts/schemas.ts` — zod `quizDataSchema` superRefine rules (unique options, correct-index bounds) are pure and easy to property-test.
  4. `src/app/(authenticated)/training/actions.ts` `calculateServerScore` — pure-ish (no DB; takes quiz + answers), migrate it to `src/lib/` and unit test.
- **Do not add tests that require a live Supabase/Postgres connection** to the Vitest suite — keep unit tests hermetic. Anything needing the DB belongs in a separate integration suite or Playwright e2e.

---

*Testing analysis: 2026-07-19*