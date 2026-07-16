# Issue QICA-12: Post-RSVP Cognitive Validation (Phase 4 Wiring)

## Status: done

## Summary
Completed the missing Phase 4 wiring so an RSVP training session flows into the comprehension quiz and then into the results feedback screen.

## Gap Found
The RSVP session page (`/training/rsvp/session`) already redirected to `/training/rsvp/quiz?sessionId=...` when a quiz existed, but that route did not exist, causing a 404 after training.

## Implemented
- Created `src/app/(authenticated)/training/rsvp/quiz/page.tsx`
  - Reads `sessionId` from search params.
  - Loads session details (`getTrainingSessionDetails`) and the text's quiz (`getTextQuizData`).
  - Presents questions sequentially with `QuizQuestion`.
  - Submits answers via `submitTrainingQuiz`, which scores, updates `comprehension_score`/`passed`, and sets `profiles.benchmark_wpm`.
  - Redirects to `/training/rsvp/feedback?sessionId=...` on success.
  - Handles missing session / missing quiz errors and provides a back button.
  - Wrapped in `Suspense` for `useSearchParams` safety.

## Existing Infrastructure Already in Place
- Database migration `supabase/migrations/20260716011000_post_rsvp_cognitive_validation.sql` adds `training_session.comprehension_score`, `training_session.passed`, and `profiles.benchmark_wpm`.
- Seed migration `supabase/migrations/20260716020000_seed_diagnostic_and_training_texts.sql` provides training texts with quizzes.
- Server actions in `src/app/(authenticated)/training/actions.ts`: `submitTrainingQuiz`, `getTrainingSessionResult`, `getTrainingSessionDetails`, `getTextQuizData`.
- Feedback page `src/app/(authenticated)/training/rsvp/feedback/page.tsx` displays validation outcome and next target PPM.

## Verification
- `pnpm lint`: 0 errors (18 pre-existing warnings, none from new file).
- `pnpm tsc --noEmit`: passes with no output.
- `pnpm build`: blocked by an unrelated pre-existing environment issue — prerender of `/(auth)/login` fails with a Server Components render error (`digest: 1156204680`). This failure occurs before the new RSVP quiz route is reached and is not caused by QICA-12 changes.

## Disposition
Issue is code-complete and has passed QICA-19 review. Changes are staged in the working tree on branch `qica-15-training-input`, awaiting explicit approval to commit and push. The unrelated `/login` prerender error remains a pre-existing build blocker that should be addressed in a separate heartbeat.
