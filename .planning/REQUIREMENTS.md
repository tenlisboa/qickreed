# Requirements: Qickreed

**Defined:** 2026-07-19
**Core Value:** The average user passes the post-session comprehension quiz at ≥60% — speed without retention is inútil.

## v1 Requirements

Requirements for the initial release. Each maps to a roadmap phase. Requirements are user-centric, atomic, and testable.

### Landing

Public marketing page (QIC-24) for logged-out visitors. Authenticated users are redirected to `/dashboard` by middleware before they reach the landing, so the page only serves logged-out traffic.

- [ ] **LANDING-01**: Visitor sees a Hero section above the fold — H1 ("Pare de ler com a 'voz na cabeça'"), H2 subtitle explaining the neurocognitive trainer and the double-speed claim with ≥60% retention, a primary CTA ("Faça o Teste de Nivelamento Gratuito"), and microcopy ("Leva 2 minutos. Não requer cartão de crédito.")
- [ ] **LANDING-02**: Visitor sees 3 pain cards in a 3-column grid — "A Armadilha da Subvocalização", "O Desperdício da Regressão", "A Consequência" — each with the QIC-24 body copy
- [ ] **LANDING-03**: Visitor sees a 3-step solution section ("Reeduque sua mecânica visual em 3 passos controlados") — A Linha de Base, O Motor Taquistoscópio, Validação Cognitiva via IA — numbered or as a timeline
- [ ] **LANDING-04**: Visitor sees an audience qualification section ("O Qickreed não é para leitura de lazer. É para absorção de dados") with 3-item checklist (Profissionais de Tecnologia e Negócios, Estudantes e Acadêmicos, Pessoas com Déficit de Foco)
- [ ] **LANDING-05**: Visitor sees a final CTA section — social proof line ("Junte-se aos testadores beta que aumentaram seu PPM base em 40% nas primeiras duas semanas"), H2 ("Pronto para descobrir sua velocidade real de processamento?"), secondary CTA ("Descobrir meu PPM atual")
- [ ] **LANDING-06**: Primary CTA navigates to `/signup`; secondary CTA navigates to `/assessment` (which requires auth — middleware redirects to `/login` if logged-out, then back to `/assessment` post-auth)
- [ ] **LANDING-07**: Page is built with neobrutal-ui primitives and tokens (AD-005) — 3px black borders, hard shadows, square corners, two accents (`#FFD23F` primary CTAs/highlights, `#FF6B6B` reserved for errors only on this page), bold sans-serif, mobile-first; meets WCAG AA contrast; every interactive element has a visible `focus-brutal` state; pt-BR copy throughout

### Security

Defense-in-depth for admin Server Actions. RLS already gates writes via `is_admin()`, but Server Actions bypass layout guards — they need their own `checkAdminAccess()` call.

- [ ] **SEC-01**: All mutating admin Server Actions in `src/app/(authenticated)/admin/texts/actions.ts` (`createText`, `updateText`, `deleteText`) call `await checkAdminAccess()` as their first statement; non-admins are redirected away rather than reaching the Supabase call
- [ ] **SEC-02**: `getTexts` and `getTextById` actions return `fail("forbidden", ...)` for non-admins if admin-only reads are intended, OR are explicitly moved to a public read path with rationale recorded in `PLAN.md` — current state (readable by any authenticated user) must be a deliberate choice, not an accident

### Metrics

User-facing metrics must reflect reality, not fabricated values. Users reviewing their progress on the dashboard and feedback pages need accurate numbers to trust the trainer.

- [ ] **METRIC-01**: `submitTrainingQuiz` in `src/app/(authenticated)/training/actions.ts` returns real `duration_time_s` and `created_at` re-selected from the `training_session` row after the UPDATE — no invented `0` or `new Date().toISOString()` placeholders; the feedback page renders the actual session duration (not "0:00") and the actual session start time (not the submit time)
- [ ] **METRIC-02**: Dashboard PPM chart in `src/app/(authenticated)/dashboard/` separates `diagnostic_session.wpm` (actual measured speed) from `training_session.target_wpm` (the speed the user aimed at) — either plotted as distinct series with clear labels or moved to separate charts; no longer mixed on a shared `ppm` axis

### Code Health

Bring project instructions in sync with reality so future agents follow correct conventions.

- [ ] **CODE-01**: `AGENTS.md` reflects the installed test framework — vitest 4 + Testing Library + jsdom, `pnpm test` (`vitest`) and `pnpm test:run` (`vitest run`) scripts, `vitest.config.ts` exists, tests live in `src/__tests__/`; the "no test framework" mandate is removed; the test command gate remains `pnpm lint && pnpm build` (per AD-002) with vitest as additive coverage

## v2 Requirements

Deferred to a future release. Tracked but not in the current roadmap.

### Landing (motion)

- **LANDING-08**: Hero section animated GIF / clean mockup of the dark taquistoscópio interface with words flashing rapidly in center of screen (QIC-24 marks this as "postponed")

### Cookie handling

- **COOKIE-01**: Narrow `setAll` cookie handler in `src/utils/supabase/server.ts:15-25` to only swallow the known Server-Component "read-only cookies" case; rethrow or log genuinely broken cases (CONCERNS C-2)
- **COOKIE-02**: Add a contract test pinning the middleware-refresh + cookie-set coupling so narrowing the catch can't silently regress

### Type safety

- **TYPE-01**: Define `SupabaseNested<Text, 'text'>` helper type or explicit `TrainingSessionWithText` / `DiagnosticSessionWithText` interfaces in `src/types/database.ts`; type the queries with `supabase.from('...').select<...>()`; remove all `as unknown as { title: string } | null` and `(session.text as any)?.title` casts (CONCERNS C-3)
- **TYPE-02**: Type `checkAdminAccess` return as `Promise<{ user: User; role: UserRole }>` (importing `User` from `@supabase/supabase-js`); remove the `any` for `user`

### RSVP analytics

- **RSVP-01**: RsvpDisplay `regressionLogRef.current` plumbing decision — either wire `RegressionEvent[]` to the `onStop`/`onComplete` payload (POST to `/training/rsvp/complete` or a dedicated endpoint) and persist to `training_session` / audit log, or delete the regression log plumbing and `logRegression` callback (CONCERNS C-5). Product decision required before implementation.

### Authentication enhancements

- **AUTH-01**: OAuth (Google, GitHub)
- **AUTH-02**: Magic link login
- **AUTH-03**: 2FA

### i18n & platform

- **I18N-01**: Multi-language support beyond `pt-BR`
- **MOBI-01**: Native mobile apps (iOS/Android)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| OAuth / magic-link / 2FA | Supabase local config is email-only; not needed for pilot (see v2 AUTH-01..03) |
| Multi-language beyond `pt-BR` | Pilot audience is Portuguese-speaking (see v2 I18N-01) |
| Native mobile apps | Web-first per `MVP_SCOPE.md`; mobile-responsive only (see v2 MOBI-01) |
| Real-time chat | Not core to reading training |
| Video posts | Storage/bandwidth cost; not relevant to RSVP |
| Green success color | Explicitly banned by AD-005 — success is non-color across the app |
| App-wide dark mode | Explicitly banned by AD-006 — dark stays scoped to `.training-surface` |
| Hero GIF / interface mockup | QIC-24 spec marks as "postponed" — ship static landing first (see v2 LANDING-08) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LANDING-01 | Phase 1 | Pending |
| LANDING-02 | Phase 1 | Pending |
| LANDING-03 | Phase 1 | Pending |
| LANDING-04 | Phase 1 | Pending |
| LANDING-05 | Phase 1 | Pending |
| LANDING-06 | Phase 1 | Pending |
| LANDING-07 | Phase 1 | Pending |
| SEC-01 | Phase 2 | Pending |
| SEC-02 | Phase 2 | Pending |
| METRIC-01 | Phase 3 | Pending |
| METRIC-02 | Phase 3 | Pending |
| CODE-01 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-19*
*Last updated: 2026-07-19 after initial definition*