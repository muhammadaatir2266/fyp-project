# Testing Guide — Trimed Al

## E2E Test Scenarios (Report Chapter 7: Testing)

Based on Requirements Traceability Matrix (Table 3.1) and Use Case "Patient Symptom Analysis and Doctor Recommendation".

---

### Test Flow 1 — Patient Registration & Profile (FR-01 prerequisite)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1.1 | Open http://localhost:3000 → click Sign Up | Signup page loads |
| 1.2 | Fill name, email, password → submit | Redirected to patient dashboard |
| 1.3 | Navigate to Profile → fill city, medical history | Data saved; toast confirmation shown |
| 1.4 | Reload page | Profile fields persist from DB |

---

### Test Flow 2 — AI Chat Symptom Analysis (FR-01, FR-02, FR-03)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | Click "Start Symptom Check" on dashboard | Chat page loads |
| 2.2 | Type "I have a severe headache and fever for 2 days" → send | AI responds conversationally |
| 2.3 | Follow up with more symptoms as prompted | Conversation continues |
| 2.4 | n8n workflow fires ML predict | Yellow prediction card appears (e.g. "Influenza 85%") |
| 2.5 | Doctor recommendation cards appear | "Book" button links to appointments with doctorId |
| 2.6 | Navigate to Symptom Log | Logged symptoms visible |
| 2.7 | Navigate to History | Chat session with predictions visible |

---

### Test Flow 3 — Book Appointment (FR-05)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.1 | Click "Book" on doctor recommendation card in chat | Appointments page opens pre-filled |
| 3.2 | Select tomorrow's date | Available time slots appear |
| 3.3 | Select 10:00 AM → Confirm | Appointment created; "Next Appointment" on dashboard updates |
| 3.4 | Navigate to Find a Specialist → search "Cardiology" | Doctor cards listed |
| 3.5 | Book another appointment | Conflict detected if same slot |
| 3.6 | Cancel an appointment | Status changes to CANCELLED |

---

### Test Flow 4 — Doctor Dashboard (FR-05 doctor side)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.1 | Open http://localhost:3001 → login as doctor@mediassist.com | Doctor dashboard loads |
| 4.2 | Dashboard stats show today's appointments count | Real count from DB |
| 4.3 | Navigate to Appointments | List shows patient-booked appointments |
| 4.4 | Click patient → view profile | Patient symptoms and predictions visible |
| 4.5 | Update appointment status to CONFIRMED | Status updates in patient portal too |

---

### Test Flow 5 — Calling Agent (FR-04)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5.1 | Simulate VAPI end-of-call POST to http://localhost:5001/api/webhooks/vapi | 200 OK returned |
| 5.2 | Doctor navigates to Call Logs | New call log entry visible |
| 5.3 | Call with appointmentBooked=true in metadata | Appointment created with source=CALLING_AGENT |

**Sample VAPI webhook test payload:**
```bash
curl -X POST http://localhost:5001/api/webhooks/vapi \
  -H "Content-Type: application/json" \
  -H "x-vapi-secret: your_secret" \
  -d '{
    "message": {
      "type": "end-of-call-report",
      "durationSeconds": 180,
      "summary": "Patient called to book appointment for chest pain",
      "transcript": "Patient: I have chest pain...",
      "call": {
        "id": "test-call-001",
        "customer": { "number": "+923001234567", "name": "Ahmed Khan" },
        "metadata": { "doctorId": "<doctor-uuid-from-db>" }
      }
    }
  }'
```

---

### Test Flow 6 — Marketing Website Links

| Step | Action | Expected Result |
|------|--------|-----------------|
| 6.1 | Open http://localhost:3003 | Landing page loads |
| 6.2 | Click "Get Started as Patient" | Redirects to http://localhost:3000/signup |
| 6.3 | Click "Join as a Doctor" | Redirects to http://localhost:3001/signup |
| 6.4 | Click "Login" on website nav | Redirects to patient login at :3000 |

---

## NFR Tests

| Requirement | Test | Expected |
|-------------|------|----------|
| Performance | Load chat endpoint under 5 concurrent users | Response < 5s (excluding n8n latency) |
| Security | Try accessing /api/doctors without auth token | 401 Unauthorized |
| Security | Try accessing /api/doctor/patients without token | 401 Unauthorized |
| Availability | Restart patient-api while frontend is open | Frontend shows error; reconnects after restart |

---

## RTM Verification

| ID | Requirement | Status |
|----|-------------|--------|
| FR-01 | Patient chatbot interaction | ✅ n8n chat + OpenAI |
| FR-02 | Symptom analysis using ML | ✅ ML service + predictions persisted |
| FR-03 | Doctor recommendation | ✅ Doctor cards in chat + /doctors search |
| FR-04 | Automated call handling | ✅ VAPI webhook → CallLog |
| FR-05 | Appointment management | ✅ Book/cancel/view in patient + doctor portal |
| NFR-01 | Usability | ✅ Consistent Tailwind UI across all portals |
| NFR-02 | Security | ✅ JWT auth, bcrypt, Helmet, CORS |
