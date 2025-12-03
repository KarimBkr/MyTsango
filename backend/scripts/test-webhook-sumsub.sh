#!/bin/bash

# Script de test pour webhook Sumsub
# Usage: ./scripts/test-webhook-sumsub.sh [applicantId] [correlationId]

set -e

# Configuration
WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:3000/kyc/webhooks/sumsub}"
APPLICANT_ID="${1:-mock-applicant-123}"
CORRELATION_ID="${2:-test-webhook-$(date +%s)}"

# Couleurs pour output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Test Webhook Sumsub${NC}"
echo "URL: $WEBHOOK_URL"
echo "Applicant ID: $APPLICANT_ID"
echo "Correlation ID: $CORRELATION_ID"
echo ""

# Test 1: Webhook APPROVED (GREEN)
echo -e "${YELLOW}Test 1: Webhook APPROVED (GREEN)${NC}"
PAYLOAD_APPROVED=$(cat <<EOF
{
  "applicantId": "$APPLICANT_ID",
  "correlationId": "$CORRELATION_ID-approved",
  "reviewStatus": "completed",
  "reviewResult": {
    "reviewAnswer": "GREEN"
  },
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-payload-digest: mock-signature-dev" \
  -d "$PAYLOAD_APPROVED")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 2: Webhook REJECTED (RED)
echo -e "${YELLOW}Test 2: Webhook REJECTED (RED)${NC}"
PAYLOAD_REJECTED=$(cat <<EOF
{
  "applicantId": "$APPLICANT_ID",
  "correlationId": "$CORRELATION_ID-rejected",
  "reviewStatus": "completed",
  "reviewResult": {
    "reviewAnswer": "RED",
    "rejectLabels": ["DOCUMENT_MISSING", "LOW_QUALITY"]
  },
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-payload-digest: mock-signature-dev" \
  -d "$PAYLOAD_REJECTED")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 3: Webhook PENDING
echo -e "${YELLOW}Test 3: Webhook PENDING${NC}"
PAYLOAD_PENDING=$(cat <<EOF
{
  "applicantId": "$APPLICANT_ID",
  "correlationId": "$CORRELATION_ID-pending",
  "reviewStatus": "pending",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-payload-digest: mock-signature-dev" \
  -d "$PAYLOAD_PENDING")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 4: Idempotence (duplicate webhook)
echo -e "${YELLOW}Test 4: Idempotence (duplicate correlationId)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-payload-digest: mock-signature-dev" \
  -d "$PAYLOAD_APPROVED")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE) - Should be idempotent${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 5: Invalid signature (Phase 2)
echo -e "${YELLOW}Test 5: Invalid signature (Phase 2 - will fail in production)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-payload-digest: invalid-signature" \
  -d "$PAYLOAD_APPROVED")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE) - Signature correctly rejected${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING (HTTP $HTTP_CODE) - Signature validation not implemented yet${NC}"
    echo "Response: $BODY"
fi
echo ""

echo -e "${GREEN}✨ Tests terminés${NC}"
echo ""
echo "Pour vérifier les résultats dans la DB:"
echo "  npx prisma studio"
echo ""
echo "Pour vérifier les métriques:"
echo "  curl http://localhost:3000/metrics | grep kyc"

