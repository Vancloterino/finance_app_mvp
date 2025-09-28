# Product Requirements Document (PRD)  
**Product:** Shared Finance App  
**Version:** 0.1 (MVP)  
**Owner:** Finance App Team
**Last Updated:** 2025-01-28  

---

## 1. Purpose  
This product enables groups (e.g., roommates, families, friends) to manage shared expenses or savings goals where contributions are **proportional, not equal**. It replaces ad-hoc methods like spreadsheets or messaging apps with a transparent, consent-driven system.  

The MVP focuses on **household rent/bills**, where one admin collects money proportionally from members and executes a payout via Stripe, with full visibility and approval.  

---

## 2. Goals  
- Provide a **shared ledger** for group financial commitments.  
- Support **percentage-based allocations** for uneven splits.  
- Ensure transparency with **per-member balances and immutable records**.  
- Execute real payouts via Stripe, but avoid holding funds in custody.  
- Provide a **consent mechanism** for trust and fairness.  
- Be extensible to savings goals and business cost centres.  

---

## 3. Target Users  
- **Consumers (MVP):** Roommates, couples, families, or friends splitting bills or saving together.  
- **Future Expansion:** Small businesses needing lightweight budget buckets (marketing, ops, utilities).  

---

## 4. User Stories  

### Core MVP Stories
1. As a **tenant**, I want to pledge my rent portion so others see I’m committed.  
2. As a **member**, I want to track how much I’ve pledged and how much I’ve been charged.  
3. As an **admin**, I want to initiate a payout once enough pledges are made.  
4. As a **member**, I want to approve or deny a payout so I can control my money.  
5. As a **member**, I want to see who has pledged and how much.
6. As a **group**, we want transparent records to prevent disputes.
7. As a **new user**, I want to be invited to a Space and complete setup easily.
8. As a **member**, I want clear guidance when my payment fails or is disputed.  

### Future Extensions
- As a **user**, I want to connect my WhatsApp group to create a Space directly.  
- As a **group of friends**, we want to pledge money toward a shared savings goal (e.g., holiday trip).  
- As a **small business owner**, I want to track expenses across cost centres like Marketing and Utilities.  

---

## 5. Scope  

### In Scope (MVP)
- Spaces (e.g., Rent, Utilities, Trip Fund).  
- Member allocations by percentage.  
- Virtual ledger for pledges (not custodial).  
- Payouts triggered via Stripe (Payment Intents).  
- Consent workflow with quorum and timeouts.  
- Notifications via email/SMS.  
- Basic web app UI (React SPA).  

### Out of Scope (MVP)
- Native mobile apps.  
- Holding funds in custody.  
- Non-Stripe payment processors (PayNow, PayPal, etc.).  
- Advanced dispute resolution.  
- Multi-level enterprise approval flows.  

---

## 6. Success Metrics  
- **Operational**  
  - >90% of payouts executed on time.  
  - <5% Stripe payment failures without recovery.  

- **User Experience**
  - >70% of users understand "pledge vs settlement" without confusion (measured by onboarding survey).
  - >50% monthly active use among early adopters (retention).
  - <2 minutes average onboarding time for invited users.
  - MVP launch target: Q2 2025  

- **Growth / Future-readiness**  
  - % of groups reusing app for multiple Spaces (stickiness).  
  - % of users requesting new integrations (WhatsApp, PayNow, etc.).  

---

## 7. Consent Policy (MVP)  
- Default: unanimous approval.  
- Fallback: quorum (≥75% by allocation %).  
- Silent members auto-approve after 48h.  
- Admin override allowed with audit log.  

---

## 8. Constraints & Assumptions  
- Stripe availability in user’s region.  
- Pledges are **not actual deposits** (must be clearly communicated).  
- Minimum viable UI must prioritize clarity of balances and consent states.  
- Web-first, mobile web responsive; native mobile in future phase.
- GDPR compliance required for EU users.
- All user data encrypted at rest and in transit.  

---

## 9. Risks & Mitigations  
- **Confusion about pledges** → Clear messaging, onboarding tooltips.  
- **Payment failures** → Retry logic and fallback notifications.  
- **Deadlocks on approvals** → Quorum + timeout auto-approve.  
- **Trust issues** → Immutable ledger, consent logs, audit trail.  

---

## 10. Future Extensions  
- **Consumer:** WhatsApp/Telegram integration, savings goals, gamification (badges, streaks).  
- **Enterprise:** Cost centre buckets, export to accounting tools, multi-level approvals, audit-ready reporting.  
