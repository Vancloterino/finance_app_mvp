# Comprehensive User Flow Testing Plan

## Test Environment
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database: PostgreSQL (finance_app)

---

## Flow 1: User Registration & Account Creation

### Steps:
1. Navigate to http://localhost:3000/register
2. Enter user details (name, email, password)
3. Submit registration
4. Verify redirect to dashboard/spaces

### API Endpoints to Test:
- `POST /api/v1/auth/register`

### Expected Outcomes:
- ✅ User created in database
- ✅ JWT token generated
- ✅ Redirect to /spaces page
- ✅ User info stored in localStorage

### Test Command:
```bash
# Check if registration endpoint works
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

---

## Flow 2: Login & Authentication

### Steps:
1. Navigate to http://localhost:3000/login
2. Enter email and password
3. Submit login
4. Verify redirect to dashboard

### API Endpoints to Test:
- `POST /api/v1/auth/login`

### Expected Outcomes:
- ✅ JWT token received
- ✅ Token stored in localStorage
- ✅ User authenticated
- ✅ Redirect to /spaces

### Test Command:
```bash
# Test login endpoint
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

---

## Flow 3: Space Creation

### Steps:
1. Login as user
2. Navigate to /spaces
3. Click "Create Space"
4. Fill in: Name, Description, Currency
5. Submit

### API Endpoints to Test:
- `POST /api/v1/spaces`
- `GET /api/v1/users/{user_id}/spaces`

### Expected Outcomes:
- ✅ Space created in database
- ✅ User added as ADMIN member
- ✅ Allocation set (default or specified)
- ✅ Space appears in user's space list

### Database Verification:
```sql
SELECT id, name, created_by FROM spaces ORDER BY created_at DESC LIMIT 1;
SELECT * FROM space_members WHERE space_id = '<space_id>';
```

---

## Flow 4: Member Invitation

### Steps:
1. Open space settings
2. Click "Invite Member"
3. Enter email address
4. Set allocation percentage
5. Submit invitation

### API Endpoints to Test:
- `POST /api/v1/spaces/{space_id}/invite`
- `POST /api/v1/spaces/{space_id}/members`

### Expected Outcomes:
- ✅ Invitation email sent (if configured)
- ✅ Member added to space
- ✅ Allocation percentage set
- ✅ Member appears in space member list

### Database Verification:
```sql
SELECT * FROM space_members WHERE space_id = '<space_id>' ORDER BY created_at DESC;
```

---

## Flow 5: Pledge Creation

### Steps:
1. Navigate to space detail page
2. Click "Add Pledge"
3. Enter amount and description
4. Submit

### API Endpoints to Test:
- `POST /api/v1/pledges`
- `GET /api/v1/pledges?space_id={space_id}`
- `GET /api/v1/spaces/{space_id}/ledger`

### Expected Outcomes:
- ✅ Pledge created in database
- ✅ Ledger entry created (type: PLEDGE, ref_type: PLEDGE)
- ✅ Pledge appears in space overview
- ✅ Balance updated
- ✅ Transaction history shows pledge

### Database Verification:
```sql
SELECT * FROM pledges WHERE space_id = '<space_id>' ORDER BY created_at DESC LIMIT 1;
SELECT * FROM ledger_entries WHERE ref_type = 'PLEDGE' ORDER BY event_time DESC LIMIT 1;
```

---

## Flow 6: Transfer Between Spaces

### Steps:
1. Navigate to /spaces
2. Click "Transfer Between Spaces"
3. Select source space (FROM)
4. Select destination space (TO)
5. Enter amount and optional description
6. Submit

### API Endpoints to Test:
- `POST /api/v1/transfers`
- `GET /api/v1/spaces/{space_id}/ledger`

### Expected Outcomes:
- ✅ DEBIT ledger entry in source space (type: DEBIT, ref_type: TRANSFER)
- ✅ CREDIT ledger entry in destination space (type: CREDIT, ref_type: TRANSFER)
- ✅ Both entries have same amount
- ✅ Transaction history shows transfer in both spaces
- ✅ Balances updated correctly

### Database Verification:
```sql
SELECT * FROM ledger_entries WHERE ref_type = 'TRANSFER' ORDER BY event_time DESC LIMIT 2;
```

---

## Flow 7: Payout Proposal & Consent

### Steps:
1. Admin navigates to space
2. Click "Propose Payout"
3. Enter payee name, amount, description
4. Submit proposal
5. Members view payout
6. Members give consent (approve/deny)
7. Check if payout reaches READY status

### API Endpoints to Test:
- `POST /api/v1/payouts` (admin only)
- `GET /api/v1/payouts?space_id={space_id}`
- `GET /api/v1/payouts/{payout_id}/consent-summary`
- `POST /api/v1/payouts/{payout_id}/consent`

### Expected Outcomes:
- ✅ Payout created with status PROPOSED
- ✅ Status changes to CONSENT_PENDING
- ✅ Members can view and consent
- ✅ Consent summary shows allocation percentages
- ✅ When quorum reached (>50%), status → READY
- ✅ Payout appears in space overview

### Database Verification:
```sql
SELECT * FROM payouts WHERE space_id = '<space_id>' ORDER BY created_at DESC LIMIT 1;
SELECT * FROM payout_consents WHERE payout_id = '<payout_id>';
```

---

## Flow 8: Payment Method Setup

### Steps:
1. Navigate to /payments
2. Click "Add Payment Method"
3. Stripe modal opens
4. Enter card details (use Stripe test card: 4242 4242 4242 4242)
5. Submit

### API Endpoints to Test:
- `GET /api/v1/payments/stripe-config`
- `POST /api/v1/payments/setup-intent`
- `GET /api/v1/payments/payment-methods`

### Expected Outcomes:
- ✅ Stripe setup intent created
- ✅ Payment method saved to Stripe
- ✅ Payment method ID stored for user
- ✅ Payment method appears in list
- ✅ Can set as default

### Database Verification:
```sql
SELECT stripe_customer_id, payment_method_id FROM users WHERE id = '<user_id>';
```

---

## Flow 9: Payout Execution & Payment Processing

### Steps:
1. Payout in READY status
2. Admin clicks "Execute Payout"
3. System processes payment
4. Ledger entries created

### API Endpoints to Test:
- `POST /api/v1/webhooks/process-payout/{payout_id}`
- `GET /api/v1/spaces/{space_id}/ledger`

### Expected Outcomes:
- ✅ Payout status → EXECUTING
- ✅ Stripe payment intent created
- ✅ DEBIT ledger entries for each member (proportional to allocation)
- ✅ Payout status → SETTLED
- ✅ Balances updated

### Database Verification:
```sql
SELECT status FROM payouts WHERE id = '<payout_id>';
SELECT * FROM ledger_entries WHERE ref_type = 'PAYOUT' AND ref_id = '<payout_id>';
```

---

## Flow 10: Balance & Transaction History

### Steps:
1. Navigate to space detail page
2. View "Your Balance" card
3. View "Your Contribution" card
4. Check "Transaction History" section

### Expected Outcomes:
- ✅ Balance = (Pledges + Credits) - Debits
- ✅ Contribution = Sum of PLEDGE entries only
- ✅ Transaction History shows:
  - Pledges (with $ icon, green)
  - Transfers In (with ↔️ icon, green)
  - Transfers Out (with ↔️ icon, orange)
  - Payouts (with $ icon, red)

---

## Automated Test Script

I'll create a bash script to test all critical endpoints:

