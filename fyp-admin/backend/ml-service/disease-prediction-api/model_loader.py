"""
Model Loader - Handles loading of trained model and encoder
"""
import os
import pickle
import logging
from pathlib import Path
from typing import Optional
from catboost import CatBoostClassifier
from huggingface_hub import hf_hub_download

logger = logging.getLogger(__name__)


class ModelLoader:
    """Loads and manages the trained CatBoost model and label encoder"""
    
    def __init__(self, model_path: str, encoder_path: str):
        """
        Initialize model loader
        
        Args:
            model_path: Path to the trained CatBoost model (.cbm file)
            encoder_path: Path to the label encoder (.pkl file)
        """
        self.model_path = model_path
        self.encoder_path = encoder_path
        self.model: Optional[CatBoostClassifier] = None
        self.encoder = None
        self.feature_names: Optional[list] = None
        
    def load(self) -> None:
        """
        Load model and encoder from disk or Hugging Face Hub
        
        Raises:
            FileNotFoundError: If model or encoder files don't exist
            Exception: If loading fails
        """
        # Check if we should load from Hugging Face Hub
        repo_id = os.getenv("HF_MODEL_REPO")
        
        if repo_id:
            logger.info(f"Loading model from Hugging Face Hub: {repo_id}")
            try:
                # Download model files from Hub
                model_file = hf_hub_download(repo_id=repo_id, filename="catboost_disease_model.cbm")
                encoder_file = hf_hub_download(repo_id=repo_id, filename="label_encoder.pkl")
                
                # Load CatBoost model
                self.model = CatBoostClassifier()
                self.model.load_model(model_file)
                
                # Get feature names from model
                self.feature_names = self.model.feature_names_
                logger.info(f"Model loaded from Hub with {len(self.feature_names)} features")
                
                # Load label encoder
                with open(encoder_file, 'rb') as f:
                    self.encoder = pickle.load(f)
                
                logger.info(f"Encoder loaded from Hub with {len(self.encoder.classes_)} classes")
                return
                
            except Exception as e:
                logger.error(f"Failed to load from Hugging Face Hub: {str(e)}")
                raise Exception(f"Model loading from Hub failed: {str(e)}")
        
        # Load from local files (fallback)
        # Check if files exist
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Model file not found: {self.model_path}. "
                "Please ensure the trained model exists or set HF_MODEL_REPO environment variable."
            )
        
        if not os.path.exists(self.encoder_path):
            raise FileNotFoundError(
                f"Encoder file not found: {self.encoder_path}. "
                "Please ensure the label encoder exists or set HF_MODEL_REPO environment variable."
            )
        
        try:
            # Load CatBoost model
            logger.info(f"Loading model from {self.model_path}")
            self.model = CatBoostClassifier()
            self.model.load_model(self.model_path)
            
            # Get feature names from model
            self.feature_names = self.model.feature_names_
            logger.info(f"Model loaded with {len(self.feature_names)} features")
            
            # Load label encoder
            logger.info(f"Loading encoder from {self.encoder_path}")
            with open(self.encoder_path, 'rb') as f:
                self.encoder = pickle.load(f)
            
            logger.info(f"Encoder loaded with {len(self.encoder.classes_)} classes")
            
        except Exception as e:
            logger.error(f"Failed to load model or encoder: {str(e)}")
            raise Exception(f"Model loading failed: {str(e)}")
    
    def is_loaded(self) -> bool:
        """Check if model and encoder are loaded"""
        return self.model is not None and self.encoder is not None
