#!/bin/bash
# MTN MoMo Credentials Tester
# Tests if your MTN MoMo sandbox credentials are valid

echo "=========================================="
echo "🧪 MTN MoMo Credentials Test"
echo "=========================================="
echo ""

# Load .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | grep MOMO | xargs)
else
  echo "❌ .env file not found!"
  exit 1
fi

echo "📋 Current Credentials:"
echo "   Base URL: $MOMO_BASE_URL"
echo "   Subscription Key: ${MOMO_SUBSCRIPTION_KEY:0:10}...${MOMO_SUBSCRIPTION_KEY: -4}"
echo "   API User: ${MOMO_API_USER:0:8}...${MOMO_API_USER: -8}"
echo "   API Key: ${MOMO_API_KEY:0:8}...${MOMO_API_KEY: -8}"
echo "   Environment: $MOMO_ENVIRONMENT"
echo ""

# Test 1: Check if subscription key is valid
echo "🔍 Test 1: Checking Subscription Key..."
SUBSCRIPTION_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET \
  "$MOMO_BASE_URL/collection/v1_0/accountbalance" \
  -H "Authorization: Bearer dummy" \
  -H "Ocp-Apim-Subscription-Key: $MOMO_SUBSCRIPTION_KEY" \
  -H "X-Target-Environment: $MOMO_ENVIRONMENT" 2>&1)

if [ "$SUBSCRIPTION_TEST" == "401" ]; then
  echo "   ❌ FAILED: Invalid subscription key"
  echo "   Error: Access denied - subscription key is not valid or expired"
  echo ""
  echo "   📝 Action Required:"
  echo "   1. Visit https://momodeveloper.mtn.com/"
  echo "   2. Go to your Collections subscription"
  echo "   3. Get your Primary Key (subscription key)"
  echo "   4. Update MOMO_SUBSCRIPTION_KEY in .env"
  echo ""
  exit 1
elif [ "$SUBSCRIPTION_TEST" == "000" ]; then
  echo "   ⚠️  WARNING: Cannot reach MTN MoMo servers"
  echo "   Check your internet connection"
  exit 1
else
  echo "   ✅ PASSED: Subscription key is valid (HTTP $SUBSCRIPTION_TEST)"
fi
echo ""

# Test 2: Try to get access token
echo "🔍 Test 2: Testing API User & API Key..."
AUTH_STRING=$(echo -n "$MOMO_API_USER:$MOMO_API_KEY" | base64)
TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  "$MOMO_BASE_URL/collection/token/" \
  -H "Authorization: Basic $AUTH_STRING" \
  -H "Ocp-Apim-Subscription-Key: $MOMO_SUBSCRIPTION_KEY")

# Split response and status code
TOKEN_BODY=$(echo "$TOKEN_RESPONSE" | head -n -1)
TOKEN_STATUS=$(echo "$TOKEN_RESPONSE" | tail -n 1)

if [ "$TOKEN_STATUS" == "200" ]; then
  echo "   ✅ PASSED: Successfully obtained access token"
  ACCESS_TOKEN=$(echo "$TOKEN_BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  echo "   Token: ${ACCESS_TOKEN:0:20}..."
  echo ""
  echo "=========================================="
  echo "✅ All Tests Passed!"
  echo "=========================================="
  echo ""
  echo "Your MTN MoMo credentials are VALID and working!"
  echo ""
  echo "Next steps:"
  echo "   1. Make sure payment server is running: npm run payment"
  echo "   2. Make port 3001 public in Codespaces"
  echo "   3. Test a payment with number: 46733123450"
  echo ""
elif [ "$TOKEN_STATUS" == "401" ]; then
  echo "   ❌ FAILED: Invalid API User or API Key"
  echo "   Error: Authentication failed"
  echo ""
  echo "   📝 Action Required:"
  echo "   Your subscription key is valid, but API User/Key is not."
  echo ""
  echo "   Option 1 - Create new API credentials:"
  echo "   Run this command to create new API User:"
  echo ""
  echo "   API_USER=\$(uuidgen)"
  echo "   curl -X POST $MOMO_BASE_URL/v1_0/apiuser \\"
  echo "     -H \"X-Reference-Id: \$API_USER\" \\"
  echo "     -H \"Ocp-Apim-Subscription-Key: $MOMO_SUBSCRIPTION_KEY\" \\"
  echo "     -H \"Content-Type: application/json\" \\"
  echo "     -d '{\"providerCallbackHost\": \"webhook.site\"}'"
  echo ""
  echo "   Then create API Key:"
  echo "   curl -X POST $MOMO_BASE_URL/v1_0/apiuser/\$API_USER/apikey \\"
  echo "     -H \"Ocp-Apim-Subscription-Key: $MOMO_SUBSCRIPTION_KEY\""
  echo ""
  echo "   Update .env with new \$API_USER and the returned API Key"
  echo ""
  exit 1
else
  echo "   ❌ FAILED: Unexpected response (HTTP $TOKEN_STATUS)"
  echo "   Response: $TOKEN_BODY"
  exit 1
fi
