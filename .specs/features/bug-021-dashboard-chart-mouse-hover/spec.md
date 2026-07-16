# bug-021: Dashboard chart tooltip hover

**Source**: `.board/bug-021-dashboard-chart-mouse-hover.md`

## Problem

When hovering the mouse over the dots on the dashboard evolution chart, the tooltip always shows the same dot regardless of which dot is being hovered.

## Root cause hypothesis

The chart's XAxis was keyed on a formatted `date` string (`DD/MM`). When multiple diagnostic/training sessions occurred on the same calendar day, they collapsed to the same x-coordinate, causing Recharts to group them and display a single tooltip for the overlapping dots.

## Acceptance Criteria

- **AC1**: Each timeline session maps to a distinct chart x-coordinate so that hovering over different dots displays the tooltip for the specific data point under the cursor.
