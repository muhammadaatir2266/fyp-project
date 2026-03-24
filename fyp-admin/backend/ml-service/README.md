# Trimed Al ML Service - Disease Prediction API

This is the Machine Learning service for disease prediction using CatBoost model.

## Setup

1. Install Python 3.8 or higher

2. Install dependencies:
```bash
cd fyp-admin/backend/ml-service
pip install -r requirements.txt
```

3. Run the service:
```bash
python app.py
```

The ML service will start on `http://127.0.0.1:5001`

## Model Files

- `models/catboost_disease_model.cbm` - Trained CatBoost model
- `models/label_encoder.pkl` - Label encoder for disease names

## API Endpoints

All endpoints are accessed through the Node.js backend at `/api/v1/ml/*` with API token authentication.

### POST /predict
Predict disease from symptoms

**Request:**
```json
{
  "symptoms": ["fever", "cough", "headache"]
}
```

**Response:**
```json
{
  "predicted_disease": "Flu",
  "confidence": 0.87,
  "top_3_predictions": [
    {"disease": "Flu", "confidence": 0.87},
    {"disease": "Common Cold", "confidence": 0.09},
    {"disease": "COVID-19", "confidence": 0.04}
  ]
}
```

### GET /symptoms
Get all available symptoms

### GET /diseases
Get all possible diseases

### GET /health
Check service health status

## Integration

The ML service runs independently and is accessed by the Node.js backend through HTTP requests. The Node.js backend handles:
- API token authentication
- Request logging
- Error handling
- Response formatting

## Notes

- The service must be running for ML predictions to work
- The Node.js backend will return a 503 error if the ML service is unavailable
- Model files are loaded on startup and kept in memory for fast predictions
