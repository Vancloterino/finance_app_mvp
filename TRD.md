# Technical Requirements Document (TRD)  
**Product:** Shared Finance App  
**Version:** 0.1 (MVP)  
**Owner:** TBD  
**Last Updated:** YYYY-MM-DD  

---

## 1. Architecture Overview  
- **Frontend:** React + TypeScript + Vite, styled with Tailwind CSS + shadcn/ui.  
- **Backend API:** Python + FastAPI with Pydantic models, async endpoints.  
- **Database:** PostgreSQL (RDS) for persistence and ledger invariants.  
- **Cache & Jobs:** Redis (ElastiCache) for sessions, caching, lightweight job queue.  
- **Object Storage:** S3 for receipts, exports, and audit dumps.  
- **Payments:** Stripe (PaymentIntents, SetupIntents, Webhooks).  
- **Notifications:** Postmark/SendGrid (email), Twilio (SMS).  
- **Auth:** AWS Cognito (OIDC), JWT tokens, RBAC roles.  
- **Deployment:** AWS ECS Fargate (web + API), RDS Postgres, ElastiCache Redis.  
- **Observability:** OpenTelemetry traces, structured JSON logs, Sentry for errors.  

---

## 2. Core Components  

### 2.1 User Service  
- Handles user accounts, auth, linked payment methods.  
- JWT-based sessions; roles: admin, member, viewer.  

### 2.2 Space Service  
- Create/manage Spaces (Rent, Utilities, etc).  
- Manage member allocations (%), invites, and role updates.  

### 2.3 Ledger Service  
- Records pledges, debits, credits, adjustments.  
- Enforces invariants:  
  - Sum(balances) = 0 within a Space.  
  - Debits tied to payouts.  
  - Pledges informational until settlement.  

### 2.4 Consent Orchestrator  
- Manages payout proposals.  
- Applies quorum and timeout rules.  
- Triggers payout when policy satisfied.  

### 2.5 Payment Service (Stripe)  
- Creates and executes PaymentIntents.  
- Applies idempotency keys.  
- Retries failed charges.  
- Listens to Stripe webhooks for settlement events.  

### 2.6 Notification Service  
- Queued, template-based emails/SMS for pledges, approvals, reminders.  
- Retry with exponential backoff.  

### 2.7 Admin Console  
- View audit logs.  
- Manage feature flags.  
- Provide manual override for payouts.  

---

## 3. Data Model (Simplified)  

### User  
- id, name, email, auth_id, payment_methods[…]  

### Space  
- id, name, currency, cadence, due_date, admin_ids[…]  

### MemberAllocation  
- space_id, user_id, allocation_pct, role, active  

### Pledge  
- id, space_id, user_id, amount, created_at  

### Payout  
- id, space_id, amount, payee, scheduled_at, status  

### Consent  
- payout_id, user_id, decision {approve|deny|pending|auto}, decided_at  

### LedgerEntry  
- id, space_id, user_id, type {pledge|debit|credit|adjust}, amount, ref_id  

### Policy  
- space_id, quorum_pct, auto_approve_timeout, allow_negative  

---

## 4. API Contracts (High-Level)  

### Spaces  
- `POST /spaces` → Create new Space  
- `GET /spaces/{id}` → Get Space details  
- `PATCH /spaces/{id}` → Update allocations/policies  

### Pledges  
- `POST /spaces/{id}/pledges` → Create pledge  
- `GET /spaces/{id}/pledges` → List pledges  

### Payouts  
- `POST /spaces/{id}/payouts` → Propose payout  
- `GET /spaces/{id}/payouts/{payout_id}` → Get payout status  

### Consents  
- `POST /payouts/{payout_id}/consent` → Approve/deny payout  

### Ledger  
- `GET /spaces/{id}/ledger` → Full ledger view  
- `GET /spaces/{id}/balances` → Member balances  

---

## 5. Security Requirements  
- Stripe Elements for PCI compliance; never store raw card data.  
- Store only Stripe tokens.  
- Encrypt PII at rest (AES-256) + in transit (TLS 1.2+).  
- Verify all Stripe webhooks.  
- Immutable audit logs.  

---

## 6. Constraints & Assumptions  
- Virtual ledger only (no custody of funds).  
- Stripe is sole payment processor for MVP.  
- Web-first; responsive design for mobile.  
- All API calls require JWT auth.  
- Deployment on AWS (ECS, RDS, ElastiCache, S3).  

---

## 7. Observability & Ops  
- Metrics: request latency, Stripe error rates, consent completion times.  
- Logs: structured JSON logs, aggregated centrally.  
- Tracing: OpenTelemetry spans across API, DB, Stripe.  
- Alerts: failed payouts, webhook errors, API downtime.  

---

## 8. Risks & Mitigations  
- **Payment failures** → Retry logic + notifications.  
- **Deadlocks in consent** → Quorum + timeout fallback.  
- **User confusion (pledge ≠ funds)** → Clear UI/UX messaging.  
- **Compliance risk** → Explicitly document non-custodial model.  

---

## 9. Rate Limiting & Security
- **API Rate Limits:** 100 req/min per user, 10 req/min for payment endpoints
- **Payment Security:** Stripe Elements (PCI compliant), webhook signature verification
- **Data Protection:** AES-256 encryption at rest, TLS 1.3 in transit
- **API Versioning:** `/api/v1/` prefix, 6-month deprecation cycle

## 10. Database Strategy
- **Migrations:** Alembic for schema changes, zero-downtime deployments
- **Backups:** Daily automated backups, 30-day retention, cross-region replication
- **Performance:** Connection pooling (SQLAlchemy), read replicas for reporting

## 11. Disaster Recovery
- **RTO Target:** 4 hours for full service restoration
- **RPO Target:** 1 hour maximum data loss
- **Strategy:** Multi-AZ RDS, ECS auto-scaling, S3 cross-region replication
- **Runbooks:** Documented procedures for common failure scenarios

## 12. Customer Support Integration
- **Admin Tools:** Manual payout override, user account suspension
- **Audit Trails:** All admin actions logged with user ID + timestamp
- **Refund Process:** Direct Stripe refund with automatic ledger credit entry
- **Dispute Resolution:** Immutable ledger exports for evidence

## 13. Future Extensions
- Multiple payment providers (PayNow, GrabPay, PayPal).
- Chat integrations (WhatsApp, Telegram).
- Savings goal "piggy bank" Spaces.
- Business cost centre mapping.
- Multi-level approval flows.  
