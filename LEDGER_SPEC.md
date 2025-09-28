# Ledger Specification (LEDGER_SPEC.md)
**Product:** Shared Finance App  
**Version:** 0.1 (MVP)  
**Owner:** TBD  
**Last Updated:** YYYY-MM-DD  

---

## 1. Purpose & Scope
The ledger is the **source of truth** for all monetary commitments and settlements inside a Space. It is **non-custodial** (virtual): entries record **pledges** (intent) and **settlements** (Stripe charges/refunds), not cash held by us. This spec defines:

- Entry schema & allowed types  
- Invariants and balancing rules  
- Rounding, currency, and ordering  
- Idempotency, reconciliation, and error handling  
- Worked examples and test oracles  

---

## 2. Principles
- **Deterministic:** Given the same sequence of domain events, ledger state is identical.  
- **Immutable:** Entries are append-only; corrections use compensating entries.  
- **Idempotent:** Payment-related handlers must never double apply.  
- **Auditable:** Every entry links to a business object (`pledge`, `payout`, `payment`).  
- **Space-isolated:** Balances/invariants are computed per Space.  
- **Least surprise:** What users see matches ledger math precisely.  

---

## 3. Domain Concepts
- **Space**: A shared bucket (Rent, Utilities, Trip Fund).  
- **Member Allocation**: Percentage share a user owes in a Space.  
- **Pledge**: A member’s *intent* to fund future payouts.  
- **Payout**: Admin-triggered settlement executed via Stripe.  
- **Consent**: Approvals/denials associated to a payout proposal.  
- **Balance**: Net position of a member in a Space derived from ledger entries.  

---

## 4. Entry Types

| Type      | Direction | Meaning                                                   |
|-----------|-----------|-----------------------------------------------------------|
| `pledge`  | +         | Member declares commitment (virtual).                     |
| `debit`   | −         | Member is charged (Stripe payment succeeded).              |
| `credit`  | +         | Money returned (Stripe refund / reversal).                |
| `adjust`  | ±         | Admin/system correction (rounding, migration, waiver).    |
| `fee`     | −         | Optional explicit recording of fees (future extension).   |

---

## 5. Entry Schema
**Table: `ledger_entries`**

- `id` (uuid, PK)  
- `space_id` (uuid, FK)  
- `user_id` (uuid, nullable for Space-wide adjustments)  
- `type` (enum)  
- `currency` (iso_4217 char(3))  
- `amount_minor` (bigint; **minor units** only, no floats)  
- `ref_type` (enum: pledge/payout/payment/refund/adjustment)  
- `ref_id` (uuid or string)  
- `event_time` (timestamptz; domain event timestamp)  
- `recorded_at` (timestamptz; insertion time)  
- `idempotency_key` (text, nullable, unique when not null)  
- `memo` (text; optional)  

**Indexes**
- `(space_id, event_time, id)` for ordered scans  
- `(space_id, user_id, event_time)` for member statements  
- `(idempotency_key)` unique partial index  
- `(ref_type, ref_id)` for tracing  

---

## 6. Balances & Invariants

### Member Balance (per Space)
```
balance(user, space) = Σ(amount_minor WHERE space_id=space AND user_id=user)
```
- Positive balance = member owes money to Space
- Negative balance = Space owes money to member (overpayment/refund due)

### Space Conservation

At any point in time, a Space must remain internally consistent:

Σ(balance of all members in the space)  
+ Σ(all space-wide entries where user_id = null)  
= 0



### Pledge Semantics
- Pledge = intent, not settlement.  
- Surplus pledges roll forward.  

### Payout Proportionality
- Charge each member = `payout_amount * allocation_pct`.  
- Apply rounding rules (see §7).  

---

## 7. Currency & Rounding
- Store amounts in minor units (cents).  
- Use **Largest Remainder Method** (Hare–Niemeyer) for proportional splits:  
  1. Compute raw share.  
  2. Floor to minor unit.  
  3. Distribute leftover cents by highest fractional remainders.  

---

## 8. Ordering & Time
- Order by `(event_time, id)`.  
- All times UTC.  
- Use Stripe IDs as `idempotency_key` for debits/credits.  

---

## 9. Idempotency
- All `debit`, `credit`, `adjust` writes must carry an `idempotency_key`.  
- Duplicate attempts → no-op.  
- Webhook handlers: verify signature → upsert payment → insert entry.  

---

## 10. Payout Lifecycle
1. **Proposed** → snapshot allocations & amount.  
2. **Consent Window** → approvals/denials collected.  
3. **Ready** → quorum/timeout satisfied.  
4. **Execute** → Stripe PaymentIntents per member share.  
5. **Settled** → Stripe webhook creates `debit`.  
6. **Failure** → no `debit`; member may remain negative.  

---

## 11. Reconciliation & Reporting
- **Internal:** Daily recompute balances from ledger; compare to cache.  
- **External:** Join ledger debits/credits with Stripe reports.  
- **Statements:** Per-member and per-Space views.  

---

## 12. API Invariants
- Pledge create → must yield `pledge`.  
- Payout execute → only webhook can yield `debit`.  
- Refund → yields `credit`.  
- Admin adjust → requires `memo` + audit log.  

---

## 13. Edge Cases
- Member joins/leaves mid-cycle → snapshot at payout proposal.  
- Silent members → auto-approve after timeout.  
- Multi-currency → not supported MVP.  
- Rounding residual → distribute via Largest Remainder; fallback adjust.  

---

## 14. Worked Examples

### Rent (SGD 2,000, 4 members, 40/30/20/10%)
```
Pledges: +800, +600, +400, +200 (total: +2000)
Debits:  -800, -600, -400, -200 (total: -2000)
Balances: 0, 0, 0, 0 (all settled)
```

### Rounding Example (SGD 100, 3 members, 33.33% each)
```
Raw shares: 33.33, 33.33, 33.34
Floor: 33, 33, 33 = 99 cents
Remainder: 0.33, 0.33, 0.34 → distribute 1 cent to highest (member 3)
Final debits: 33, 33, 34 cents (total: 100)
```

### Shortfall (member fails)
- Missing debit recorded as failure.
- Space pays less unless admin covers shortfall.

### Refund
- Stripe refund → `credit` entry with link to original payment.  

---

## 15. Guards
- `CHECK(amount_minor != 0)`  
- Currency must match Space currency.  
- No deletes/updates on ledger entries.  
- Idempotency enforced.  

---

## 16. Testing Strategy
- **Properties:** Σ balances = 0, rounding residual ≤ 1 unit, idempotency safe.  
- **Scenarios:** pledges, full payouts, failures, refunds, rounding edge cases.  

---

## 17. Audit & Export
- Exports: CSV + JSONL with stable schema.
- Retention: indefinite; archive to S3 after N days.

## 18. Failure Recovery
- **Webhook delivery fails:** Retry with exponential backoff (1m, 5m, 30m, 2h, 12h)
- **Payment succeeds but webhook lost:** Daily reconciliation job compares Stripe vs ledger
- **Database corruption:** Point-in-time recovery from RDS backups + replay from Stripe
- **Idempotency key collision:** Return existing entry, log warning for investigation  

---
