# Issue QICA-15: User-facing training input (paste box → LLM → enable Start Training)

## Status: done

## Summary
Reviewed the QICA-15 implementation and removed the code-level blocker that was preventing the "Start Training" flow from completing.

## What was already built
- `src/app/(authenticated)/dashboard/TrainingInputCard.tsx` — paste box, validation, and CTA to process text.
- `src/app/(authenticated)/dashboard/actions.ts::prepareTrainingText` — validates pasted text, calls the LLM quiz generator, and inserts a user-owned `TRAINING` text.
- `src/lib/llm/quiz-schema.ts` — LLM prompt, JSON extraction, schema validation, and retry logic.
- `supabase/migrations/20260716005000_user_training_text_input.sql` — `text.user_id` column and RLS policies so users can insert their own training texts.

## Blocker found
`src/app/(authenticated)/training/actions.ts::createTrainingSession` inserted a `training_session` row **without `user_id`**. The table requires `user_id UUID NOT NULL` and the RLS INSERT policy checks `auth.uid() = user_id`, so clicking **Iniciar Treinamento** after pasting text would fail at session creation.

## Fix applied
Updated `createTrainingSession` to fetch the authenticated user and include `user_id` in the insert:

```ts
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) { ... }

await supabase.from("training_session").insert({
  user_id: user.id,
  text_id: textId,
  training_type: trainingType,
  target_wpm: targetWpm,
  duration_time_s: durationSeconds,
});
```

## Verification
- `pnpm exec tsc --noEmit` — passed (no output).
- `pnpm lint` — only pre-existing warnings; no new issues introduced.
- `pnpm test:run` — 10/10 tests passed.
- Searched the codebase: `createTrainingSession` is the only place that inserts into `training_session`.

## Next steps
- Run a local E2E smoke test (paste text → process → start RSVP session → complete quiz) once the Supabase migration and LLM endpoint are available.
- No further code changes required for QICA-15.

---
*Reviewed: 2026-07-16*
