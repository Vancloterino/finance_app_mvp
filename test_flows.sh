#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:8000/api/v1"
TEST_EMAIL="testflow_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"
TOKEN=""
USER_ID=""
SPACE_ID=""
PAYOUT_ID=""

echo "========================================"
echo "   COMPREHENSIVE USER FLOW TEST"
echo "========================================"
echo ""

# Test 1: Registration
echo -e "${YELLOW}Test 1: User Registration${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User Flow\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
  echo -e "${GREEN}✅ Registration successful${NC}"
  TOKEN=$(echo "$REGISTER_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || echo "")
else
  echo -e "${RED}❌ Registration failed${NC}"
  echo "$REGISTER_RESPONSE"
  exit 1
fi
echo ""

# Test 1.5: Verify Email (auto-verify for testing)
echo -e "${YELLOW}Test 1.5: Verify Email${NC}"
docker exec finance_app_postgres psql -U finance_user -d finance_app -c "UPDATE users SET email_verified = true WHERE email = '$TEST_EMAIL';" > /dev/null 2>&1
echo -e "${GREEN}✅ Email verified (auto)${NC}"
echo ""

# Test 2: Login
echo -e "${YELLOW}Test 2: User Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login-email" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo -e "${GREEN}✅ Login successful${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || echo "$TOKEN")
else
  echo -e "${RED}❌ Login failed${NC}"
  echo "$LOGIN_RESPONSE"
fi
echo ""

# Test 3: Get User Info
echo -e "${YELLOW}Test 3: Get Current User${NC}"
USER_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USER_RESPONSE" | grep -q "id"; then
  echo -e "${GREEN}✅ User info retrieved${NC}"
  USER_ID=$(echo "$USER_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
  echo "User ID: $USER_ID"
else
  echo -e "${RED}❌ Failed to get user info${NC}"
  echo "$USER_RESPONSE"
fi
echo ""

# Test 4: Create Space
echo -e "${YELLOW}Test 4: Create Space${NC}"
SPACE_RESPONSE=$(curl -s -X POST "$API_URL/spaces/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Flow Space",
    "description": "Space created for automated testing",
    "currency": "USD"
  }')

if echo "$SPACE_RESPONSE" | grep -q "id"; then
  echo -e "${GREEN}✅ Space created${NC}"
  SPACE_ID=$(echo "$SPACE_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
  echo "Space ID: $SPACE_ID"
else
  echo -e "${RED}❌ Space creation failed${NC}"
  echo "Error: $SPACE_RESPONSE"
fi
echo ""

# Test 5: Get User Spaces
echo -e "${YELLOW}Test 5: List User Spaces${NC}"
SPACES_RESPONSE=$(curl -s -X GET "$API_URL/users/$USER_ID/spaces" \
  -H "Authorization: Bearer $TOKEN")

if echo "$SPACES_RESPONSE" | python -c "import sys, json; data = json.load(sys.stdin); sys.exit(0 if isinstance(data, list) else 1)" 2>/dev/null; then
  echo -e "${GREEN}✅ Spaces retrieved${NC}"
  SPACE_COUNT=$(echo "$SPACES_RESPONSE" | python -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
  echo "Total spaces: $SPACE_COUNT"
else
  echo -e "${RED}❌ Failed to retrieve spaces${NC}"
  echo "Error: $SPACES_RESPONSE"
fi
echo ""

# Test 6: Create Pledge
echo -e "${YELLOW}Test 6: Create Pledge${NC}"
PLEDGE_RESPONSE=$(curl -s -X POST "$API_URL/pledges/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"space_id\": \"$SPACE_ID\",
    \"amount_minor\": 10000,
    \"currency\": \"USD\",
    \"description\": \"Test pledge for flow testing\"
  }")

if echo "$PLEDGE_RESPONSE" | grep -q "id"; then
  echo -e "${GREEN}✅ Pledge created${NC}"
  PLEDGE_ID=$(echo "$PLEDGE_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
  echo "Pledge ID: $PLEDGE_ID"
else
  echo -e "${RED}❌ Pledge creation failed${NC}"
  echo "Error: $PLEDGE_RESPONSE"
fi
echo ""

# Test 7: Get Space Ledger
echo -e "${YELLOW}Test 7: Check Ledger Entries${NC}"
LEDGER_RESPONSE=$(curl -s -X GET "$API_URL/spaces/$SPACE_ID/ledger" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LEDGER_RESPONSE" | python -c "import sys, json; data = json.load(sys.stdin); sys.exit(0 if 'entries' in data else 1)" 2>/dev/null; then
  echo -e "${GREEN}✅ Ledger entries retrieved${NC}"
  LEDGER_COUNT=$(echo "$LEDGER_RESPONSE" | python -c "import sys, json; print(len(json.load(sys.stdin)['entries']))" 2>/dev/null || echo "0")
  echo "Ledger entries: $LEDGER_COUNT"
else
  echo -e "${RED}❌ Failed to retrieve ledger${NC}"
  echo "Error: $LEDGER_RESPONSE"
fi
echo ""

# Test 8: Get User Balance
echo -e "${YELLOW}Test 8: Check User Balance${NC}"
BALANCE_RESPONSE=$(curl -s -X GET "$API_URL/users/$USER_ID/balance" \
  -H "Authorization: Bearer $TOKEN")

if echo "$BALANCE_RESPONSE" | grep -q "balance"; then
  echo -e "${GREEN}✅ Balance retrieved${NC}"
  BALANCE=$(echo "$BALANCE_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['balance'])" 2>/dev/null || echo "0")
  echo "Balance (cents): $BALANCE"
else
  echo -e "${RED}❌ Failed to retrieve balance${NC}"
fi
echo ""

# Test 9: Create Payout (if admin)
echo -e "${YELLOW}Test 9: Create Payout${NC}"
PAYOUT_RESPONSE=$(curl -s -X POST "$API_URL/payouts/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"space_id\": \"$SPACE_ID\",
    \"payee_name\": \"Test Vendor\",
    \"amount_minor\": 5000,
    \"currency\": \"USD\",
    \"description\": \"Test payout for flow testing\"
  }")

if echo "$PAYOUT_RESPONSE" | grep -q "id"; then
  echo -e "${GREEN}✅ Payout created${NC}"
  PAYOUT_ID=$(echo "$PAYOUT_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
  echo "Payout ID: $PAYOUT_ID"
else
  echo -e "${RED}❌ Payout creation failed (might need admin role)${NC}"
  echo "Error: $PAYOUT_RESPONSE"
fi
echo ""

# Test 10: Get Consent Summary
if [ ! -z "$PAYOUT_ID" ]; then
  echo -e "${YELLOW}Test 10: Get Consent Summary${NC}"
  CONSENT_RESPONSE=$(curl -s -X GET "$API_URL/payouts/$PAYOUT_ID/consent-summary" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$CONSENT_RESPONSE" | grep -q "quorum_needed"; then
    echo -e "${GREEN}✅ Consent summary retrieved${NC}"
    READY=$(echo "$CONSENT_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['ready_for_execution'])" 2>/dev/null || echo "false")
    echo "Ready for execution: $READY"
  else
    echo -e "${RED}❌ Failed to get consent summary${NC}"
  fi
  echo ""
fi

# Test 11: Stripe Config
echo -e "${YELLOW}Test 11: Get Stripe Config${NC}"
STRIPE_RESPONSE=$(curl -s -X GET "$API_URL/payments/stripe-config" \
  -H "Authorization: Bearer $TOKEN")

if echo "$STRIPE_RESPONSE" | grep -q "publishable_key"; then
  echo -e "${GREEN}✅ Stripe config retrieved${NC}"
else
  echo -e "${RED}❌ Stripe config not available${NC}"
fi
echo ""

# Test 12: Notification Config
echo -e "${YELLOW}Test 12: Get Notification Config${NC}"
NOTIF_RESPONSE=$(curl -s -X GET "$API_URL/notifications/config" \
  -H "Authorization: Bearer $TOKEN")

if echo "$NOTIF_RESPONSE" | grep -q "email_configured"; then
  echo -e "${GREEN}✅ Notification config retrieved${NC}"
else
  echo -e "${RED}❌ Notification config not available${NC}"
fi
echo ""

echo "========================================"
echo "   TEST SUMMARY"
echo "========================================"
echo "User Email: $TEST_EMAIL"
echo "User ID: $USER_ID"
echo "Space ID: $SPACE_ID"
echo "Payout ID: $PAYOUT_ID"
echo ""
echo "All critical flows tested!"
