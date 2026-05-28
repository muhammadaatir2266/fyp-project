# n8n Workflow Configuration Guide

## 1. Patient Chat Webhook (AI Symptom Analysis)

**Webhook URL:** `POST /webhook/<your-webhook-id>`  
Referenced in patient backend `env.example` as `N8N_CHAT_WEBHOOK_URL`.

### Incoming payload from patient backend:
```json
{
  "patient_id": "uuid",
  "session_id": "uuid",
  "message": "I have a headache and fever",
  "user_info": {
    "email": "patient@example.com",
    "firstName": "John",
    "city": "Karachi",
    "medicalHistory": "...",
    "allergies": "..."
  },
  "location": "Karachi",
  "timestamp": "2026-05-25T12:00:00Z"
}
```

### n8n workflow nodes:

1. **Webhook Trigger** — receives POST from patient backend
2. **OpenAI Chat** — System prompt: _"You are a medical assistant. Analyze the patient's symptoms conversationally. Ask follow-up questions if unclear. When you have enough info, identify 1-3 possible conditions with confidence and recommend a specialist."_  
   Pass: `{{ $json.message }}` + conversation history from previous messages if available
3. **Extract Symptoms** — Parse OpenAI response for symptom list (or use a second OpenAI call with function-calling to extract structured data)
4. **ML Predict (HTTP)** — `POST http://localhost:8000/predict` (or admin API `/api/v1/ml/predict`)  
   Body: `{ "symptoms": ["headache", "fever"] }`  
   Response: `{ "predictions": [{ "disease": "Influenza", "confidence": 0.85 }] }`
5. **Find Doctors (HTTP)** — `GET http://localhost:5000/api/doctors?specialty=<recommended>&city=<location>`  
   (Use patient API; add a service API token or make it internal)
6. **Respond** — Return structured JSON:
```json
{
  "message": "Based on your symptoms...",
  "prediction": [
    { "disease": "Influenza", "confidence": 0.85 },
    { "disease": "Common Cold", "confidence": 0.65 }
  ],
  "symptoms": ["headache", "fever"],
  "doctors": [
    { "id": "...", "fullName": "Sarah Johnson", "specialty": { "name": "General Medicine" }, "city": "Karachi" }
  ]
}
```

---

## 2. Doctor Calling Agent (VAPI / Retell)

The calling agent handles **inbound calls** to a doctor's virtual number.

### Flow:
1. Patient calls doctor's VAPI phone number
2. VAPI agent answers using the configured AI agent
3. Agent uses VAPI's tool-calling / function calls to:
   - Check doctor availability: `GET http://admin-api:4000/api/v1/doctors/:id/slots?date=YYYY-MM-DD`
   - Book appointment: `POST http://admin-api:4000/api/v1/doctors/:id/appointments`  
     (requires API token set in admin panel)
4. At end of call, VAPI sends **end-of-call report webhook** to:  
   `POST http://doctor-api:5001/api/webhooks/vapi`
5. Doctor backend creates `CallLog` + optional `Appointment` (source: `CALLING_AGENT`)

### VAPI Agent Configuration:
- **First message:** "Hello, you've reached Dr. [Name]'s office. I'm the AI assistant. How can I help you today?"
- **System prompt:** "You are a virtual receptionist for Dr. [Name], a [Specialty] doctor. Check availability and book appointments. Always confirm the caller's name and phone number. After booking, read back the appointment details."
- **Tools:** Add HTTP tools for slot checking and booking (point to admin API `/api/v1/*` with API token header)
- **Webhook URL:** `http://doctor-api:5001/api/webhooks/vapi`
- **Metadata to include:** `{ "doctorId": "<doctor-uuid>" }`

### Retell Alternative:
- Point webhook to `POST http://doctor-api:5001/api/webhooks/retell`
- Same metadata structure

---

## 3. Environment Variables Summary

| Service | Variable | Value |
|---------|----------|-------|
| Patient API | `N8N_CHAT_WEBHOOK_URL` | n8n webhook URL |
| Patient API | `ML_MODEL_API_URL` | `http://localhost:8000` |
| Admin API | `ML_SERVICE_URL` | `http://localhost:8000` |
| Doctor API | `VAPI_WEBHOOK_SECRET` | VAPI webhook secret |
| n8n HTTP node | Auth | Internal API token from admin panel |

---

## 4. ML Service API (Already Built)

Running at `http://localhost:8000`.

| Endpoint | Description |
|----------|-------------|
| `POST /predict` | Body: `{ "symptoms": [...] }` → returns predictions |
| `GET /symptoms` | List all available symptoms |
| `GET /diseases` | List all diseases |
| `GET /health` | Health check |
