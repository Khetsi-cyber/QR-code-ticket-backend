#!/bin/bash

# ========================================
# MTN MoMo Payment Integration Setup Script
# ========================================

echo "=========================================="
echo "MTN MoMo Payment Integration Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "Step 1: Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 14+ first"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} npm found: $(npm --version)"

echo ""
echo "Step 2: Installing backend dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi

echo ""
echo "Step 3: Installing frontend dependencies..."
cd frontend
npm install axios
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi
cd ..

echo ""
echo "Step 4: Checking environment variables..."
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Creating .env file from template..."
    cat > .env << 'EOF'
# Supabase Configuration
SUPABASE_URL=https://auimupbmquhgpkluvpyg.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here

# MTN MoMo Payment Configuration (Sandbox)
MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MOMO_SUBSCRIPTION_KEY=ad4de2e226f24573be8a465a5e9c7150
MOMO_API_USER=612b796e-cadf-4967-b020-14d725735206
MOMO_API_KEY=75f02d0ef0b947ee82a35ca9fb066a86
MOMO_ENVIRONMENT=sandbox
MOMO_CURRENCY=SZL
MOMO_CALLBACK_URL=http://localhost:3001/api/payments/callback
EOF
    echo -e "${YELLOW}⚠${NC}  Please update .env with your Supabase credentials"
else
    if grep -q "MOMO_SUBSCRIPTION_KEY" .env; then
        echo -e "${GREEN}✓${NC} MTN MoMo credentials found in .env"
    else
        echo -e "${YELLOW}⚠${NC}  MTN MoMo credentials not found in .env"
        echo "Please add them manually"
    fi
fi

echo ""
echo "Step 5: Checking frontend environment..."
if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠${NC}  frontend/.env not found"
    echo "Creating frontend/.env..."
    cat > frontend/.env << 'EOF'
REACT_APP_SUPABASE_URL=https://auimupbmquhgpkluvpyg.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
REACT_APP_PAYMENT_API_URL=http://localhost:3001/api/payments
EOF
    echo -e "${YELLOW}⚠${NC}  Please update frontend/.env with your Supabase credentials"
else
    if grep -q "REACT_APP_PAYMENT_API_URL" frontend/.env; then
        echo -e "${GREEN}✓${NC} Payment API URL found in frontend/.env"
    else
        echo "REACT_APP_PAYMENT_API_URL=http://localhost:3001/api/payments" >> frontend/.env
        echo -e "${GREEN}✓${NC} Added payment API URL to frontend/.env"
    fi
fi

echo ""
echo "Step 6: Testing payment service..."
echo "Starting payment test..."

# Start payment server in background for test
node payment-server.js &
SERVER_PID=$!
sleep 3

# Test the service
TEST_RESULT=$(curl -s http://localhost:3001/api/payments/test 2>&1)
if echo "$TEST_RESULT" | grep -q "success"; then
    echo -e "${GREEN}✓${NC} Payment service is working!"
    echo "Response: $TEST_RESULT"
else
    echo -e "${RED}❌ Payment service test failed${NC}"
    echo "This is normal if you haven't run CREATE_PAYMENTS_TABLE.sql yet"
fi

# Kill test server
kill $SERVER_PID 2>/dev/null

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo -e "${YELLOW}1.${NC} Run CREATE_PAYMENTS_TABLE.sql in Supabase SQL Editor"
echo "   File: ./CREATE_PAYMENTS_TABLE.sql"
echo ""
echo -e "${YELLOW}2.${NC} Run database fix for user registration:"
echo "   File: ./FIX_REGISTRATION_ERROR.sql"
echo ""
echo -e "${YELLOW}3.${NC} Start the payment server:"
echo "   ${GREEN}npm run payment${NC}"
echo ""
echo -e "${YELLOW}4.${NC} In a new terminal, start the frontend:"
echo "   ${GREEN}cd frontend && npm start${NC}"
echo ""
echo -e "${YELLOW}5.${NC} Test the payment flow:"
echo "   - Login as a passenger"
echo "   - Select a route and seat"
echo "   - Click 'Proceed to Payment'"
echo "   - Enter phone number: 76001234"
echo "   - Wait for payment approval (auto in sandbox)"
echo ""
echo "Documentation: ./MTN_MOMO_INTEGRATION_GUIDE.md"
echo ""
echo "=========================================="
