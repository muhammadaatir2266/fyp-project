# Starting Trimed Al Admin Services

This guide explains how to start both the Node.js backend and ML service.

## Prerequisites

1. Node.js installed
2. Python 3.8+ installed
3. Dependencies installed for both services

## Installation

### Node.js Backend
```bash
cd fyp-admin/backend
npm install
```

### ML Service
```bash
cd fyp-admin/backend/ml-service
pip install -r requirements.txt
```

## Starting Services

You need to run BOTH services in separate terminals:

### Terminal 1: Node.js Backend
```bash
cd fyp-admin/backend
npm run dev
```
This starts the main API server on port 4000

### Terminal 2: ML Service
```bash
cd fyp-admin/backend/ml-service
python app.py
```
This starts the ML prediction service on port 5001

## Verification

1. Check Node.js backend: http://localhost:4000/health
2. Check ML service through backend: http://localhost:4000/api/v1/ml/health (requires API token)

## API Access

1. Open http://localhost:3002 (Admin Frontend)
2. Login to admin panel
3. Go to "API Access" page
4. Generate an API token
5. Use the token to access ML endpoints:
   - POST /api/v1/ml/predict
   - GET /api/v1/ml/symptoms
   - GET /api/v1/ml/diseases
   - GET /api/v1/ml/health

## Troubleshooting

### ML Service Not Available
- Make sure Python service is running on port 5001
- Check `fyp-admin/backend/.env` has `ML_SERVICE_URL=http://127.0.0.1:5001`
- Verify model files exist in `fyp-admin/backend/ml-service/models/`

### Model Loading Errors
- Ensure `catboost_disease_model.cbm` exists in models folder
- Ensure `label_encoder.pkl` exists in models folder
- Check Python dependencies are installed correctly

## Production Deployment

For production, consider:
1. Using PM2 or similar process manager for Node.js
2. Using systemd or supervisor for Python service
3. Setting up proper logging
4. Configuring firewall rules
5. Using environment variables for configuration
