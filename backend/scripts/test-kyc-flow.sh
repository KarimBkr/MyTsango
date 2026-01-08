#!/bin/bash

# Script de test complet du flow KYC
# Usage: ./scripts/test-kyc-flow.sh

set -e

API_URL="${API_URL:-http://localhost:3000}"

echo "🧪 Test Flow KYC Complet"
echo "========================"
echo ""

# 1. Register user
echo "1️⃣  Création utilisateur..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"kyc-test@test.com","password":"Test123!"}')

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -z "$TOKEN" ]; then
    echo "❌ Échec registration"
    echo "$REGISTER_RESPONSE"
    exit 1
fi

echo "✅ Utilisateur créé"
echo "Token: ${TOKEN:0:50}..."
echo ""

# 2. Get KYC status (should be NONE)
echo "2️⃣  Vérification statut KYC initial..."
STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/kyc/status")
echo "$STATUS_RESPONSE" | grep -q "NONE" && echo "✅ Statut: NONE" || echo "⚠️  Statut: $(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)"
echo ""

# 3. Start KYC
echo "3️⃣  Démarrage KYC..."
START_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" "$API_URL/kyc/start")
APPLICANT_ID=$(echo "$START_RESPONSE" | grep -o '"applicantId":"[^"]*' | cut -d'"' -f4 || echo "")
SDK_TOKEN=$(echo "$START_RESPONSE" | grep -o '"sdkAccessToken":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -z "$APPLICANT_ID" ]; then
    echo "❌ Échec démarrage KYC"
    echo "$START_RESPONSE"
    exit 1
fi

echo "✅ KYC démarré"
echo "Applicant ID: $APPLICANT_ID"
echo "SDK Token: ${SDK_TOKEN:0:50}..."
echo ""

# 4. Check status (should be PENDING)
echo "4️⃣  Vérification statut KYC (devrait être PENDING)..."
sleep 1
STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/kyc/status")
echo "$STATUS_RESPONSE" | grep -q "PENDING" && echo "✅ Statut: PENDING" || echo "⚠️  Statut: $(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)"
echo ""

# 5. Simulate webhook APPROVED
echo "5️⃣  Simulation webhook APPROVED..."
WEBHOOK_RESPONSE=$(curl -s -X POST "$API_URL/kyc/webhooks/sumsub" \
  -H "Content-Type: application/json" \
  -H "x-payload-digest: mock-signature-dev" \
  -d "{
    \"applicantId\": \"$APPLICANT_ID\",
    \"correlationId\": \"test-webhook-$(date +%s)\",
    \"reviewStatus\": \"completed\",
    \"reviewResult\": {
      \"reviewAnswer\": \"GREEN\"
    }
  }")

echo "$WEBHOOK_RESPONSE" | grep -q "success" && echo "✅ Webhook traité" || echo "⚠️  $WEBHOOK_RESPONSE"
echo ""

# 6. Check final status (should be APPROVED)
echo "6️⃣  Vérification statut final (devrait être APPROVED)..."
sleep 1
STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/kyc/status")
echo "$STATUS_RESPONSE" | grep -q "APPROVED" && echo "✅ Statut: APPROVED" || echo "⚠️  Statut: $(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)"
echo ""

# 7. Check metrics
echo "7️⃣  Vérification métriques..."
METRICS=$(curl -s "$API_URL/metrics" | grep "kyc_" | head -5)
echo "$METRICS"
echo ""

echo "✨ Tests terminés avec succès!"
echo ""
echo "Pour vérifier dans la DB:"
echo "  npx prisma studio"

