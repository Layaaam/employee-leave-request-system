# Employee Leave Request System

A web-based leave request system built for a software developer practical exam. Employees can submit and track their own leave requests; administrators/approvers can review, approve, or reject requests and manage leave types.

**Stack:** Next.js (TypeScript, App Router, Tailwind CSS) · Supabase (Postgres, Auth, Row Level Security) · Vercel

---

## Status

Currently in active development. See [`Leave_Request_System_Plan.md`](./LEAVE_REQUEST_SYSTEM_PLAN.md) for the full implementation plan and phase-by-phase checklist.

- [x] **Phase 0 — Project Setup**
- [ ] Phase 1 — Database Foundation
- [ ] Phase 2 — Seed Data
- [ ] Phase 3 — Core Application (Employee)
- [ ] Phase 4 — Core Application (Admin)
- [ ] Phase 5 — Reliability & Ops Hooks
- [ ] Phase 6 — Testing
- [ ] Phase 7 — Deployment
- [ ] Phase 8 — Submission

---

## Tech Stack & Architecture

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS |
| Auth | Supabase Auth (stateless JWT) |
| Database | Supabase Postgres |
| Access control | Row Level Security (RLS) policies at the database layer |
| Hosting | Vercel (free tier) |

Role-based access control is enforced primarily through Postgres RLS policies, not just in application code — employees can only read/write their own leave requests, and only administrators can manage leave types or approve/reject requests. Two server-only API routes (`/api/leave-requests/:id/approve` and `/reject`) handle the sensitive status-change actions using a service-role key that never reaches the browser.

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) account/project

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   npm install
   ```

2. Copy the environment variable template and fill in your Supabase project's keys (**Project Settings → API**):
   ```bash
   cp .env.local.example .env.local
   ```
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
   > `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to the client. It's used exclusively by the approve/reject API routes.

3. Run the development server:
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
  api/health/         # Health check endpoint (used by keep-alive cron)
  layout.tsx
  page.tsx
lib/
  supabase/
    client.ts          # Browser client — anon key, RLS-enforced
    server.ts           # Server Component/Action client — anon key, RLS-enforced
    service.ts          # Service-role client — server-only, bypasses RLS
.env.local.example
Leave_Request_System_Plan.md   # Full plan, data model, and checklist
```

---

## Deployment

Deployed on Vercel's free tier. Environment variables must be set in the Vercel project dashboard (same three keys as `.env.local`). A scheduled GitHub Actions workflow pings `/api/health` periodically to prevent the Supabase free-tier project from auto-pausing after 7 days of inactivity.

---

## License

Built for evaluation purposes as part of a software developer practical exam.