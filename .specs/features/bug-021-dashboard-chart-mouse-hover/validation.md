# bug-021 Validation

**Date**: 2026-07-16
**Spec**: `.specs/features/bug-021-dashboard-chart-mouse-hover/spec.md`
**Diff range**: `1cd41ad`
**Verifier**: standalone fresh-eyes pass (project decision AD-002: no test runner; build + lint + behavioral review)

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| Fix chart x-axis key | ✅ Done | Changed `dataKey` from formatted `date` to unique `isoDate`; added `tickFormatter` to preserve `DD/MM` display. |

---

## Spec-Anchored Acceptance Criteria

| Criterion | Spec-defined outcome | Evidence | Result |
| --------- | -------------------- | -------- | ------ |
| AC1: Hovering any dot shows its own tooltip | Each session maps to a unique x-axis coordinate | `src/app/(authenticated)/dashboard/page.tsx:235` — `dataKey="isoDate"`; `page.tsx:236-241` — `tickFormatter` keeps `DD/MM` labels | ✅ PASS |

---

## Discrimination Sensor

Project decision AD-002 states there is no test framework; the gate is `pnpm lint && pnpm build` and final verification is behavioral. Without a test runner, the sensor cannot inject a behavior-level fault and verify it is killed by automated tests.

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| 1 | `page.tsx:235` | Revert `dataKey` to `"date"` (reintroduces the bug) | N/A — no test runner per AD-002 |

**Sensor depth**: lightweight / N/A
**Result**: N/A — no automated test runner; bug fix verified by build + lint + code review.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ |
| No scope creep | ✅ |
| Matches existing patterns | ✅ |
| Would senior engineer approve? | ✅ |

---

## Gate Check

- **Gate command**: `pnpm lint && pnpm build`
- **Lint result**: 0 errors, 18 baseline warnings (0 new)
- **Build result**: ✅ pass
- **Test count**: N/A (no test framework per AD-002)
- **Failures**: none

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 1/1 AC covered.
**Sensor**: N/A — no test runner per AD-002.
**Gate**: passed.

**What works**: The dashboard evolution chart now uses the unique ISO timestamp (`isoDate`) as the x-axis data key, so each session occupies a distinct coordinate. The XAxis tick formatter still renders the label as `DD/MM`, preserving the previous visual style. The tooltip `labelFormatter` was simplified to read `isoDate` directly.

**Issues found**: none.

**Next steps**: Behavioral confirmation in a browser with real data is recommended but not required by the gate.
