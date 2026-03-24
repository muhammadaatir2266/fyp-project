"""
Pydantic Schemas - Request/Response models for API validation
"""
from typing import List, Optional
from pydantic import BaseModel, Field, validator


class PredictionRequest(BaseModel):
    """Request schema for disease prediction"""
    symptoms: List[str] = Field(
        ...,
        description="List of symptoms",
        example=["fever", "cough", "headache"]
    )
    
    @validator('symptoms')
    def validate_symptoms(cls, v):
        if not v:
            raise ValueError("Symptoms list cannot be empty")
        if not all(isinstance(s, str) for s in v):
            raise ValueError("All symptoms must be strings")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "symptoms": ["fever", "cough", "headache", "fatigue"]
            }
        }


class DiseasePrediction(BaseModel):
    """Single disease prediction with confidence"""
    disease: str = Field(..., description="Disease name")
    confidence: float = Field(..., description="Confidence score (0-1)", ge=0, le=1)


class PredictionResponse(BaseModel):
    """Response schema for disease prediction"""
    predicted_disease: str = Field(..., description="Most likely disease")
    confidence: float = Field(..., description="Confidence score (0-1)", ge=0, le=1)
    top_3_predictions: List[DiseasePrediction] = Field(
        ...,
        description="Top 3 disease predictions with confidence scores"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "predicted_disease": "Flu",
                "confidence": 0.87,
                "top_3_predictions": [
                    {"disease": "Flu", "confidence": 0.87},
                    {"disease": "Common Cold", "confidence": 0.09},
                    {"disease": "COVID-19", "confidence": 0.04}
                ]
            }
        }


class HealthResponse(BaseModel):
    """Response schema for health check"""
    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="Whether model is loaded")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "model_loaded": True
            }
        }


class SymptomsResponse(BaseModel):
    """Response schema for symptoms list"""
    symptoms: List[str] = Field(..., description="List of all available symptoms")
    count: int = Field(..., description="Total number of symptoms")
    
    class Config:
        schema_extra = {
            "example": {
                "symptoms": ["fever", "cough", "headache", "fatigue"],
                "count": 4
            }
        }


class DiseasesResponse(BaseModel):
    """Response schema for diseases list"""
    diseases: List[str] = Field(..., description="List of all possible diseases")
    count: int = Field(..., description="Total number of diseases")
    
    class Config:
        schema_extra = {
            "example": {
                "diseases": ["Flu", "Common Cold", "COVID-19"],
                "count": 3
            }
        }


class ErrorResponse(BaseModel):
    """Response schema for errors"""
    detail: str = Field(..., description="Error message")
    error: Optional[str] = Field(None, description="Additional error details")
    
    class Config:
        schema_extra = {
            "example": {
                "detail": "Invalid input",
                "error": "Symptoms list cannot be empty"
            }
        }
