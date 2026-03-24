#!/bin/bash

# API Testing Script for Calling Agent Endpoints
# Make this file executable: chmod +x test-api.sh

BASE_URL="http://localhost:5000/api/public"
DOCTOR_ID="YOUR_DOCTOR_ID_HERE"  # Replace with actual doctor ID

echo "=================================="
echo "Testing Calling Agent API"
echo "=================================="
echo ""

# Test 1: Get all doctors
echo "1. Testing GET /doctors"
echo "-----------------------------------"
curl -s "$BASE_URL/doctors" | json_pp
echo ""
echo ""

# Test 2: Check availability
echo "2. Testing GET /doctors/:id/availability"
echo "-----------------------------------"
DATE=$(date -d "+1 day" +%Y-%m-%d)  # Tomorrow's date
TIME="14:30"
curl -s "$BASE_URL/doctors/$DOCTOR_ID/availability?date=$DATE&time=$TIME" | json_pp
echo ""
echo ""

# Test 3: Get available slots
echo "3. Testing GET /doctors/:id/slots"
echo "-----------------------------------"
curl -s "$BASE_URL/doctors/$DOCTOR_ID/slots?date=$DATE" | json_pp
echo ""
echo ""

# Test 4: Book appointment
echo "4. Testing POST /doctors/:id/appointments"
echo "-----------------------------------"
curl -s -X POST "$BASE_URL/doctors/$DOCTOR_ID/appointments" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientName\": \"Test Patient\",
    \"patientPhone\": \"+1234567890\",
    \"patientEmail\": \"test@example.com\",
    \"date\": \"$DATE\",
    \"time\": \"$TIME\",
    \"reason\": \"Test appointment\"
  }" | json_pp
echo ""
echo ""

echo "=================================="
echo "Testing Complete"
echo "=================================="
