#!/bin/bash

# Quick Test Script for Email Notifications
# This script tests the email notification system

echo "=========================================="
echo "Email Notification Test"
echo "=========================================="
echo ""

# Test the email service once
echo "Testing email service (processing queue once)..."
echo ""

node email-service.js once

echo ""
echo "=========================================="
echo "Test Instructions"
echo "=========================================="
echo ""
echo "To fully test the system:"
echo ""
echo "1. Make sure React app is running (npm start in frontend/)"
echo ""
echo "2. Login as a passenger"
echo ""
echo "3. Submit an enquiry"
echo "   - Go to Enquiry section"
echo "   - Fill in the form"
echo "   - Submit"
echo ""
echo "4. Check console output:"
echo "   - Run: node email-service.js once"
echo "   - You should see email to admin logged"
echo ""
echo "5. Login as admin"
echo ""
echo "6. Respond to the enquiry"
echo "   - Go to Enquiries management"
echo "   - Click 'Respond' on the enquiry"
echo "   - Enter response and submit"
echo ""
echo "7. Check console output again:"
echo "   - Run: node email-service.js once"
echo "   - You should see email to passenger logged"
echo ""
echo "To run email service continuously:"
echo "   node email-service.js service"
echo ""
