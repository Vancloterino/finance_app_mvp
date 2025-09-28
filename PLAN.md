# Build Plan

## Phase 0 (Days) — Vertical Slice MVP
- Implement Spaces, Pledges, Payouts, Consents, Ledger.  
- Stripe integration (PaymentIntents + webhooks).  
- React frontend: Space list, pledge form, consent UI.  
- Sentry error tracking + basic logs.  
- Deploy via ECS Fargate.  

## Phase 1 (Weeks) — Hardening & DX
- Add E2E tests (Playwright).  
- Add Redis queue for notifications + retries.  
- Email templates + reminders.  
- Add admin console for audit logs.  
- Observability dashboards (latency, errors).  

## Phase 2 (Months) — Scale & Extensions
- Move async jobs from Redis → SQS (if needed).  
- Add GraphQL API (if multiple clients emerge).  
- Add chat integrations (WhatsApp/Telegram bots).  
- Savings goal “piggy bank” mode.  
- Enterprise features: cost centres, accounting exports.  

## Phase 3 (Future) — Mobile + Enterprise
- Native mobile apps (React Native or Flutter).  
- Multi-level approval flows.  
- Broader payment providers (PayNow, PayPal, Adyen).  
