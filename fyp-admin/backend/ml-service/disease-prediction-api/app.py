"""
Trimed Al ML Service - Disease Prediction API
Integrated with Node.js backend authentication
"""
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from model_loader import ModelLoader
from predictor import DiseasePredictor
from schemas import (
    PredictionRequest,
    PredictionResponse,
    HealthResponse,
    SymptomsResponse,
    DiseasesResponse
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global instances
model_loader: ModelLoader = None
predictor: DiseasePredictor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup, cleanup on shutdown"""
    global model_loader, predictor
    
    try:
        logger.info("Loading model and encoder...")
        model_loader = ModelLoader(
            model_path="models/catboost_disease_model.cbm",
            encoder_path="models/label_encoder.pkl"
        )
        model_loader.load()
        
        predictor = DiseasePredictor(
            model=model_loader.model,
            encoder=model_loader.encoder,
            feature_names=model_loader.feature_names
        )
        
        logger.info("Model loaded successfully!")
        logger.info(f"Available diseases: {len(predictor.get_diseases())}")
        logger.info(f"Available symptoms: {len(predictor.get_symptoms())}")
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        raise
    
    yield
    
    # Cleanup
    logger.info("Shutting down...")


# Initialize FastAPI app
app = FastAPI(
    title="Trimed Al ML Service",
    description="Disease prediction API using CatBoost ML model",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS - allow requests from any origin for Hugging Face deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for public API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "Internal server error", "error": str(exc)}
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the ML service is running and model is loaded"""
    try:
        is_loaded = model_loader is not None and predictor is not None
        return HealthResponse(
            status="healthy" if is_loaded else "unhealthy",
            model_loaded=is_loaded
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unhealthy"
        )


@app.post("/predict", response_model=PredictionResponse)
async def predict_disease(request: PredictionRequest):
    """
    Predict disease based on provided symptoms
    
    - **symptoms**: List of symptom names (e.g., ["fever", "cough", "headache"])
    
    Returns the predicted disease with confidence score and top 3 predictions
    """
    try:
        if not request.symptoms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Symptoms list cannot be empty"
            )
        
        logger.info(f"Prediction request with {len(request.symptoms)} symptoms")
        
        result = predictor.predict(request.symptoms, top_k=3)
        
        logger.info(f"Prediction successful: {result['predicted_disease']}")
        
        return PredictionResponse(**result)
        
    except ValueError as e:
        logger.warning(f"Invalid input: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@app.get("/symptoms", response_model=SymptomsResponse)
async def get_symptoms():
    """Get list of all symptoms that the model can recognize"""
    try:
        symptoms = predictor.get_symptoms()
        return SymptomsResponse(
            symptoms=symptoms,
            count=len(symptoms)
        )
    except Exception as e:
        logger.error(f"Failed to get symptoms: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve symptoms"
        )


@app.get("/diseases", response_model=DiseasesResponse)
async def get_diseases():
    """Get list of all diseases that the model can predict"""
    try:
        diseases = predictor.get_diseases()
        return DiseasesResponse(
            diseases=diseases,
            count=len(diseases)
        )
    except Exception as e:
        logger.error(f"Failed to get diseases: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve diseases"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=5001,
        reload=True,
        log_level="info"
    )
