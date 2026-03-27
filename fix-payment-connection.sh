#!/bin/bash
# Quick Fix for Payment Connection Error in GitHub Codespaces
# This script helps diagnose and fix the port forwarding issue

echo "=========================================="
echo "🔧 Payment Server Connection Diagnostics"
echo "=========================================="
echo ""

# Check if we're in a Codespace
if [ -z "$CODESPACE_NAME" ]; then
  echo "❌ Not running in GitHub Codespaces"
  echo "   If you're running locally, use: http://localhost:3001"
  exit 1
fi

echo "✅ Running in GitHub Codespaces"
echo "   Codespace: $CODESPACE_NAME"
echo ""

# Display URLs
echo "📍 Your URLs:"
echo "   Frontend:    https://${CODESPACE_NAME}-3000.app.github.dev"
echo "   Payment API: https://${CODESPACE_NAME}-3001.app.github.dev"
echo ""

# Check if port 3001 is running locally
echo "🔍 Checking if payment server is running..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "   ✅ Payment server is running on port 3001"
else
  echo "   ❌ Payment server NOT running on port 3001"
  echo "   Run: npm run payment"
  exit 1
fi
echo ""

# Test local access
echo "🔍 Testing local access..."
LOCAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/payments/test)
if [ "$LOCAL_RESPONSE" -eq 200 ] || [ "$LOCAL_RESPONSE" -eq 401 ]; then
  echo "   ✅ Server responds locally (HTTP $LOCAL_RESPONSE)"
else
  echo "   ⚠️  Unexpected response: HTTP $LOCAL_RESPONSE"
fi
echo ""

# Test Codespace URL access
echo "🔍 Testing Codespace URL access..."
CODESPACE_URL="https://${CODESPACE_NAME}-3001.app.github.dev/api/payments/test"
CODESPACE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$CODESPACE_URL" 2>&1)

if [ "$CODESPACE_RESPONSE" -eq 401 ]; then
  echo "   ❌ Port 3001 is PRIVATE (HTTP 401 - Authentication Required)"
  echo ""
  echo "=========================================="
  echo "⚠️  ACTION REQUIRED: Make Port 3001 Public"
  echo "=========================================="
  echo ""
  echo "The payment server is running but port 3001 is not publicly accessible."
  echo "Your browser cannot connect to it because it requires authentication."
  echo ""
  echo "📋 Fix Steps:"
  echo ""
  echo "1. Look at the BOTTOM of your VS Code window"
  echo "2. Find the 'PORTS' tab (next to 'TERMINAL')"
  echo "3. Click on the 'PORTS' tab"
  echo "4. Find port 3001 in the list"
  echo "5. Right-click on port 3001"
  echo "6. Select 'Port Visibility' → 'Public'"
  echo "7. Wait 5 seconds"
  echo "8. Try your payment again!"
  echo ""
  echo "Visual Guide:"
  echo "   PORTS Tab Layout:"
  echo "   ┌──────────────────────────────────────────────────┐"
  echo "   │ Port │ Running Process │ Visibility │ Actions   │"
  echo "   ├──────────────────────────────────────────────────┤"
  echo "   │ 3000 │ npm             │ 🌍 Public  │ ...       │"
  echo "   │ 3001 │ node            │ 🔒 Private │ <-- THIS! │"
  echo "   └──────────────────────────────────────────────────┘"
  echo ""
  echo "After making port 3001 public, it should show:"
  echo "   │ 3001 │ node            │ 🌍 Public  │           │"
  echo ""
elif [ "$CODESPACE_RESPONSE" -eq 200 ]; then
  echo "   ✅ Port 3001 is PUBLIC (HTTP $CODESPACE_RESPONSE)"
  echo ""
  echo "=========================================="
  echo "✅ Everything looks good!"
  echo "=========================================="
  echo ""
  echo "If you're still getting connection errors:"
  echo "1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
  echo "2. Check browser console for detailed errors"
  echo "3. Verify you're accessing:"
  echo "   $CODESPACE_URL"
  echo ""
else
  echo "   ⚠️  Unexpected response: HTTP $CODESPACE_RESPONSE"
  echo ""
  echo "Port may be blocked or server not responding correctly."
fi

echo ""
echo "=========================================="
echo "🧪 Quick Test"
echo "=========================================="
echo ""
echo "Run this in your browser console to test:"
echo ""
echo "fetch('${CODESPACE_URL}').then(r => console.log('Status:', r.status))"
echo ""
