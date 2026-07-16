# Approval Request: Commit QICA-12 Post-RSVP Cognitive Validation

## What is being requested
Approval to stage, commit, and push the QICA-12 implementation changes currently in the working tree on branch `qica-15-training-input`.

## Why now
The QICA-19 silent-run review has re-verified the changes. `tsc --noEmit`, `lint`, and `format` all pass. The code is ready to land.

## Changes to be committed

1. **`src/app/(authenticated)/training/actions.ts`**
   - Import re-ordering and long-line formatting only; no behavioral change.

2. **`src/app/(authenticated)/training/rsvp/feedback/page.tsx`**
   - Migrated from `getTrainingSessionById`/`TrainingHistory` to `getTrainingSessionResult`/`TrainingSessionResult`.
   - Added cognitive-validation UI with distinct states for invalidated vs. validated sessions, comprehension-score banner, outcome messaging, and next-target-PPM display.

3. **`supabase/migrations/20260716020000_seed_diagnostic_and_training_texts.sql`**
   - Corrected `num_words` counts for seeded diagnostic and training texts.

4. **`src/app/(authenticated)/training/rsvp/quiz/page.tsx`** *(new file)*
   - New post-RSVP comprehension quiz page.
   - Wires `getTrainingSessionDetails` → `getTextQuizData` → `submitTrainingQuiz` → feedback page.

## Suggested commit message
```
feat(rsvp): wire post-session comprehension quiz and validation feedback
```

## Verification
- `pnpm exec tsc --noEmit` — passes with no errors.
- `pnpm lint` — passes (18 pre-existing warnings, no new warnings).
- `pnpm format` — no changes needed.

## Approval instruction
Reply with **"approve commit"** and I will immediately stage, commit, and push the changes.
