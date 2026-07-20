# Phase 02: admin-auth-hardening — Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 10 (2 modified source + 7 caller updates + 1 net-new test file; `src/utils/actions/types.ts` is a read-only reference)
**Analogs found:** 9 / 10 (one net-new test file has only a thin analog — see "No Analog Found")

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/(authenticated)/admin/texts/actions.ts` | service (Server Actions) | CRUD + request-response | `src/app/(authenticated)/assessment/actions.ts` (`saveDiagnosticSession`, `getRandomDiagnosticText`) | exact |
| `src/utils/auth/admin.ts` | middleware / auth guard (server action) | request-response | itself + `log.warn` usage in `assessment/actions.ts:131` | exact |
| `src/utils/actions/types.ts` | utility / types | n/a (reference only) | n/a — consumed, not modified | reference |
| `src/app/(authenticated)/admin/texts/page.tsx` | component (client) | request-response | `src/app/(authenticated)/assessment/quiz/page.tsx` (lines 116–126 unwrap) | role-match |
| `src/app/(authenticated)/admin/texts/edit/[id]/page.tsx` | component (client) | request-response | `src/app/(authenticated)/assessment/quiz/page.tsx` (lines 116–126) + own current shape | role-match |
| `src/app/(authenticated)/admin/texts/create/page.tsx` | component (client) | request-response | `src/app/(authenticated)/assessment/quiz/page.tsx` (result.error branch) | role-match |
| `src/components/DeleteTextModal.tsx` | component (client) | request-response | `src/app/(authenticated)/assessment/quiz/page.tsx` (result.error branch) | role-match |
| `src/app/(authenticated)/assessment/reading/page.tsx` | component (client) | request-response | `src/app/(authenticated)/assessment/quiz/page.tsx` (lines 28–49) | exact (sibling) |
| `src/app/(authenticated)/assessment/quiz/page.tsx` | component (client) | request-response | itself — already consumes `ActionResult` for `saveDiagnosticSession` | exact |
| `src/app/(immersive)/training/rsvp/session/page.tsx` | component (client) | request-response | `src/app/(authenticated)/assessment/reading/page.tsx` (lines 26–41) | role-match |
| `src/__tests__/admin-texts-actions.security.test.ts` (new) | test | unit / mock | `src/__tests__/utils.test.ts` + `vitest.config.ts` + `src/__tests__/setup.ts` | thin (see notes) |

## Pattern Assignments

### `src/app/(authenticated)/admin/texts/actions.ts` (service / Server Actions, CRUD + request-response)

**Analog:** `src/app/(authenticated)/assessment/actions.ts` — the canonical `ActionResult<T>` action file in this codebase. Both `getRandomDiagnosticText` (read) and `saveDiagnosticSession` (mutating write) demonstrate the exact pattern Phase 2 must copy.

**Imports pattern** (`src/app/(authenticated)/assessment/actions.ts:1-14`):
```typescript
"use server";

import { redirect } from "next/navigation";
import { categorizeReader } from "@/lib/reading";
import type {
  AssessmentResult,
  Text,
  UserAssessmentHistory,
} from "@/types/database";
import { ReadingMethod } from "@/types/database";
import type { ActionResult } from "@/utils/actions/types";
import { fail, ok } from "@/utils/actions/types";
import { getRequestLogger } from "@/utils/logging/request-logger";
import { createClient } from "@/utils/supabase/server";
```

**Core success / error pattern** (`src/app/(authenticated)/assessment/actions.ts:28-39`):
```typescript
if (error) {
  const log = await getRequestLogger({ module: "getRandomDiagnosticText" });
  log.error({ err: error }, "Failed to fetch diagnostic text");
  return fail("db_error", "Erro ao carregar texto de avaliação", error);
}

if (!data) {
  return fail("not_found", "Nenhum texto de avaliação disponível");
}

return ok(data);
```

**Mutating-action pattern with auth + revalidatePath** (`src/app/(authenticated)/assessment/actions.ts:41-58, 99-118, 145-154`):
```typescript
export async function saveDiagnosticSession(
  textId: string,
  readingTimeMs: number,
  comprehensionScore: number,
  readingMethod: ReadingMethod | null,
): Promise<ActionResult<AssessmentResult>> {
  const supabase = await createClient();

  // Get user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    const log = await getRequestLogger({ module: "saveDiagnosticSession" });
    log.error({ err: userError }, "Failed to get user");
    return fail("unauthorized", "Usuário não autenticado", userError);
  }
  // ... (db work) ...
  if (sessionError) {
    const log = await getRequestLogger({ module: "saveDiagnosticSession" });
    log.error({ err: sessionError }, "Failed to save diagnostic session");
    return fail(
      "db_error",
      "Não foi possível salvar a sessão de avaliação",
      sessionError,
    );
  }
  // ... (no revalidatePath here — but admin texts actions already use it) ...
  return ok({ /* shape */ });
}
```

**Target shape to migrate (current `actions.ts:23-217` — replace ad-hoc `{ success, error?, id? }` with `ActionResult<T>` via `ok()`/`fail()`):**
```typescript
// Current (lines 23-28):
export async function getTexts({
  page = 1, search = "", sort = "created_at", order = "desc",
}: TextListParams = {}): Promise<TextListResult> { /* throws on error */ }

// Current (lines 83-111):
export async function deleteText(
  id: string,
): Promise<{ success: boolean; error?: string }> { /* ... */ }

// Current (lines 153-181):
export async function createText(
  data: CreateTextData,
): Promise<{ success: boolean; error?: string; id?: string }> { /* ... */ }

// Current (lines 192-218):
export async function updateText(
  id: string, data: UpdateTextData,
): Promise<{ success: boolean; error?: string }> { /* ... */ }
```

**Pattern guidance (lift into PLAN.md):**
1. Add `import type { ActionResult } from "@/utils/actions/types"; import { fail, ok } from "@/utils/actions/types";` (note the same-file type-only + value split seen in `assessment/actions.ts:11-12`).
2. As the **first statement** of `createText`, `updateText`, `deleteText`, AND `getTexts`, add `await checkAdminAccess();` (per D-01/D-03). The `getTextById` action gets **no** auth call (D-04).
3. Convert each return: `throw new Error(...)` / `{ success: false, error: "..." }` → `fail("db_error" | "validation" | "not_found", "<pt-BR msg>", <raw err>)`; `{ success: true, ... }` → `ok({...})`. Keep `revalidatePath("/admin/texts")` (and the per-id variant in `updateText`) immediately before `ok(null)` on the success branch. `checkTextInUse` rejection → `fail("validation", "Este texto não pode ser deletado pois está sendo usado em sessões de avaliação.")` (per D-08).
4. New signatures: `getTexts(...): Promise<ActionResult<TextListResult>>`, `getTextById(id): Promise<ActionResult<Text | null>>` (emit `ok(null)` on missing row — do NOT introduce `not_found`), `createText(data): Promise<ActionResult<{ id: string }>>`, `updateText(id, data): Promise<ActionResult<null>>`, `deleteText(id): Promise<ActionResult<null>>`. Do NOT emit `fail("unauthorized")` on the auth path — `checkAdminAccess()` throws `redirect()` first (D-07).

---

### `src/utils/auth/admin.ts` (middleware / server-action auth guard, request-response)

**Analog:** itself (the only auth guard in the repo) + the `log.warn` precedent in `assessment/actions.ts:128-132`.

**Current source — verbatim** (`src/utils/auth/admin.ts:1-42`):
```typescript
"use server";

import { redirect } from "next/navigation";
import type { UserRole } from "@/types/database";
import { getRequestLogger } from "@/utils/logging/request-logger";
import { createClient } from "@/utils/supabase/server";

export async function checkAdminAccess(): Promise<{
  user: any;
  role: UserRole;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Get user role from profiles table
  const { data: profile, error: roleError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleError || !profile) {
    const log = await getRequestLogger({ module: "checkAdminAccess" });
    log.error({ err: roleError }, "Failed to fetch user role");
    redirect("/dashboard");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  return { user, role: profile.role };
}
```

**The `log.warn` precedent to copy** (`src/app/(authenticated)/assessment/actions.ts:128-132`):
```typescript
if (levelError) {
  // Non-fatal: the default column value already covers Level 1; log and continue.
  const log = await getRequestLogger({ module: "saveDiagnosticSession" });
  log.warn({ err: levelError }, "Failed to set user level to 1");
}
```

**Pattern guidance (lift into PLAN.md):**
1. Inside `checkAdminAccess()`, in the `profile.role !== "admin"` branch (line 36-38), insert a `log.warn(...)` call **before** `redirect("/dashboard")`. Use `getRequestLogger({ module: "checkAdminAccess" })` (keep module tag already in use at line 31 — executor may choose to reuse or rename per Agent's Discretion).
2. English message (AD-004) including `userId`: e.g. `log.warn({ userId: user.id }, "Non-admin user blocked from admin action");` — this is the canonical GlitchTip/Sentry signal per D-02.
3. Leave the existing `log.error({ err: roleError }, "Failed to fetch user role")` (line 32) untouched — it's a different signal (profile-fetch failure = app malfunction, not a block).
4. Do NOT change the `user: any` return type (CONTEXT §deferred → TYPE-01 owns it; Phase 2 leaves it).

---

### `src/utils/actions/types.ts` (utility / types — REFERENCE ONLY, no change)

**Verbatim** (`src/utils/actions/types.ts:1-28`):
```typescript
export type ActionErrorCode =
  | "unauthorized"
  | "not_found"
  | "db_error"
  | "validation"
  | "unknown";

export interface ActionError {
  code: ActionErrorCode;
  message: string; // user-facing, pt-BR
  details?: unknown; // logged, never shown to user
}

export type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}

export function fail<T>(
  code: ActionErrorCode,
  message: string,
  details?: unknown,
): ActionResult<T> {
  return { data: null, error: { code, message, details } };
}
```

**Pattern guidance:** All 5 admin/texts actions and all updated callers import `ActionResult`, `ok`, `fail` from `@/utils/actions/types`. The `details` field is always the raw Supabase error object (logged via `log.error({ err }, "...")` before the `fail(...)` call — never surfaced to the user). Use the `error.message` field as the pt-BR user-facing string.

---

### `src/app/(authenticated)/admin/texts/page.tsx` (client component, request-response × 2 `getTexts` calls)

**Analog for `ActionResult<T>` unwrap:** `src/app/(authenticated)/assessment/quiz/page.tsx:116-126` (consumes `saveDiagnosticSession`):
```tsx
const result = await saveDiagnosticSession(
  textId, readingTimeMs, comprehensionScore, readingMethod,
);

if (result.error) {
  setError(result.error.message);
  return;
}
// result.data is narrowed to AssessmentResult here
router.push("/assessment/results");
```

**Current call sites to update** (`src/app/(authenticated)/admin/texts/page.tsx:170-191, 197-214`):
```tsx
useEffect(() => {
  const fetchTexts = async () => {
    setIsLoading(true);
    try {
      const result = await getTexts({ page, search, sort, order });
      setTexts(result.texts);            // ← must become result.data.texts after ok()
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };
  fetchTexts();
}, [page, search, sort, order]);
```

**Pattern guidance (lift into PLAN.md):**
1. After Phase 2, `getTexts()` returns `ActionResult<TextListResult>`. Replace `result.texts` → `result.error ? <error-branch> : result.data.texts`. Because `getTexts` calls `checkAdminAccess()` first, a non-admin will **never reach the unwrap** (the action throws `NEXT_REDIRECT` from the Server Action call). The `try/catch` will observe the redirect as a rejection — keep the existing empty `catch {}`.
2. Two call sites (initial `useEffect` lines 170-191 AND `handleDeleteSuccess` lines 197-214). Apply the same unwrap to both. If `result.error` is non-null it's a `db_error` (auth would have thrown); surface `result.error.message` to existing error UI state.
3. Do NOT add `checkAdminAccess()` to the page — the action handles it. The page is already behind `admin/layout.tsx` access control; the new app-layer check is defense-in-depth, not a UI change.

---

### `src/app/(authenticated)/admin/texts/edit/[id]/page.tsx` (client component, request-response × 2 calls)

**Analog for unwrap:** `src/app/(authenticated)/assessment/quiz/page.tsx:116-126` (above).

**Current `getTextById` call** (`src/app/(authenticated)/admin/texts/edit/[id]/page.tsx:30-47`):
```tsx
useEffect(() => {
  const fetchText = async () => {
    try {
      const textData = await getTextById(resolvedParams.id);
      if (textData) {
        setText(textData);
      } else {
        setError("Texto não encontrado");
      }
    } catch {
      setError("Erro ao carregar texto");
    } finally {
      setIsLoading(false);
    }
  };
  fetchText();
}, [resolvedParams.id]);
```

**Current `updateText` call** (`src/app/(authenticated)/admin/texts/edit/[id]/page.tsx:49-73`):
```tsx
const onSubmit = async (data: TextFormData) => {
  setIsSubmitting(true);
  setError(null);
  try {
    const result = await updateText(resolvedParams.id, {
      title: data.title, content: data.content,
      type: data.type as TextType, language: data.language,
      num_words: data.num_words, quiz_json: (data.quiz as any) ?? null,
    });

    if (result.success) {
      router.push("/admin/texts");
    } else {
      setError(result.error || "Erro ao atualizar texto");
    }
  } catch {
    setError("Erro inesperado ao atualizar texto");
  } finally {
    setIsSubmitting(false);
  }
};
```

**Pattern guidance (lift into PLAN.md):**
1. `getTextById` now returns `ActionResult<Text | null>`. Replace `if (textData)` with `if (result.error) { setError(result.error.message); } else if (result.data) { setText(result.data); } else { setError("Texto não encontrado"); }` — note `ok(null)` is the missing-row case.
2. `updateText` now returns `ActionResult<null>`. Replace `if (result.success) ... else setError(result.error || ...)` with `if (result.error) { setError(result.error.message); return; } router.push("/admin/texts");` — exactly the quiz-page pattern. The `await checkAdminAccess()` inside `updateText` means non-admin access throws before the return; the existing `catch` block absorbs that.

---

### `src/app/(authenticated)/admin/texts/create/page.tsx` (client component, request-response)

**Analog:** `src/app/(authenticated)/assessment/quiz/page.tsx:116-126`.

**Current call** (`src/app/(authenticated)/admin/texts/create/page.tsx:23-43`):
```tsx
try {
  const result = await createText({
    title: data.title, content: data.content,
    type: data.type as TextType, language: data.language,
    num_words: data.num_words, quiz_json: (data.quiz as any) ?? null,
  });

  if (result.success) {
    router.push("/admin/texts");
  } else {
    setError(result.error || "Erro ao criar texto");
  }
} catch {
  setError("Erro inesperado ao criar texto");
}
```

**Pattern guidance (lift into PLAN.md):** `createText` returns `ActionResult<{ id: string }>`. Replace the `if (result.success)` branch with the quiz-page pattern: `if (result.error) { setError(result.error.message); return; } router.push("/admin/texts");`. If the planner wants to use the new `result.data.id` (e.g. for navigation to the edit page), the success path becomes `router.push(\`/admin/texts/edit/${result.data.id}\`)` — but the current UX just returns to the list, so behavior should match.

---

### `src/components/DeleteTextModal.tsx` (client component, request-response)

**Analog:** `src/app/(authenticated)/assessment/quiz/page.tsx:116-126`.

**Current call** (`src/components/DeleteTextModal.tsx:34-52`):
```tsx
const handleDelete = async () => {
  setIsDeleting(true);
  setError(null);
  try {
    const result = await deleteText(textId);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || "Erro ao deletar texto");
    }
  } catch (_err) {
    setError("Erro inesperado ao deletar texto");
  } finally {
    setIsDeleting(false);
  }
};
```

**Pattern guidance (Lift into PLAN.md):** `deleteText` returns `ActionResult<null>`. Replace with: `if (result.error) { setError(result.error.message); return; } onSuccess(); onClose();` — quiz-page pattern. Note that the `validation` case (text-in-use) now flows through `result.error.message` rather than `result.error`, so the existing pt-BR message from D-08 carries through unchanged.

---

### `src/app/(authenticated)/assessment/reading/page.tsx` (client component, request-response — non-admin caller)

**Analog:** its sibling `src/app/(authenticated)/assessment/quiz/page.tsx:28-49` (already calls `getTextById`).

**Current call** (`src/app/(authenticated)/assessment/reading/page.tsx:26-41`):
```tsx
const fetchText = useCallback(async () => {
  try {
    const data = await getTextById(textId!);
    if (!data) {
      setError("Erro ao carregar texto");
      return;
    }
    setText(data);
  } catch (_err) {
    setError("Erro ao carregar texto");
  } finally {
    setLoading(false);
  }
}, [textId]);
```

**Pattern guidance (lift into PLAN.md):** Per D-09, non-admin callers branch on `result.data` only. Convert to:
```tsx
const result = await getTextById(textId!);
if (result.error || !result.data) {
  setError(result.error?.message ?? "Erro ao carregar texto");
  return;
}
setText(result.data);
```
The UI behavior is unchanged. `result.error` is only ever a `db_error` here (no auth check in `getTextById`), so `result.error?.message` already maps to the existing pt-BR string.

---

### `src/app/(authenticated)/assessment/quiz/page.tsx` (client component, request-response — already an `ActionResult` consumer)

**Analog:** itself — already consumes `saveDiagnosticSession` via `result.error` / `result.data` at lines 116-126. The `getTextById` call (lines 28-49) just needs to switch to the same shape.

**Current `getTextById` call** (`src/app/(authenticated)/assessment/quiz/page.tsx:28-49`):
```tsx
const fetchText = useCallback(async (textId: string) => {
  try {
    const data = await getTextById(textId);
    if (!data) {
      setError("Erro ao carregar texto");
      return;
    }
    setText(data);
    if (data.quiz_json) {
      setQuizData(data.quiz_json as QuizData);
    } else {
      setError("Quiz não encontrado para este texto");
    }
  } catch (_err) {
    setError("Erro ao carregar texto");
  } finally {
    setLoading(false);
  }
}, []);
```

**Reference `saveDiagnosticSession` unwrap already in this file** (`src/app/(authenticated)/assessment/quiz/page.tsx:116-126`):
```tsx
const result = await saveDiagnosticSession(
  textId, readingTimeMs, comprehensionScore, readingMethod,
);

if (result.error) {
  setError(result.error.message);
  return;
}
// result.data is the AssessmentResult
```

**Pattern guidance (Lift into PLAN.md):** Convert `getTextById` to: `const result = await getTextById(textId); if (result.error || !result.data) { setError(...); return; } setText(result.data); if (result.data.quiz_json) { setQuizData(result.data.quiz_json as QuizData); } else { setError("Quiz não encontrado para este texto"); }`. No other changes — `saveDiagnosticSession` consumption is already correct and stays as it is.

---

### `src/app/(immersive)/training/rsvp/session/page.tsx` (client component, request-response — non-admin caller)

**Analog:** `src/app/(authenticated)/assessment/reading/page.tsx:26-41` (identical `getTextById` shape).

**Current call** (`src/app/(immersive)/training/rsvp/session/page.tsx:23-38`):
```tsx
const fetchText = useCallback(async () => {
  try {
    const data = await getTextById(textId!);
    if (!data) {
      setError("Erro ao carregar texto");
      return;
    }
    setText(data);
  } catch (_err) {
    setError("Erro ao carregar texto");
  } finally {
    setLoading(false);
  }
}, [textId]);
```

**Pattern guidance (Lift into PLAN.md):** Identical to `assessment/reading/page.tsx`. Convert to `result.error || !result.data` branch + `setText(result.data)`. UI behavior unchanged.

---

### `src/__tests__/admin-texts-actions.security.test.ts` (NEW — test, unit/mock)

**Analogs (thin):**
- `src/__tests__/utils.test.ts` — pure vitest, no Supabase mocking precedent in the repo.
- `vitest.config.ts` — jsdom env, `@` alias, globals on, setup file `src/__tests__/setup.ts`.
- `src/__tests__/setup.ts` — only `import "@testing-library/jest-dom/vitest";` (1 line).

**Vitest config** (`vitest.config.ts:1-21`):
```typescript
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    coverage: { reporter: ["text", "json", "html"] },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

**Existing test pattern** (`src/__tests__/utils.test.ts:1-7`):
```typescript
import { describe, expect, it } from "vitest";
import {
  calculateComprehensionResult,
  calculateWpm,
  isPassingComprehension,
} from "../lib/utils";
```

**Pattern guidance (Lift into PLAN.md):**
1. **Mock strategy — per D-11:** mock `@/utils/supabase/server` ONLY. Use `vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }))`. Do NOT mock `@/utils/auth/admin` — `checkAdminAccess()` must run end-to-end so the redirect throw is observable.
2. The fake supabase client returned by `createClient()` must expose:
   - `.auth.getUser()` returning `{ data: { user: { id: <uid> } }, error: null }` (admin case) OR `{ data: { user: null }, error: <X> }` (no-user case).
   - `.from(table)` returning a chainable with `.select()/insert()/update()/delete()/.eq()/.single()/.limit()/.maybeSingle()/.order()/.range()/.ilike()` — use a builder recording call order (assert: the mutating method was NOT called before `auth.getUser` + `profiles.select` resolved to non-admin).
   - `.from("profiles").select("role").eq("id", uid).single()` → `{ data: { role: "admin" | "member" }, error: null }` (the role signal test cases switch on).
3. Redirect assertion: per D-11, **do not** assert on the redirect URL string — instead assert "the action did not return a value AND no Supabase mutating method on `text` was called". Next's `redirect()` throws in Server Action context; in test env it'll surface as a rejected promise or a thrown object. `await expect(action(...)).rejects.toThrow()` + a spy assertion `expect(supabase.from).not.toHaveBeenCalledWith("text")` (or equivalent mutating-method spy) is the durable shape.
4. Set `process.env.NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to dummy values in the test setup — `createClient()` reads them.
5. Mock `next/cache`'s `revalidatePath` (used by `createText`/`updateText`/`deleteText` on success — D-10 #2): `vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))` and assert it WAS called on the admin-success path and NOT called on the auth-block path.
6. Mock `next/headers` if `getRequestLogger` is reached (it awaits `headers()`): provide `vi.mock("next/headers", () => ({ headers: async () => new Headers() }))`. Sentinel — only needed if the action makes it past the auth check; including it keeps the success-path test from throwing.
7. File naming per Agent's Discretion: `admin-texts-actions.security.test.ts` (single file) OR split per-action. The planner recommends one file with `describe` blocks per action.

## Shared Patterns

### Server Action auth guard
**Source:** `src/utils/auth/admin.ts:8-41`
**Apply to:** `createText`, `updateText`, `deleteText`, `getTexts` — each gets `await checkAdminAccess();` as its **first** statement (before `createClient()`). `getTextById` does NOT get it (D-04).
```typescript
export async function createText(data: CreateTextData): Promise<ActionResult<{ id: string }>> {
  await checkAdminAccess();                 // ← insert as line 1 of the body
  const supabase = await createClient();
  // ... rest unchanged in spirit
}
```

### `ActionResult<T>` success + error returns
**Source:** `src/app/(authenticated)/assessment/actions.ts:28-38, 54-58, 67-71, 86-94, 110-118, 145-154`
**Apply to:** all 5 actions in `admin/texts/actions.ts` — and all 7 caller sites.
```typescript
// success
return ok(data);                       // read returning a row
return ok(null);                       // read where missing row is normal (getTextById)
return ok({ id: text.id });            // create
return ok(null);                       // update / delete (no payload)

// error (logged first, then fail — message is pt-BR, details is the raw err)
const log = await getRequestLogger({ module: "<actionName>" });
log.error({ err: <err> }, "<English message>");
return fail("db_error" | "validation" | "not_found", "<pt-BR message>", <err>);
```

### Caller-side unwrap
**Source:** `src/app/(authenticated)/assessment/quiz/page.tsx:116-126`
**Apply to:** all 7 caller pages + modal.
```tsx
const result = await actionName(args);
if (result.error) {
  setError(result.error.message);   // pt-BR user-facing
  return;
}
// result.data is now T-typed
doThingWith(result.data);
```
For `getTextById` callers that treat missing rows as "couldn't fetch" (assessment/reading, assessment/quiz, training/rsvp/session, admin edit), the branch is `if (result.error || !result.data) { setError(result.error?.message ?? "<fallback>"); return; }` so `ok(null)` is handled cleanly.

### Per-action Pino logger accessor
**Source:** `src/utils/logging/request-logger.ts:5-17`
**Apply to:** `checkAdminAccess` (new warn log) and every new `log.error`/`log.warn` inside the migrated actions.
```typescript
const log = await getRequestLogger({ module: "<actionName>" });
log.error({ err: <err> }, "English message");
log.warn({ <context> }, "English message");
```

### Validation → `fail("validation", ...)` (no schema in actions.ts itself)
**Source:** D-08 in `02-CONTEXT.md`; precedent: none in the codebase yet (first `validation` emission).
**Apply to:** `deleteText` when `checkTextInUse(id)` returns `true`.
```typescript
const isInUse = await checkTextInUse(id);
if (isInUse) {
  return fail(
    "validation",
    "Este texto não pode ser deletado pois está sendo usado em sessões de avaliação.",
  );
}
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/__tests__/admin-texts-actions.security.test.ts` (new) | test | unit | The only existing test, `src/__tests__/utils.test.ts`, is a pure-function test — there is **no existing Supabase-mocking precedent** in the repo. The mock-at-supabase-level strategy (D-11) is net-new. Planner/executor must construct the fake client builder from scratch using the chainable-record pattern described in the pattern guidance above. Treat the vitest config + setup.ts as the only conventions: jsdom env, `@` alias, globals on, `@testing-library/jest-dom/vitest` already in setup. |

## Metadata

**Analog search scope:**
- `src/app/(authenticated)/admin/texts/` (actions + 3 caller pages)
- `src/app/(authenticated)/assessment/` (canonical `ActionResult` actions + 2 caller pages)
- `src/app/(immersive)/training/rsvp/session/`
- `src/components/` (DeleteTextModal + ui primitives)
- `src/utils/auth/`, `src/utils/actions/`, `src/utils/logging/`, `src/utils/supabase/`
- `src/__tests__/`
- `vitest.config.ts`, root `package.json`

**Files scanned:** ~16 source files + 2 config + 2 test infrastructure.
**Pattern extraction date:** 2026-07-19

## PATTERN MAPPING COMPLETE