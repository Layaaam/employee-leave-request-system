# Employee Leave Request System
## Implementation Plan and Project Checklist

**Prepared for:** Software Developer Practical Examination
**Technology Stack:** Next.js (TypeScript) on Vercel; Supabase (PostgreSQL, Authentication, Row Level Security)
**Estimated Cost:** $0.00 (free-tier services only; no payment method required)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack Selection](#2-technology-stack-selection)
3. [Data Model](#3-data-model)
4. [System Architecture and Access Control](#4-system-architecture-and-access-control)
5. [Deployment Plan](#5-deployment-plan)
6. [Scalability and Performance Considerations](#6-scalability-and-performance-considerations)
7. [Risk Assessment and Mitigation](#7-risk-assessment-and-mitigation)
8. [Implementation Summary Guidance](#8-implementation-summary-guidance)
9. [Project Checklist](#9-project-checklist)

---

## 1. Executive Summary

This document outlines the design, architecture, and delivery plan for a web-based Employee Leave Request System developed as part of a software developer practical examination. The system supports two user roles — Employee and Administrator/Approver — and provides core leave-management functionality including request submission, review, approval, rejection, and leave-type administration.

The solution is built entirely on free-tier infrastructure and is designed with production-oriented practices — stateless authentication, database-enforced access control, indexed queries, and cache-aware data fetching — so that the architecture would extend to a larger user base without requiring a redesign.

---

## 2. Technology Stack Selection

### 2.1 Selected Stack

| Layer | Selection | Justification |
|---|---|---|
| Frontend and application layer | Next.js (React), hosted on Vercel (Hobby tier) | Combines a static, CDN-delivered frontend with serverless API routes under a single origin, eliminating cross-origin overhead and minimizing network round trips. |
| Authentication | Supabase Auth | Provides free, standards-based JWT authentication with no session-store dependency, supporting stateless horizontal scaling. |
| Database | Supabase PostgreSQL | A relational engine is appropriate given the interdependencies between employees, leave requests, and leave types. Supabase additionally provides an auto-generated REST interface (PostgREST) with native filtering, pagination, and relational embedding. |
| Access control enforcement | PostgreSQL Row Level Security (RLS) | Enforces role-based permissions at the database layer, independent of any single application instance. |
| Hosting | Vercel | Provides a permanent public URL suitable for evaluator access without local installation. |

### 2.2 Alternatives Considered

| Alternative | Reason for Rejection |
|---|---|
| Render (free web service and free PostgreSQL) | The free-tier database instance expires after approximately 30 days, and the web service suspends after 15 minutes of inactivity, introducing an unacceptable risk of service unavailability during an evaluation period of indeterminate length. |
| Railway or Fly.io | Free-tier access is typically contingent on trial credit or a registered payment method, introducing risk of unintended charges. |
| Firebase (Firestore and Authentication) | A reliable and genuinely free option; however, its non-relational data model introduces additional complexity for the relational joins and filtered queries required by this system's data model. |

### 2.3 Known Platform Limitations

- The Supabase free-tier project is automatically paused after approximately seven days without API activity. This is mitigated through a scheduled keep-alive mechanism (see Section 5, Step 10).
- Supabase free-tier limits: 500 MB database storage, 5 GB monthly bandwidth, and 50,000 monthly active authentication users. These limits substantially exceed the requirements of this system.
- Vercel Hobby-tier limits: 100 GB monthly bandwidth and a 10-second maximum execution time per serverless function.
- Serverless functions may incur a brief cold-start delay (typically under two seconds) following a period of inactivity. This is materially less disruptive than the dyno-sleep behavior observed on comparable free-tier platforms.

---

## 3. Data Model

### 3.1 Entities

**`profiles`**

| Column | Type | Description |
|---|---|---|
| `id` | uuid, primary key | References `auth.users.id` |
| `full_name` | text | |
| `role` | enum (`employee`, `admin`) | |
| `department` | text, nullable | |
| `created_at` | timestamp | |

**`leave_types`**

| Column | Type | Description |
|---|---|---|
| `id` | uuid, primary key | |
| `name` | text, unique | |
| `description` | text | |
| `default_days_allowed` | integer, nullable | |
| `is_active` | boolean | |
| `created_at` / `updated_at` | timestamp | |

**`leave_requests`**

| Column | Type | Description |
|---|---|---|
| `id` | uuid, primary key | |
| `employee_id` | uuid, foreign key → `profiles.id` | |
| `leave_type_id` | uuid, foreign key → `leave_types.id` | |
| `start_date` / `end_date` | date | |
| `days_requested` | integer | |
| `reason` | text | |
| `status` | enum (`pending`, `approved`, `rejected`, `cancelled`) | |
| `reviewed_by` | uuid, foreign key → `profiles.id`, nullable | |
| `reviewed_at` | timestamp, nullable | |
| `review_comment` | text, nullable | |
| `created_at` / `updated_at` | timestamp | |

### 3.2 Indexing Strategy

To support efficient filtering as request volume grows, the following indexes are applied:

- `leave_requests(employee_id)`
- `leave_requests(status)`
- Composite index on `leave_requests(employee_id, status)`
- Composite index on `leave_requests(status, created_at)`
- Unique index on `leave_types(name)`

### 3.3 Design Assumption

Employees may edit or delete a leave request only while its status remains `pending`. Once a request has been reviewed (approved or rejected), it is locked from further modification by the employee. This assumption reflects standard practice for maintaining an accurate approval record and will be documented as an explicit design decision in the final implementation summary.

---

## 4. System Architecture and Access Control

### 4.1 Data Access Layer

The majority of create, read, update, and delete operations are performed through Supabase's auto-generated PostgREST interface. Role-based access is enforced through Row Level Security policies rather than through application-level conditional logic, ensuring that access control remains consistent regardless of which client or application instance issues the request.

**Policy summary:**

| Resource | Employee Access | Administrator Access |
|---|---|---|
| `leave_types` | Read-only | Full create, read, update, delete |
| `leave_requests` | Create and read own records; update and delete own records while status is `pending` | Read all records; update status on any record |

Filtering and pagination are implemented at the query level (for example, `?status=eq.pending&order=created_at.desc&limit=20&offset=0`), and related data (employee name, leave type name) is retrieved through relational embedding in a single request to avoid repeated round trips.

### 4.2 Server-Side Routes

Two server-side API routes handle the status-transition actions that require elevated privilege beyond what row-level policies alone should grant to a client request:

- `POST /api/leave-requests/:id/approve`
- `POST /api/leave-requests/:id/reject`

Each route independently verifies the caller's authentication token and confirms administrator role membership before applying the update, using a service-role credential that is retained exclusively on the server and is never transmitted to the client.

---

## 5. Deployment Plan

1. Initialize a Next.js (TypeScript) application and establish a version-controlled repository.
2. Provision a Supabase project and record the project URL, anonymous key, and service-role key.
3. Execute database migrations to create the required tables, enumerated types, indexes, Row Level Security policies, and a trigger to automatically provision a `profiles` record upon user registration.
4. Populate initial data: a representative set of leave types and two evaluation accounts (one Employee, one Administrator), with the administrator role assigned directly at the database level.
5. Develop the employee-facing interface (request submission, review, modification, and status visibility) and the administrator-facing interface (request review, approval/rejection, and leave-type management).
6. Configure environment variables for local development, distinguishing between client-exposed and server-only credentials.
7. Conduct local verification of both roles, confirming that Row Level Security correctly restricts cross-user and cross-role access.
8. Deploy the application to Vercel, configuring the corresponding environment variables within the hosting platform.
9. Conduct end-to-end verification against the live deployment using both evaluation accounts.
10. Implement a scheduled keep-alive routine (via GitHub Actions) that periodically invokes a lightweight health-check endpoint, preventing automatic suspension of the Supabase project during extended inactivity.

---

## 6. Scalability and Performance Considerations

The following design decisions are adopted at the outset to avoid architectural limitations as usage grows:

- **Stateless authentication.** JSON Web Tokens are used in place of server-managed sessions, permitting horizontal scaling without a shared session store.
- **Server-side pagination and filtering.** All list views retrieve bounded, filtered result sets from the database rather than retrieving complete datasets for client-side processing.
- **Targeted indexing.** Indexes are applied to all columns used in frequent filtering or sorting operations.
- **Elimination of N+1 query patterns.** Related records are retrieved through relational embedding in a single query.
- **Client-side caching of low-volatility data.** The leave-type list, which changes infrequently, is cached on the client to reduce redundant requests.
- **Minimization of custom serverless functions.** Reliance on the platform's native data-access layer, rather than custom endpoints, reduces cold-start exposure and code surface area.
- **Database-enforced authorization.** Role-based access control is implemented at the data layer, ensuring consistent enforcement independent of the number of application instances.

---

## 7. Risk Assessment and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Supabase project suspension after seven days of inactivity | Moderate | High (service unavailable to evaluator) | Scheduled health-check invocation every two to three days via GitHub Actions |
| Serverless cold-start latency on first request | Low | Low | Minimize custom function usage; rely primarily on static delivery and direct database queries |
| Free-tier usage limits exceeded | Very Low | Low | Not a practical concern at single-evaluator scale |
| Loss of repository or database access due to account changes | Low | High | Maintain both under a single, stable account for the duration of the evaluation period |

---

## 8. Implementation Summary Guidance

The final submission requires a written implementation summary of three to five paragraphs. The summary should address the following points:

- **Approach.** The selected technology stack and the rationale for its selection, with particular attention to cost, reliability, and architectural soundness.
- **Completed features.** Role-based authentication; employee-level request management; administrator-level review, approval, and rejection workflows; leave-type administration; status visibility; and search/filtering functionality.
- **Notable decisions and assumptions.** The use of database-level Row Level Security as the primary access-control mechanism, and the design assumption regarding locked editing of reviewed requests.
- **Challenges and resolutions.** Any technical obstacles encountered during development (for example, policy configuration, connection management, or platform-specific behavior) and the approach taken to resolve them.
- **Verification.** The testing procedure used to confirm correct system behavior, including cross-role access testing and end-to-end verification of the deployed application.

---

## 9. Project Checklist

### Phase 0 — Project Setup
- [x] Establish version-controlled repository
- [x] Initialize Next.js (TypeScript) application
- [x] Provision Supabase project
- [x] Record environment credentials (project URL, anonymous key, service-role key)

### Phase 1 — Database Foundation
- [x] Create `profiles` table and associated role enumeration
- [x] Create `leave_types` table
- [x] Create `leave_requests` table and associated status enumeration
- [x] Apply indexing strategy as specified in Section 3.2
- [x] Implement Row Level Security policies for `leave_types` and `leave_requests`
- [x] Implement trigger to auto-provision `profiles` record upon registration

### Phase 2 — Initial Data
- [ ] Populate representative leave types
- [ ] Create Employee evaluation account
- [ ] Create Administrator evaluation account

### Phase 3 — Employee-Facing Application
- [ ] Implement authentication interface (login/logout)
- [ ] Implement employee dashboard for request creation, viewing, modification, and deletion
- [ ] Implement status and detail visibility for leave requests
- [ ] Implement search and filtering functionality

### Phase 4 — Administrator-Facing Application
- [ ] Implement administrator view of all leave requests
- [ ] Implement approval and rejection workflow
- [ ] Implement leave-type administration interface
- [ ] Implement server-side approval endpoint
- [ ] Implement server-side rejection endpoint

### Phase 5 — Reliability Infrastructure
- [ ] Implement health-check endpoint
- [ ] Configure scheduled keep-alive workflow

### Phase 6 — Verification
- [ ] Conduct end-to-end testing of employee workflow
- [ ] Conduct end-to-end testing of administrator workflow
- [ ] Verify access restriction between employee accounts
- [ ] Verify access restriction for non-administrator users on leave-type operations
- [ ] Verify filtering, search, and pagination functionality
- [ ] Verify modification restriction on reviewed requests

### Phase 7 — Deployment
- [ ] Deploy application to Vercel
- [ ] Configure production environment variables
- [ ] Verify successful deployment and public accessibility
- [ ] Conduct end-to-end verification on the deployed application

### Phase 8 — Submission
- [ ] Provide deployed system link
- [ ] Provide Employee account credentials
- [ ] Provide Administrator account credentials
- [ ] Submit implementation summary
- [ ] Provide evaluator usage notes
- [ ] Confirm continued accessibility of repository and database throughout the evaluation period