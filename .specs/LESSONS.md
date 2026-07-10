# Lessons — Self-Improving Layer (no-script fallback)

> **Degraded path**: the canonical `scripts/lessons.py` does not exist in this repo,
> so lessons are maintained by hand per `lessons.md` fallback. Accounting is
> best-effort; promote candidate → confirmed only after the same lesson recurs in
> 2 distinct features. Never hand-edit `lessons.json` (not maintained here).

| ID | Status | Scope | Lesson | Source (feature / file:line / AC) |
| -- | ------ | ----- | ------- | ---------------------------------- |
| L-001 | candidate | middleware/logging | To propagate a header from Next.js middleware to downstream server code, set it on the request forwarded via `NextResponse.next({ request })` (e.g. `request.headers.set(...)`), not on the response — `headers()` reads the request, not the response. | error-logging / `src/middleware.ts:7` / EL-03 |
| L-002 | candidate | logging | Pino `redact` wildcards like `*.password` match only nested paths; list the un-wildcarded root path (`password`) too when a field must be redacted at the top level of a log object. | error-logging / `src/utils/logging/logger.ts:10-16` / EL-04 |