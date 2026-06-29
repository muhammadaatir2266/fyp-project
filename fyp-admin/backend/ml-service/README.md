---
title: Disease Prediction API
emoji: 🏥
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
license: mit
---

# DocLink ML Service - Disease Prediction API

A FastAPI-based disease prediction service using CatBoost machine learning model. This API predicts diseases based on provided symptoms.

## Features

- Disease prediction from symptoms using CatBoost ML model
- RESTful API with FastAPI
- Comprehensive symptom and disease database
- Top-K predictions with confidence scores
- Health check endpoint

## API Endpoints

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
Get all available symptoms the model can recognize

### GET /diseases
Get all possible diseases the model can predict

### GET /health
Check service health status

## Model Files

- `models/catboost_disease_model.cbm` - Trained CatBoost model
- `models/label_encoder.pkl` - Label encoder for disease names

## Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
python app.py
```

The service will start on `http://127.0.0.1:5001`

## Docker

Build and run with Docker:
```bash
docker build -t disease-prediction-api .
docker run -p 7860:7860 disease-prediction-api
```

## Integration via Admin API

In production, all ML endpoints are proxied through the admin backend and require an API token:

| Direct ML path | Admin proxy path |
|----------------|-----------------|
| `POST /predict` | `POST /api/v1/ml/predict` |
| `GET /symptoms` | `GET /api/v1/ml/symptoms` |
| `GET /diseases` | `GET /api/v1/ml/diseases` |
| `GET /health` | `GET /api/v1/ml/health` |

Include an `Authorization: Bearer <api-token>` header with every request to the admin proxy. Tokens are generated and managed in the Admin Panel under **API Access**.

The admin backend connects to the ML service using the `ML_SERVICE_URL` environment variable (default: `http://127.0.0.1:5001`).

## Notes

- Model files are loaded on startup and kept in memory for fast predictions
- The API uses CORS middleware for cross-origin requests
- Comprehensive logging for debugging and monitoring
- For standalone deployment, see `DEPLOYMENT.md`
