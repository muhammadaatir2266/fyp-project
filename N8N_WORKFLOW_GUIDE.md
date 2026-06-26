# n8n Workflow Configuration Guide

## 1. Patient Chat Webhook (AI Symptom Analysis)

**Webhook URL:** `POST /webhook/<your-webhook-id>`  
Referenced in patient backend `env.example` as `N8N_CHAT_WEBHOOK_URL`.

### Incoming payload from patient backend:
```json
{
  "patient_id": "uuid",
  "session_id": "uuid",
  "conversation_id": "uuid",
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

**`conversation_id` field (n8n chat memory key):**
- Always present in **both** the authenticated and guest payloads — use it as the single **Session Key** for the Postgres Chat Memory node: `{{ $json.conversation_id }}`.
- Authenticated: equals the `ChatSession.id`, unless the session was claimed from a guest, in which case it equals the original guest UUID (`memoryKey`) so the thread continues across signup.
- Guest: equals `guest_session_id`.
- This keeps one durable memory thread per conversation, including across the guest → signup transition.
- Recommended: set the memory node's **Context Window Length** to ~10-20 messages, and periodically prune old rows from `n8n_chat_histories` (never-converted guest threads accumulate otherwise).

**`location` field semantics:**
- Always a **city or locality name** (e.g. `"Karachi"`, `"Chakwal"`, `"Gulberg"`) when possible.
- Priority: patient profile city → Google reverse-geocoded city from GPS → raw `"lat,lng"` fallback.
- `user_info.city` is also included for authenticated patients as an additional reference.
- Use `{{ $json.location }}` in the doctor-lookup node (`city=<location>`).

**Guest chat payload** (`POST /api/chat/guest/message`) uses the same `location` field with the same semantics; `patient_id` and `session_id` are replaced by `guest_session_id`. It also includes `conversation_id` (equal to `guest_session_id`) so the memory node can use the same Session Key expression for guests and authenticated patients.

### n8n workflow nodes:

1. **Webhook Trigger** — receives POST from patient backend
2. **Load Reference Data (HTTP — run once at workflow start or cache in static data)**  
   - Specialties: `GET http://localhost:4000/api/v1/specialties` (admin API, requires API token) — use the `names[]` array for LLM prompt injection  
   - Cities: `GET http://localhost:4000/api/v1/cities` — inject into LLM prompt so it picks an exact city  
   - Alternatively use the public patient API (no token): `GET http://localhost:5000/api/auth/specialties`
3. **OpenAI Chat** — Include the allowed specialty list in the system prompt so the LLM always picks an exact name:  
   > _"You are a medical assistant. Analyze the patient's symptoms conversationally. When you have enough information, identify 1-3 possible conditions with confidence and recommend a specialist. You MUST choose the specialty from this exact list: Cardiology, General Medicine, Pediatrics, Dermatology, Orthopedics, Neurology, Psychiatry, Gastroenterology, Pulmonology, ENT, Urology, Ophthalmology, Obstetrics & Gynecology, Endocrinology, Nephrology, Oncology, Rheumatology, Hematology, Infectious Disease, General Surgery. Do not invent specialty names."_  
   Pass: `{{ $json.message }}` + conversation history
4. **Extract Symptoms** — Parse OpenAI response for symptom list (or use a second OpenAI call with function-calling to extract structured data)
5. **ML Predict (HTTP)** — `POST http://localhost:8000/predict` (or admin API `/api/v1/ml/predict`)  
   Body: `{ "symptoms": ["headache", "fever"] }`  
   Response: `{ "predictions": [{ "disease": "Influenza", "confidence": 0.85 }] }`
6. **Find Doctors (HTTP)** — Use the canonical specialty name from step 3 and city from the patient's location:  
   - Admin API (recommended for n8n/AI agents): `GET http://localhost:4000/api/v1/doctors?specialty=<exact_name>&city=<city>`  
   - Patient API: `GET http://localhost:5000/api/doctors?specialty=<exact_name>&city=<city>`  
   Both accept `?specialty=<canonical_name>` (resolved via aliases — must be exact, no substrings) and `?city=<name>` (case-insensitive substring). Use the city names from `GET /api/v1/cities` for best results.
7. **Respond** — Return structured JSON:
```json
{
  "message": "Based on your symptoms...",
  "prediction": [
    { "disease": "Influenza", "confidence": 0.85, "specialty": "General Medicine" },
    { "disease": "Common Cold", "confidence": 0.65, "specialty": "General Medicine" }
  ],
  "symptoms": ["headache", "fever"],
  "doctors": [
    { "id": "...", "name": "Dr. Sarah Johnson", "specialty": "General Medicine", "city": "Karachi" }
  ]
}
```

> **Important — specialty field format:**
> - On `prediction[]` items: `specialty` is a plain **string** (e.g. `"General Medicine"`), not an object.
> - On `doctors[]` items: `specialty` is also a plain **string** (the canonical name).
> - Both must be exact names from the allowed list above. The patient backend maps them to canonical `Specialty` rows via name or alias matching; unknown names are logged and ignored (no new rows are created).

### Canonical specialty list (as of last seed)

Cardiology, General Medicine, Pediatrics, Dermatology, Orthopedics, Neurology, Psychiatry, Gastroenterology, Pulmonology, ENT, Urology, Ophthalmology, Obstetrics & Gynecology, Endocrinology, Nephrology, Oncology, Rheumatology, Hematology, Infectious Disease, General Surgery

To keep this list up to date, fetch it dynamically at workflow start: `GET /api/auth/specialties` → use the `name` field of each returned specialty.

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
| Patient API | `RETELL_API_KEY` | Retell API key |
| Patient API | `RETELL_AGENT_ID` | Retell voice agent ID |
| Admin API | `ML_SERVICE_URL` | `http://localhost:8000` |
| Doctor API | `VAPI_WEBHOOK_SECRET` | VAPI webhook secret |
| Doctor API | `RETELL_WEBHOOK_SECRET` | Retell webhook signature secret |
| n8n HTTP node | Auth | Internal API token from admin panel |

---

## 4. Retell AI Voice Assistant Setup

The "AI Assistant" button on the doctor cards opens an in-browser Retell voice call. No real phone line is needed.

### 4.1 Retell Dashboard Configuration

1. **Create an agent** in the [Retell Dashboard](https://dashboard.retellai.com/).
2. Copy the **Agent ID** and paste it into `fyp-patient/backend/.env` as `RETELL_AGENT_ID`.
3. Copy an **API Key** and paste it as `RETELL_API_KEY`.
4. Set the **Webhook URL** to `https://<doctor-backend>/api/webhooks/retell`.

### 4.2 Agent Dynamic Variables

The patient backend passes these variables when registering a web call.  
Add them to your agent's **LLM prompt** using `{{variable_name}}` syntax:

| Variable | Example value | Purpose |
|----------|---------------|---------|
| `patient_id` | `uuid-...` | Identifies the patient for booking |
| `intent_id` | `uuid-...` | Booking intent ID (use in `book_appointment` call) |
| `doctor_id` | `uuid-...` | Doctor to book with |
| `patient_name` | `John Doe` | Greet the patient by name |
| `doctor_name` | `Dr. Ahmed Khan` | Tell the patient who they're booking with |
| `doctor_specialty` | `Cardiology` | Context for the agent |

**Example prompt snippet:**
```
You are a medical booking assistant. You are scheduling an appointment with {{doctor_name}} ({{doctor_specialty}}) for {{patient_name}}. Do not ask for the patient's name — you already know it.
```

### 4.3 Agent Custom Functions (Admin API Tools)

Configure these **custom functions** in the Retell agent, authenticated with `Authorization: Bearer <API_TOKEN>` from the admin panel.

| Function | Method | URL |
|----------|--------|-----|
| `get_specialties` | GET | `https://<admin-backend>/api/v1/specialties` |
| `get_cities` | GET | `https://<admin-backend>/api/v1/cities` |
| `find_doctors` | GET | `https://<admin-backend>/api/v1/doctors?specialty={specialty}&city={city}` |
| `get_available_slots` | GET | `https://<admin-backend>/api/v1/doctors/{{doctor_id}}/slots?date={date}` |
| `check_availability` | GET | `https://<admin-backend>/api/v1/doctors/{{doctor_id}}/availability?date={date}&time={time}` |
| `book_appointment` | POST | `https://<admin-backend>/api/v1/doctors/{{doctor_id}}/appointments` |

#### `get_specialties` response:
```json
{
  "success": true,
  "count": 20,
  "specialties": [
    { "id": "uuid", "name": "Cardiology", "description": "Heart and cardiovascular system specialist", "aliases": ["Cardiologist", "Heart Specialist"] }
  ],
  "names": ["Cardiology", "General Medicine", "Pediatrics", "..."]
}
```
Use `names[]` to inject the allowed list into the LLM system prompt. Always call this at agent/workflow start and cache the result — specialties change rarely.

#### `get_cities` response:
```json
{
  "success": true,
  "count": 5,
  "cities": ["Islamabad", "Karachi", "Lahore", "Peshawar", "Rawalpindi"]
}
```
Only cities that have at least one active, approved doctor are returned. Inject this list into the LLM prompt so it picks an exact city name rather than guessing.

#### `find_doctors` query params:
| Param | Type | Notes |
|-------|------|-------|
| `specialty` | string | Must be an exact canonical name (or alias) from `get_specialties` |
| `city` | string | Case-insensitive substring match against doctor city |

Returns:
```json
{
  "success": true,
  "count": 2,
  "doctors": [
    {
      "id": "uuid",
      "name": "Dr. Sarah Johnson",
      "specialty": "Cardiology",
      "city": "Karachi",
      "experience": 15,
      "rating": 4.8,
      "consultationFee": 2000,
      "workingHours": { "from": "09:00", "to": "17:00" },
      "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    }
  ]
}
```

#### `book_appointment` request body for web voice calls:
```json
{
  "patientId": "{{patient_id}}",
  "intentId": "{{intent_id}}",
  "patientName": "{{patient_name}}",
  "date": "2026-06-15",
  "time": "10:00",
  "reason": "Booked via voice assistant"
}
```

Sending `patientId` or `intentId` skips temp-patient creation and links the appointment directly to the logged-in patient. The intent is consumed on first use.

### 4.4 Required Environment Variables

```
# fyp-patient/backend/.env
RETELL_API_KEY=key_xxxxxxxxxxxx
RETELL_AGENT_ID=agent_xxxxxxxxxxxx
```

> `RETELL_PHONE_NUMBER` is no longer used — remove it if present.

---

## 5. ML Service API (Already Built)

Running at `http://localhost:8000`.

| Endpoint | Description |
|----------|-------------|
| `POST /predict` | Body: `{ "symptoms": [...] }` → returns predictions |
| `GET /symptoms` | List all available symptoms |
| `GET /diseases` | List all diseases |
| `GET /health` | Health check |
