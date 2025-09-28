# Build Plan

## Phase 0 (4-6 weeks) — Vertical Slice MVP
**Target:** Q1 2025 completion
**Dependencies:** Stripe approval, AWS account setup

- Week 1-2: Core backend (Spaces, Pledges, Payouts, Consents, Ledger)
- Week 3-4: Stripe integration (PaymentIntents + webhooks)
- Week 5: React frontend (Space list, pledge form, consent UI)
- Week 6: Deploy via ECS Fargate, basic monitoring

**Deliverable:** Working app for 1 Space with 3-5 users

## Phase 1 (3-4 weeks) — Hardening & DX
**Target:** Q2 2025 start
**Dependencies:** Phase 0 user feedback, load testing results

- Week 1: E2E tests (Playwright), Redis queue setup
- Week 2: Email templates + reminder system
- Week 3: Admin console for audit logs
- Week 4: Observability dashboards (latency, errors)

**Deliverable:** Production-ready for 10+ Spaces

## Phase 2 (2-3 months) — Scale & Extensions
**Target:** Q3 2025
**Dependencies:** User growth metrics, feature requests

- Month 1: Chat integrations (WhatsApp/Telegram bots)
- Month 2: Savings goal "piggy bank" mode
- Month 3: Enterprise features (cost centres, accounting exports)

**Scaling trigger:** Move Redis → SQS when >100 active Spaces

## Phase 3 (6+ months) — Mobile + Enterprise
**Target:** Q4 2025 and beyond
**Dependencies:** Market validation, funding

- Native mobile apps (React Native or Flutter)
- Multi-level approval flows
- Broader payment providers (PayNow, PayPal, Adyen)

**Rollback Plan:** If any phase fails, revert to previous stable version and reassess scope  
