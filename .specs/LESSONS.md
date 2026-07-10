# LESSONS — auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation — do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 — When a spec lists every variant of a component as requiring the same visual treatment (border + shadow + hover/active physics), verify each variant individually — a shared base class for the border is not enough; per-variant shadow and interaction physics must be asserted per variant.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `ui-components` · harmful: 0
- features: neobrutalism-migration
- evidence: NEO-04 / src/components/ui/button.tsx:38-39 (ui-components)
- last seen: 2026-07-10T04:20:49Z

## Quarantined (failed when applied — ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
