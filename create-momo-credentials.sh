#!/bin/bash
# Create New MTN MoMo API User and API Key
# Run this to generate fresh credentials for sandbox

echo "=========================================="
echo "🔧 MTN MoMo API User Creator"
echo "=========================================="
echo ""

# Load subscription key from .env
if [ -f .env ]; then
  export $(cat .env | grep MOMO_SUBSCRIPTION_KEY | xargs)
else
  echo "❌ .env file not found!"
  exit 1
fi

if [ -z "$MOMO_SUBSCRIPTION_KEY" ]; then
  echo "❌ MOMO_SUBSCRIPTION_KEY not found in .env"
  exit 1
fi

echo "📋 Using Subscription Key: ${MOMO_SUBSCRIPTION_KEY:0:10}...${MOMO_SUBSCRIPTION_KEY: -4}"
echo ""

# Generate new UUID for API User
if command -v uuidgen &> /dev/null; then
  API_USER=$(uuidgen | tr '[:upper:]' '[:lower:]')
else
  # Fallback: generate UUID using Python
  API_USER=$(python3 -c "import uuid; print(str(uuid.uuid4()))")
fi

echo "🆔 Generated API User: $API_USER"
echo ""

# Step 1: Create API User
echo "📝 Step 1: Creating API User..."
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  "https://sandbox.momodeveloper.mtn.com/v1_0/apiuser" \
  -H "X-Reference-Id: $API_USER" \
  -H "Ocp-Apim-Subscription-Key: $MOMO_SUBSCRIPTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "providerCallbackHost": "webhook.site"
  }')

CREATE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)
CREATE_STATUS=$(echo "$CREATE_RESPONSE" | tail -n 1)

if [ "$CREATE_STATUS" == "201" ] || [ "$CREATE_STATUS" == "200" ]; then
  echo "   ✅ API User created successfully!"
elif [ "$CREATE_STATUS" == "409" ]; then
  echo "   ⚠️  API User already exists (using existing)"
elif [ "$CREATE_STATUS" == "401" ]; then
  echo "   ❌ FAILED: Invalid subscription key"
  echo "   Response: $CREATE_BODY"
  echo ""
  echo "   Please update your MOMO_SUBSCRIPTION_KEY in .env"
  echo "   Get it from: https://momodeveloper.mtn.com/"
  exit 1
else
  echo "   ❌ FAILED: Unexpected response (HTTP $CREATE_STATUS)"
  echo "   Response: $CREATE_BODY"
  exit 1
fi
echo ""

# Step 2: Generate API Key
echo "🔑 Step 2: Generating API Key..."
sleep 2  # Wait for API User to be fully created

KEY_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  "https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/$API_USER/apikey" \
  -H "Ocp-Apim-Subscription-Key: $MOMO_SUBSCRIPTION_KEY")

KEY_BODY=$(echo "$KEY_RESPONSE" | head -n -1)
KEY_STATUS=$(echo "$KEY_RESPONSE" | tail -n 1)

if [ "$KEY_STATUS" == "201" ] || [ "$KEY_STATUS" == "200" ]; then
  API_KEY=$(echo "$KEY_BODY" | grep -o '"apiKey":"[^"]*"' | cut -d'"' -f4)
  
  if [ -z "$API_KEY" ]; then
    # Try alternative JSON parsing
    API_KEY=$(echo "$KEY_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('apiKey', ''))" 2>/dev/null)
  fi
  
  if [ -n "$API_KEY" ]; then
    echo "   ✅ API Key generated successfully!"
    echo ""
    echo "=========================================="
    echo "✅ New Credentials Generated!"
    echo "=========================================="
    echo ""
    echo "📋 Copy these to your .env file:"
    echo ""
    echo "MOMO_API_USER=$API_USER"
    echo "MOMO_API_KEY=$API_KEY"
    echo ""
    echo "=========================================="
    echo ""
    echo "📝 Quick Update Command:"
    echo ""
    echo "# Backup current .env"
    echo "cp .env .env.backup"
    echo ""
    echo "# Update credentials (manual edit required)"
    echo "nano .env"
    echo ""
    echo "# Or use sed to auto-update:"
    echo "sed -i 's/MOMO_API_USER=.*/MOMO_API_USER=$API_USER/' .env"
    echo "sed -i 's/MOMO_API_KEY=.*/MOMO_API_KEY=$API_KEY/' .env"
    echo ""
    echo "# Restart payment server"
    echo "pkill -f payment-server.js && npm run payment"
    echo ""
  else
    echo "   ⚠️  Could not parse API Key from response"
    echo "   Raw response: $KEY_BODY"
  fi
else
  echo "   ❌ FAILED: Could not generate API Key (HTTP $KEY_STATUS)"
  echo "   Response: $KEY_BODY"
  exit 1
fi
