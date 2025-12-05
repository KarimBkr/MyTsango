#!/bin/bash

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 TEST COMPLET DES ENDPOINTS MYTSANGO"
echo "======================================"
echo ""

# Test 1: Register
echo "📝 TEST 1: POST /auth/register"
RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test'$(date +%s)'@example.com","password":"Test123456"}')
TOKEN=$(echo $RESPONSE | jq -r '.token // empty')
if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✅ Register OK${NC}"
  echo "Token: ${TOKEN:0:50}..."
  USER_ID=$(echo $RESPONSE | jq -r '.user.id')
  echo "User ID: $USER_ID"
else
  echo -e "${RED}❌ Register FAILED${NC}"
  echo "$RESPONSE" | jq .
  exit 1
fi
echo ""

# Test 2: Login
echo "🔐 TEST 2: POST /auth/login"
EMAIL="test$(date +%s)@example.com"
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test123456\"}" > /dev/null

LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test123456\"}")
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token // empty')
if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✅ Login OK${NC}"
  echo "Token: ${TOKEN:0:50}..."
else
  echo -e "${RED}❌ Login FAILED${NC}"
  echo "$LOGIN_RESPONSE" | jq .
  exit 1
fi
echo ""

# Test 3: Get Profile
echo "👤 TEST 3: GET /auth/me"
PROFILE=$(curl -s -X GET $BASE_URL/auth/me \
  -H "Authorization: Bearer $TOKEN")
if echo "$PROFILE" | jq -e '.id' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Get Profile OK${NC}"
  echo "$PROFILE" | jq '{id, email, role, kycStatus}'
else
  echo -e "${RED}❌ Get Profile FAILED${NC}"
  echo "$PROFILE" | jq .
fi
echo ""

# Test 4: KYC Status
echo "🆔 TEST 4: GET /kyc/status"
KYC_STATUS=$(curl -s -X GET $BASE_URL/kyc/status \
  -H "Authorization: Bearer $TOKEN")
if echo "$KYC_STATUS" | jq -e '.status' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ KYC Status OK${NC}"
  echo "$KYC_STATUS" | jq .
else
  echo -e "${RED}❌ KYC Status FAILED${NC}"
  echo "$KYC_STATUS" | jq .
fi
echo ""

# Test 5: KYC Start
echo "🚀 TEST 5: POST /kyc/start"
KYC_START=$(curl -s -X POST $BASE_URL/kyc/start \
  -H "Authorization: Bearer $TOKEN")
if echo "$KYC_START" | jq -e '.sdkAccessToken' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ KYC Start OK${NC}"
  echo "$KYC_START" | jq '{applicantId, status, sdkAccessToken: (.sdkAccessToken | .[0:30] + "...")}'
elif echo "$KYC_START" | jq -e '.statusCode' > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  KYC Start Error (attendu si Sumsub non configuré)${NC}"
  echo "$KYC_START" | jq '{statusCode, message}'
else
  echo -e "${RED}❌ KYC Start FAILED${NC}"
  echo "$KYC_START" | jq .
fi
echo ""

# Test 6: Create Payment
echo "💳 TEST 6: POST /payments/circles/:circleId/payments"
CIRCLE_ID="test-circle-$(date +%s)"
PAYMENT_RESPONSE=$(curl -s -X POST $BASE_URL/payments/circles/$CIRCLE_ID/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":50}')
PAYMENT_ID=$(echo $PAYMENT_RESPONSE | jq -r '.paymentId // empty')
if [ -n "$PAYMENT_ID" ]; then
  echo -e "${GREEN}✅ Create Payment OK${NC}"
  echo "$PAYMENT_RESPONSE" | jq '{paymentId, clientSecret: (.clientSecret | .[0:30] + "...")}'
else
  echo -e "${RED}❌ Create Payment FAILED${NC}"
  echo "$PAYMENT_RESPONSE" | jq .
fi
echo ""

# Test 7: Get Payment Status
if [ -n "$PAYMENT_ID" ]; then
  echo "📊 TEST 7: GET /payments/:paymentId/status"
  PAYMENT_STATUS=$(curl -s -X GET $BASE_URL/payments/$PAYMENT_ID/status \
    -H "Authorization: Bearer $TOKEN")
  if echo "$PAYMENT_STATUS" | jq -e '.status' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Get Payment Status OK${NC}"
    echo "$PAYMENT_STATUS" | jq .
  else
    echo -e "${RED}❌ Get Payment Status FAILED${NC}"
    echo "$PAYMENT_STATUS" | jq .
  fi
  echo ""
fi

# Test 8: Webhook Stripe (sans signature)
echo "🔔 TEST 8: POST /payments/webhooks/stripe (sans signature)"
WEBHOOK_RESPONSE=$(curl -s -X POST $BASE_URL/payments/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"payment_intent.succeeded"}')
if echo "$WEBHOOK_RESPONSE" | jq -e '.statusCode' > /dev/null 2>&1; then
  STATUS_CODE=$(echo "$WEBHOOK_RESPONSE" | jq -r '.statusCode')
  if [ "$STATUS_CODE" = "400" ]; then
    echo -e "${GREEN}✅ Webhook Rejection OK (400 attendu sans signature)${NC}"
    echo "$WEBHOOK_RESPONSE" | jq '{statusCode, message}'
  else
    echo -e "${YELLOW}⚠️  Webhook Response: $STATUS_CODE${NC}"
    echo "$WEBHOOK_RESPONSE" | jq .
  fi
else
  echo -e "${RED}❌ Webhook Test FAILED${NC}"
  echo "$WEBHOOK_RESPONSE" | jq .
fi
echo ""

# Test 9: Metrics
echo "📈 TEST 9: GET /metrics"
METRICS=$(curl -s $BASE_URL/metrics)
if echo "$METRICS" | grep -q "kyc_requests_total"; then
  echo -e "${GREEN}✅ Metrics OK${NC}"
  echo "$METRICS" | grep -E "^(kyc_|payments_)" | head -10
else
  echo -e "${RED}❌ Metrics FAILED${NC}"
fi
echo ""

echo "======================================"
echo -e "${GREEN}✅ TESTS TERMINÉS${NC}"
