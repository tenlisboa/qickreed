# Assessment Timer: Invisible, Click-to-Reveal Specification

## Problem Statement

The diagnostic reading page currently shows a visible `MM:SS.t` timer face while the user reads. The MVP requires an invisible timer so the reader is not influenced by elapsed time. The start signal must be the user's click on "Começar a Ler" (revealing the text), not page load, because the text is fetched asynchronously and page-load timing would bill network/render latency against the baseline WPM. See AD-007.

## Goals

- Remove all visible timer chrome from the reading screen while keeping internal elapsed-time tracking.
- Preserve the click-to-reveal start trigger so timing begins only after the user chooses to start.
- Keep the existing data flow: reading time is passed to the quiz via `sessionStorage` and WPM is computed server-side from `text.num_words`.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Changing the quiz flow or `saveDiagnosticSession` | WPM calculation is already correct; this feature only affects the reading page UI |
| Adding pause/resume controls | Not required by the spec |
| Changing the timer component itself | The `Timer` component may be reused elsewhere; only its usage on the reading page is changed |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | --------------- | --------- | ---------- |
| The `Timer` component stays visible elsewhere if used | Keep component unchanged | Minimal change; only the reading page call site is affected | y |
| Internal elapsed time is still needed for WPM | Keep `useState` + `handleTimeUpdate` | Required by downstream quiz and server-side calculation | y |

**Open questions:** none.

## User Stories

### P1: Invisible Reading Timer

**User Story**: As a reader taking the diagnostic assessment, I want no visible timer during reading so that I am not pressured or influenced by elapsed time.

**Why P1**: A visible timer would change the user's natural reading pace, invalidating the baseline measurement.

**Acceptance Criteria**:

1. WHEN the reading page loads THEN the text body SHALL NOT be visible and the timer SHALL NOT be running.
2. WHEN the user clicks "Começar a Ler" THEN the text SHALL be revealed and the internal elapsed-time counter SHALL start in the same tick.
3. WHEN the user is reading THEN no visible timer face (MM:SS.t) or status text SHALL be displayed.
4. WHEN the user clicks "Finalizar Leitura" THEN the elapsed milliseconds SHALL be captured and passed to the quiz flow via `sessionStorage`.
5. WHEN `saveDiagnosticSession` receives the recorded time THEN WPM SHALL be computed server-side from `text.num_words` and the elapsed time.

## Edge Cases

- WHEN the user closes the reading method modal without submitting THEN the timer remains stopped and the user can re-read from the same start state.
- WHEN the page loads without a `textId` query parameter THEN the user is redirected to `/assessment`.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ATM-01 | P1: Invisible Reading Timer | Implement | ✅ Verified |
| ATM-02 | P1: Invisible Reading Timer | Implement | ✅ Verified |
| ATM-03 | P1: Invisible Reading Timer | Implement | ✅ Verified |
| ATM-04 | P1: Invisible Reading Timer | Implement | ✅ Verified |
| ATM-05 | P1: Invisible Reading Timer | Implement | ✅ Verified |

## Success Criteria

- [x] No visible timer or timer status text is rendered during reading.
- [x] The page passes `pnpm lint` and `pnpm build`.
- [x] A behavioral check confirms the button starts the reading flow and the elapsed time is still stored in `sessionStorage`.
