# Employee Leave Request System — Implementation Plan & Checklist

**Stack:** Next.js (React) on Vercel + Supabase (Postgres, Auth, RLS)
**Cost:** $0, no card required end-to-end

---

## 1. Stack Decision

| Layer | Choice | Reason |
|---|---|---|
| Frontend + light backend | Next.js on Vercel (Hobby) | Same-origin API routes, no CORS, free CDN, fast static delivery |
| Auth | Supabase Auth | Free, stateless JWTs, built-in login/logout |
| Database | Supabase Postgres | Relational fit, PostgREST auto-API, Row Level Security for RBAC |
| Hosting | Vercel `*.vercel.app` | Permanent public URL, no local install needed |

**Alternatives considered and rejected:**
- Render free tier — free Postgres **expires after ~30 days**; web service **sleeps after 15 min** idle (30–60s cold start). Too risky for an unknown-length eval window.
- Railway / Fly.io — free tiers rely on trial credit or a card on file; risk of silent charges.
- Firebase (Firestore) — free and reliable, but NoSQL makes relational joins (request → employee → leave type) and admin filtering clunkier.

**Known free-tier limitations to watch:**
- Supabase project **auto-pauses after ~7 days of zero API activity** → mitigate with a scheduled keep-alive ping (see Deployment step 10).
- Supabase caps: 500MB DB storage, 5GB bandwidth/mo, 50k MAUs — not a concern at exam scale.
- Vercel Hobby: 100GB bandwidth/mo, serverless functions capped at 10s execution.
- Minor serverless cold start (sub-second to ~1–2s) on first hit after idle — much smaller than Render's dyno sleep.

---

## 1a. Domain Research Note: Philippine Labor Law on Employee Leave

*(Considered during design; kept out of scope for the exam build — worth mentioning in the implementation summary.)*

Philippine labor law (Labor Code, PD 442) sets a legal floor of mandatory leave benefits; a company leave system like this one models the policy layer that sits on top of that floor. Key points relevant to leave-type design:

- **Service Incentive Leave (SIL)** — 5 days/year paid, after 1 year of service. The statutory minimum most companies use as their general vacation/sick baseline.
- **Maternity Leave** — 105 days paid (120 for solo mothers, 60 for miscarriage/emergency termination); requires 60-day advance notice.
- **Paternity Leave** — 7 days paid, for married fathers, first four deliveries; must be claimed within a 60-day window, capped at 3 claims.
- **Solo Parent Leave** — 7 days/year paid; requires a DSWD-issued Solo Parent ID before it can be claimed.
- **Special Leave for Women / VAWC Leave** — statutory but conditional on medical or legal certification.
- **Bereavement/Emergency Leave** — not legally mandated; purely a matter of company policy if offered at all.

**Approval pattern varies by leave type:**
- Planned, advance-notice leave (SIL/vacation, maternity) fits this system's `pending → approved/rejected` flow directly.
- Urgent leave (sick, VAWC) is often taken first and documented after the fact — the request can still be filed as `pending`, with supporting documents referenced via the `reason` field or a future `attachment` field.
- Some statutory leaves (solo parent, VAWC) depend on external government-issued certification that exists independently of the internal approval workflow.

**Design decision:** the current schema (`leave_types` with `name`, `description`, `default_days_allowed`) is intentionally kept simple for this exam's scope. Fields such as `requires_documentation` or `notice_period_days` would more accurately reflect real HR practice, but are treated as a future extension rather than a Phase 1 requirement, to avoid over-engineering beyond the stated exam scope.

---

## 2. Data Model

**`profiles`**
- `id` (uuid, PK, FK → `auth.users.id`)
- `full_name`
- `role` (enum: `employee`, `admin`)
- `department` (nullable)
- `created_at`

**`leave_types`**
- `id` (uuid, PK)
- `name` (unique)
- `description`
- `default_days_allowed` (int, nullable)
- `is_active` (bool)
- `created_at`, `updated_at`

**`leave_requests`**
- `id` (uuid, PK)
- `employee_id` (FK → `profiles.id`)
- `leave_type_id` (FK → `leave_types.id`)
- `start_date`, `end_date`
- `days_requested` (int)
- `reason` (text)
- `status` (enum: `pending`, `approved`, `rejected`, `cancelled`)
- `reviewed_by` (FK → `profiles.id`, nullable)
- `reviewed_at` (nullable)
- `review_comment` (nullable)
- `created_at`, `updated_at`

**Indexes:** `leave_requests(employee_id)`, `leave_requests(status)`, composite `(employee_id, status)`, composite `(status, created_at)`. Unique index on `leave_types(name)`.

**Assumption to state in the write-up:** employees may edit/delete a request only while `status = pending`; once reviewed, it's locked.

---

## 3. API Structure & RBAC

Most CRUD goes through Supabase's auto-generated PostgREST API, secured by **Row Level Security** — the real enforcement layer, not app code.

- `leave_types` — SELECT: any authenticated user. INSERT/UPDATE/DELETE: `role = admin` only.
- `leave_requests` — SELECT/INSERT: employees see/create only their own rows; admins see all. UPDATE/DELETE by employee: own rows, `status = pending` only. UPDATE by admin: any row.
- Filtering/pagination via query params: `?status=eq.pending&leave_type_id=eq.<id>&order=created_at.desc&limit=20&offset=0`, plus `ilike.` for text search on `reason`.
- Joins in one call to avoid N+1: `select=*,leave_type:leave_types(name),employee:profiles(full_name)`.

**Two trusted server-side Next.js API routes** (bypass client-side trust for the sensitive action):
- `POST /api/leave-requests/:id/approve`
- `POST /api/leave-requests/:id/reject`

Each route verifies the caller's JWT, re-checks `role = admin` server-side, then updates the row using the service-role key (server-only secret, never sent to the browser).

---

## 4. Deployment Plan

1. Scaffold a Next.js (TypeScript) app; push to a GitHub repo.
2. Create a free Supabase project; collect project URL, anon key, service_role key.
3. Run SQL migrations: create tables/enums, indexes, RLS policies, and a trigger that auto-creates a `profiles` row (`role = employee` default) on signup.
4. Seed data: leave types (Vacation, Sick, Emergency, Unpaid) + two handover accounts (one employee, one admin — set the admin's `role` manually via SQL).
5. Build pages: `/login`, `/dashboard` (employee CRUD + status view), `/admin` (all requests + filters + approve/reject, leave-type CRUD).
6. Set env vars locally: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-safe), `SUPABASE_SERVICE_ROLE_KEY` (server-only).
7. Test both roles locally; confirm RLS blocks cross-user/cross-role access.
8. Import repo into Vercel; set the same env vars; deploy → get `yourproject.vercel.app`.
9. Smoke-test both accounts on the live URL.
10. Add a keep-alive: GitHub Actions scheduled workflow (every 2–3 days) hitting a lightweight `/api/health` route (`select 1`) to prevent Supabase's 7-day inactivity pause.

---

## 5. Scalability & Performance Decisions

- Stateless auth (JWT) — no server-side session store, scales horizontally.
- Pagination/filtering at the query level (never fetch-all-then-filter client-side).
- Indexes on all frequently filtered/sorted columns.
- No N+1 queries — use PostgREST relational embedding.
- Cache the rarely-changing `leave_types` list client-side (e.g., short `staleTime` with React Query).
- Minimize custom serverless functions to reduce cold-start surface; let RLS handle most access control instead of routing everything through custom API routes.
- RBAC enforced at the database layer (RLS), not just in frontend route guards.

---

## 6. Risks & Mitigations for a Long/Unknown Eval Window

| Risk | Mitigation |
|---|---|
| Supabase pauses after 7 days idle | GitHub Actions cron hitting a health endpoint every 2–3 days |
| Vercel cold start on first hit | Keep custom functions minimal; most traffic hits static pages or direct Supabase calls |
| Free-tier fair-use limits | Non-issue at single-evaluator exam scale |
| Losing repo/DB access | Keep GitHub repo and Supabase project under one stable account, untouched during the eval window |

---

## 7. Implementation Summary — What to Include

- **Approach:** Next.js on Vercel + Supabase, chosen for a free, no-card, no-expiry stack that stays relational and stateless.
- **Features completed:** role-based login/logout; employee CRUD on own requests; admin CRUD on leave types; approve/reject workflow; status visibility; filtering/search; pagination.
- **Notable decisions/assumptions:** RLS as primary RBAC layer; requests lock once reviewed; two seeded accounts for handover.
- **Challenges + resolutions:** e.g., debugging RLS policies; avoiding serverless DB connection exhaustion (use Supabase's pooled endpoint or PostgREST); preventing Supabase auto-pause.
- **Verification:** manual test matrix across both roles, confirmed cross-role access denials, tested filters/pagination, smoke-tested the live deployed URL end-to-end.

---

## Build Checklist — By Phase

> **Workflow note:** After completing each phase below, update the checkboxes in this file **and** the status list in `README.md` before committing. Keeping both in sync prevents them from drifting apart as the project grows — the README is the first thing an evaluator sees, and it should always reflect the same progress as this checklist.

### Phase 0 — Project Setup
- [x] Create GitHub repo
- [x] Scaffold Next.js (TypeScript) app
- [x] Create Supabase project
- [x] Record `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Phase 1 — Database Foundation
- [x] Create `profiles` table + `role` enum
- [x] Create `leave_types` table
- [x] Create `leave_requests` table + `status` enum
- [x] Add indexes (see §2)
- [x] Write RLS policies for `leave_types` and `leave_requests`
- [x] Add signup trigger to auto-create `profiles` row

### Phase 2 — Seed Data
- [x] Seed leave types (Service Incentive, Sick, Vacation, Maternity, Paternity, Solo Parent, Emergency/Bereavement, Unpaid — see §1a)
- [x] Create employee handover account
- [x] Create admin handover account (manually set `role = admin`)

### Phase 3 — Core Application (Employee)
- [x] Build `/login` page (login/logout)
- [x] Build employee dashboard: create/view/update/delete own requests
- [x] Build status/detail view for leave requests
- [x] Build search/filter UI (by status, leave type, date, text)

### Phase 4 — Core Application (Admin)
- [x] Build admin view: all requests, approve/reject
- [x] Build admin leave-type CRUD UI
- [x] Implement `POST /api/leave-requests/:id/approve`
- [x] Implement `POST /api/leave-requests/:id/reject`

### Phase 5 — Reliability & Ops Hooks
- [x] Add `/api/health` endpoint for keep-alive
- [x] Set up GitHub Actions keep-alive cron (runs after deployment is live)
  - *Note: workflow created and confirmed locally; setting the `HEALTH_CHECK_URL` repo variable and running it live happens in Phase 7 once the app is deployed.*

### Phase 6 — Testing
- [ ] Test employee flow end-to-end
- [ ] Test admin flow end-to-end
- [ ] Confirm RLS blocks cross-user access (employee A cannot see/edit employee B's requests)
- [ ] Confirm RLS blocks non-admin from leave-type CRUD
- [ ] Test filters/search/pagination
- [ ] Confirm locked editing after request is reviewed

### Phase 7 — Deployment
- [ ] Import repo into Vercel
- [ ] Set env vars in Vercel dashboard
- [ ] Deploy and verify live URL loads
- [ ] Smoke-test both accounts on the live URL

### Phase 8 — Submission
- [ ] Deployed system link
- [ ] Employee account credentials
- [ ] Admin account credentials
- [ ] 3–5 paragraph implementation summary (see §7)
- [ ] Brief usage notes for the evaluator
- [ ] Confirm repo/DB access will remain stable through the eval window