# Enforce Baseline Diagnostic Before Training Access Specification

## Problem Statement

MVP_SCOPE.md §2 Phase 1 requires every new user to complete a baseline diagnostic measurement before accessing the training engine. Currently, authenticated users can navigate directly to `/training` and `/training/rsvp` and start a session even if they have no `diagnostic_session` record.

## Goals

- Block authenticated users without a diagnostic session from entering any training route.
- Redirect such users to `/assessment` so they complete the baseline first.
- Allow users with at least one diagnostic session to reach training routes normally.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Changing the unauthenticated flow | Middleware already handles auth redirects; this only applies to authenticated users |
| Adding UI messages on the assessment page | The redirect itself is the affordance; no new assessment page copy needed |
| Centralizing the check in middleware or layout | Optional improvement; per-page check is sufficient for MVP |
| Blocking the training session endpoint | The preparation pages are the gate; direct API/session access is already protected by RLS |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | --------------- | --------- | ---------- |
| Gate happens in the two training Server Components (`/training`, `/training/rsvp`) | Add `checkUserHasAssessment()` + `redirect()` | Existing helper is already available; minimal change | y |
| A single diagnostic session is sufficient | Reuse `checkUserHasAssessment()` | Matches the helper's semantics | y |

**Open questions:** none.

## User Stories

### P1: Baseline Gate Before Training

**User Story**: As a new authenticated user, I want to be redirected to the assessment before I can start training so that my baseline reading speed is established first.

**Why P1**: Training speeds depend on the diagnostic baseline; training without it produces invalid targets and a poor user experience.

**Acceptance Criteria**:

1. WHEN an authenticated user with no `diagnostic_session` navigates to `/training` THEN the system SHALL redirect them to `/assessment`.
2. WHEN an authenticated user with no `diagnostic_session` navigates to `/training/rsvp` THEN the system SHALL redirect them to `/assessment`.
3. WHEN an authenticated user with at least one `diagnostic_session` navigates to `/training` or `/training/rsvp` THEN the page SHALL render normally.

## Edge Cases

- WHEN the database check fails (error, not merely empty) THEN the system SHALL treat the user as having no assessment and redirect to `/assessment` to avoid exposing training without a known baseline.
- WHEN an unauthenticated user reaches these routes THEN existing middleware/auth redirects SHALL continue to apply before the baseline check is reached.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| EBT-01 | P1: Baseline Gate Before Training | Implement | ✅ Verified |
| EBT-02 | P1: Baseline Gate Before Training | Implement | ✅ Verified |
| EBT-03 | P1: Baseline Gate Before Training | Implement | ✅ Verified |

## Success Criteria

- [x] A user without a diagnostic session is redirected to `/assessment` from `/training`.
- [x] A user without a diagnostic session is redirected to `/assessment` from `/training/rsvp`.
- [x] A user with a diagnostic session can still reach both training routes.
- [x] The page passes `pnpm lint` and `pnpm build`.
