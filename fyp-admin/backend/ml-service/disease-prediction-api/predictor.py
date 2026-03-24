"""
Disease Predictor - Handles prediction logic and preprocessing
"""
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any
from catboost import CatBoostClassifier

logger = logging.getLogger(__name__)


class DiseasePredictor:
    """Handles disease prediction from symptoms"""
    
    def __init__(self, model: CatBoostClassifier, encoder, feature_names: List[str]):
        """
        Initialize predictor
        
        Args:
            model: Trained CatBoost model
            encoder: Label encoder for disease names
            feature_names: List of feature/symptom names
        """
        self.model = model
        self.encoder = encoder
        self.feature_names = feature_names
        
        # Create symptom to index mapping for faster lookup
        self.symptom_to_idx = {
            symptom.lower().strip(): idx 
            for idx, symptom in enumerate(feature_names)
        }
        
        logger.info(f"Predictor initialized with {len(feature_names)} symptoms")
    
    def preprocess_symptoms(self, symptoms: List[str]) -> np.ndarray:
        """
        Convert symptom list to model input format
        
        Args:
            symptoms: List of symptom names
            
        Returns:
            Binary feature vector for model input
            
        Raises:
            ValueError: If no valid symptoms provided
        """
        # Initialize feature vector with zeros
        feature_vector = np.zeros(len(self.feature_names))
        
        # Track valid and invalid symptoms
        valid_symptoms = []
        invalid_symptoms = []
        
        # Set 1 for present symptoms
        for symptom in symptoms:
            symptom_clean = symptom.lower().strip()
            
            if symptom_clean in self.symptom_to_idx:
                idx = self.symptom_to_idx[symptom_clean]
                feature_vector[idx] = 1
                valid_symptoms.append(symptom)
            else:
                invalid_symptoms.append(symptom)
        
        # Log warnings for invalid symptoms
        if invalid_symptoms:
            logger.warning(f"Invalid symptoms ignored: {invalid_symptoms}")
        
        if not valid_symptoms:
            raise ValueError(
                f"No valid symptoms found. Provided: {symptoms}. "
                f"Please use symptoms from the /symptoms endpoint."
            )
        
        logger.info(f"Preprocessed {len(valid_symptoms)} valid symptoms")
        
        return feature_vector.reshape(1, -1)
    
    def predict(self, symptoms: List[str], top_k: int = 3) -> Dict[str, Any]:
        """
        Predict disease from symptoms
        
        Args:
            symptoms: List of symptom names
            top_k: Number of top predictions to return
            
        Returns:
            Dictionary with prediction results
        """
        # Preprocess symptoms
        X = self.preprocess_symptoms(symptoms)
        
        # Get prediction probabilities
        probabilities = self.model.predict_proba(X)[0]
        
        # Get top k predictions
        top_indices = np.argsort(probabilities)[::-1][:top_k]
        top_probs = probabilities[top_indices]
        
        # Decode disease names
        top_diseases = self.encoder.inverse_transform(top_indices)
        
        # Format results
        top_predictions = [
            {
                "disease": disease,
                "confidence": float(prob)
            }
            for disease, prob in zip(top_diseases, top_probs)
        ]
        
        result = {
            "predicted_disease": top_diseases[0],
            "confidence": float(top_probs[0]),
            "top_3_predictions": top_predictions
        }
        
        return result
    
    def get_symptoms(self) -> List[str]:
        """Get list of all available symptoms"""
        return sorted(self.feature_names)
    
    def get_diseases(self) -> List[str]:
        """Get list of all possible diseases"""
        return sorted(self.encoder.classes_.tolist())
