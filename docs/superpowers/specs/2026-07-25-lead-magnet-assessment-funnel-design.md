# Lead-Magnet Assessment Funnel — Design

Date: 2026-07-25
Status: Approved (brainstorm)
Scope: Anonymous email-gated assessment funnel that captures leads, shows results with a persuasive CTA, and drives to a fake Stripe checkout. Account creation is deferred to post-CTA; the lead's anonymous diagnostic is claimed as the user's baseline on signup.

## Decisions (locked during brainstorm)

| # | Decision |
| - | -------- |
| D1 | The lead's anonymous diagnostic **carries over as the user's baseline** when they register with the same email. They skip retaking it and training unlocks immediately. |
| D2 | **Both homepage CTAs** ("Faça o Teste de Nivelamento Gratuito" and "Descobrir meu PPM atual") route to the new email-only flow. `/signup` and `/login` stay reachable but are no longer the primary path. |
| D3 | **Full LGPD consent log**: unchecked opt-in checkbox + pt-BR consent text + privacy-policy link + a `consent_log` table recording timestamp, IP, form version, exact wording. |
| D4 | **Capture on submit + status flag**: the `leads` row is created when the email is submitted (`status = 'started'`), flipped to `'completed'` when the diagnostic finishes. Partial assessments are retained for marketing segmentation. |
| D5 | **Architecture A — parallel public flow**: a new non-auth-gated route group `/free-assessment/*` with parallel server actions writing to `leads` + `lead_diagnostic_session`. A signed cookie carries `lead_id`. The `on_auth_user_created` trigger migrates the lead diagnostic into `diagnostic_session` on signup. Reading/quiz UI components are reused; only persistence forks. |
| D6 | **Route segments in English, on-screen copy in pt-BR.** |

## Routes & architecture

New public route group, no auth gate, no Sidebar (mirrors the existing `(immersive)` group):

```
src/app/(public-assessment)/free-assessment/
├── layout.tsx              # bare min-h-screen wrapper
├── page.tsx                # email gate (consent checkbox) — pt-BR copy
├── actions.ts              # createLead(), saveLeadDiagnostic(), getLeadResult()
├── start/route.ts          # POST: pick diagnostic text, redirect to reading
├── reading/page.tsx        # reuse reading UI; onComplete → quiz
├── quiz/page.tsx           # reuse QuizQuestion; onSubmit → results
├── results/page.tsx        # results + improvement CTA → checkout
└── checkout/page.tsx       # fake Stripe screen (stub)
```

Existing `(authenticated)/assessment/*` is untouched and remains the path for logged-in users.

**Identity carry.** On email submit, `createLead()` inserts the `leads` row, sets a signed HTTP-only cookie `lead_id` (7-day expiry, HMAC-signed in `src/utils/lead/cookie.ts`). Reading and quiz pages read it server-side to persist results against `lead_id`. No PII in the URL, no localStorage.

**Signup claim.** The existing `on_auth_user_created` trigger function is extended: after the `profiles` insert, normalize `new.email` and look up `leads` by `email_normalized`; if found and `status <> 'registered'`, copy all `lead_diagnostic_session` rows into `diagnostic_session` with `user_id = new.id` (idempotent via `ON CONFLICT DO NOTHING`), call `set_user_level` to Level 1, then set `leads.status = 'registered'`, `claimed_by = new.id`. Baseline is established, `checkUserHasAssessment()` passes, training unlocks. No retake.

**Reuse vs fork.** `RsvpDisplay`, `Timer`, `QuizQuestion`, `Button`, `Card` are reused as-is. `getRandomDiagnosticText()` is reused directly. Only the persistence Server Actions fork: they write to `lead_diagnostic_session` via a SECURITY DEFINER RPC and read `lead_id` from the cookie instead of `auth.getUser()`.

## Data model

Two new tables, one consent table, plus a migration. All under RLS. TS mirrors added to `src/types/database.ts` (`Lead`, `LeadDiagnosticSession`, `ConsentLog`, `LeadStatus`).

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text generated always as (lower(trim(email))) stored unique,
  status text not null default 'started',   -- started | completed | registered
  utm_source text, utm_medium text, utm_campaign text,
  claimed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lead_diagnostic_session (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  text_id uuid not null references text(id) on delete cascade,
  reading_time_ms integer not null,
  comprehension_score numeric(5,2) not null,
  wpm numeric(8,2) not null,
  reading_method text,
  created_at timestamptz not null default now()
);

create table consent_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  consent_text text not null,        -- exact wording shown
  form_version text not null,        -- e.g. 'email-gate-v1'
  ip inet,
  user_agent text,
  consent_at timestamptz not null default now()
);
```

**RLS.**
- `leads`: insert public (anon role) so the email gate can create a row without auth; select/update/delete service-role only. Marketing/admin reads happen through Server Actions, never the client.
- `lead_diagnostic_session`: no direct anon insert policy. Writes go through a SECURITY DEFINER function `save_lead_diagnostic(p_lead_id uuid, p_text_id uuid, p_reading_time_ms int, p_comprehension_score numeric, p_reading_method text)` that verifies the lead exists and is in `started`/`completed` status, computes WPM server-side from `text.num_words`, inserts the row, and flips `leads.status` to `'completed'`. Mirrors the existing `is_admin()` / `set_user_level()` SECURITY DEFINER pattern.
- `consent_log`: anon insert only (the email gate writes its own row); select admin-only.

**Signup migration (extends `on_auth_user_created`):**

```sql
insert into diagnostic_session (user_id, text_id, reading_time_ms, comprehension_score, wpm, reading_method)
  select new.id, lds.text_id, lds.reading_time_ms, lds.comprehension_score, lds.wpm, lds.reading_method
  from lead_diagnostic_session lds
  join leads l on l.id = lds.lead_id
  where l.email_normalized = lower(trim(new.email))
  on conflict do nothing;
update leads set status = 'registered', claimed_by = new.id, updated_at = now()
  where email_normalized = lower(trim(new.email)) and status <> 'registered';
```

## Flow & UI

**Step 1 — Email gate** (`/free-assessment`). Neobrutalist Card, light page, no Sidebar. One `<input type="email" required>` with `<Label htmlFor>`, an unchecked `<input type="checkbox" required>` with pt-BR consent text ("Concordo em receber meu resultado e materiais sobre leitura acelerada — veja a Política de Privacidade"), a privacy-policy link, a honeypot field (hidden, `aria-hidden`), and a primary `Button` "Começar Avaliação".

`createLead(formData)`:
1. Honeypot check → silently "succeed" (redirect to reading) without inserting, to blind bots.
2. Validate email server-side; normalize for lookup.
3. Insert `leads` (status `started`, UTM from query params if present) `on conflict (email_normalized) do nothing`; select the row back so revisits reuse the existing lead.
4. Insert `consent_log` with the exact consent string, form version, IP (`x-forwarded-for`), user-agent.
5. Set signed `lead_id` cookie, `redirect` to `/free-assessment/start` (POST) → picks diagnostic text → redirect to `/free-assessment/reading?textId=…`.

**Steps 2-3 — Reading & quiz.** Reuse the existing reading UI and `QuizQuestion` verbatim. On quiz submit, call `saveLeadDiagnostic(...)` (the SECURITY DEFINER RPC) instead of `saveDiagnosticSession`. WPM is computed server-side from `text.num_words` (same formula as the authenticated flow). Then `redirect` to `/free-assessment/results`.

**Step 4 — Results + CTA** (`/free-assessment/results`). Reuse the existing results layout (WPM level card, comprehension score, reader category) and append a CTA block:
- Headline: "Seu cérebro pode processar muito mais do que isso."
- Projection from the user's actual WPM: "Com a metodologia QickReed, leitores aumentam em média 40% o PPM no primeiro mês — você passaria de {wpm} para ~{round(wpm * 1.4)} PPM." Worded as an average, not a guarantee.
- Primary CTA `Button` "Quero melhorar minha leitura" → `/free-assessment/checkout`.
- Secondary link "Criar conta gratuita e treinar agora" → `/signup` (the claim trigger backfills the baseline on signup).

**Step 5 — Fake Stripe** (`/free-assessment/checkout`). Pricing-card layout: plan name, price, feature list, a primary `Button` "Assinar agora" that is non-functional (disabled or a no-op toast "Pagamentos em breve"). The route, `createCheckoutSession()` Server Action signature, and `/api/stripe/webhook` route are stubbed now so going live later only swaps the action body for `stripe.checkout.sessions.create`. Per research: `customer_email: lead.email`, `success_url`/`cancel_url` wired to placeholder routes. No Stripe keys required yet.

## Error handling, edge cases, verification

**Errors.** All Server Actions return `ActionResult<T>` (AD-001), pt-BR messages (AD-004), Pino logs (AD-003). Email-gate failures show an inline pt-BR Alert (reuse the login pattern). If the `lead_id` cookie is missing/expired/tampered at quiz submit, fail with pt-BR "Sua sessão expirou, recomece o teste" and redirect to the gate. If no diagnostic text is seeded, redirect to `/error` (matches existing `startAssessment` behavior).

**Edge cases.** Cookie tampering (HMAC verify → treat as missing); lead revisits the email gate (idempotent upsert, reuse existing row); lead registers before finishing (only `completed` diagnostics migrate; partial rows remain marketing-only); existing user hits the public flow (allowed; nudged toward login via the secondary CTA — detecting this is out of scope for MVP).

**Verification (AD-002 — no test runner).** Gate: `pnpm lint && pnpm build`. Behavioral: drive the flow end-to-end with `pnpm dev` — submit email, take the assessment, confirm `leads` + `lead_diagnostic_session` + `consent_log` rows exist with correct status transitions, confirm the results CTA renders with the projected WPM, confirm the checkout stub renders. Then sign up with the same email and confirm `diagnostic_session` was backfilled, `leads.status = 'registered'`, and `/training` is unlocked without a retake. Honeypot: submit with the hidden field filled, confirm no row is inserted.

## Out of scope

Real Stripe integration; double opt-in email; unsubscribe pipeline; admin lead-management UI; UTM persistence beyond capture; detecting logged-in users in the public flow; A/B testing the CTA copy.