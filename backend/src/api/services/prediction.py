"""
Prediction service for crop recommendation.

This module provides a singleton service that manages model loading
and prediction logic, keeping it separate from API concerns.
"""
import logging
from pathlib import Path
from threading import Lock
from typing import Optional

from ..ml import CropPredictor
from ..ml.predictor import load_predictor

logger = logging.getLogger(__name__)


class PredictionService:
    """
    Singleton service for crop prediction.
    
    Manages model lifecycle and provides prediction methods.
    Thread-safe model loading with lazy initialization.
    """
    
    _instance: Optional["PredictionService"] = None
    _lock: Lock = Lock()
    
    # Model directory - trained models stored in the ml folder
    _MODEL_DIR = Path(__file__).resolve().parent.parent / "ml" / "trained_models"
    
    def __new__(cls) -> "PredictionService":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self) -> None:
        if self._initialized:
            return
        
        self._random_forest: Optional[CropPredictor] = None
        self._neural_network: Optional[CropPredictor] = None
        self._model_lock = Lock()
        self._initialized = True
        
        logger.info("PredictionService initialized")
    
    @property
    def random_forest(self) -> CropPredictor:
        """Lazy-load Random Forest model."""
        if self._random_forest is None:
            with self._model_lock:
                if self._random_forest is None:
                    logger.info("Loading Random Forest model...")
                    self._random_forest = load_predictor(
                        model_dir=self._MODEL_DIR,
                        model_type="random_forest"
                    )
                    logger.info("Random Forest model loaded successfully")
        return self._random_forest
    
    @property
    def neural_network(self) -> CropPredictor:
        """Lazy-load Neural Network model."""
        if self._neural_network is None:
            with self._model_lock:
                if self._neural_network is None:
                    logger.info("Loading Neural Network model...")
                    self._neural_network = load_predictor(
                        model_dir=self._MODEL_DIR,
                        model_type="neural_network"
                    )
                    logger.info("Neural Network model loaded successfully")
        return self._neural_network
    
    def get_predictor(self, model_type: str = "random_forest") -> CropPredictor:
        """
        Get the predictor for the specified model type.
        
        Args:
            model_type: Either 'random_forest' or 'neural_network'
            
        Returns:
            The appropriate CropPredictor instance
            
        Raises:
            ValueError: If model_type is invalid
        """
        if model_type == "random_forest":
            return self.random_forest
        elif model_type == "neural_network":
            return self.neural_network
        else:
            raise ValueError(f"Invalid model type: {model_type}. Must be 'random_forest' or 'neural_network'")
    
    def predict(
        self,
        features: dict[str, float],
        model_type: str = "random_forest"
    ) -> str:
        """
        Predict the best crop for given conditions.
        
        Args:
            features: Dictionary with keys N, P, K, temperature, humidity, ph, rainfall
            model_type: Model to use for prediction
            
        Returns:
            Predicted crop name
        """
        predictor = self.get_predictor(model_type)
        return predictor.predict(features)
    
    def predict_top_k(
        self,
        features: dict[str, float],
        k: int = 3,
        model_type: str = "random_forest"
    ) -> list[tuple[str, float]]:
        """
        Get top-k crop recommendations with probabilities.
        
        Args:
            features: Input features
            k: Number of recommendations
            model_type: Model to use
            
        Returns:
            List of (crop_name, probability) tuples
        """
        predictor = self.get_predictor(model_type)
        return predictor.predict_top_k(features, k=k)
    
    def get_recommendation_report(
        self,
        features: dict[str, float],
        top_k: int = 5,
        model_type: str = "random_forest"
    ) -> dict:
        """
        Generate a comprehensive recommendation report.
        
        Args:
            features: Input features
            top_k: Number of top recommendations
            model_type: Model to use
            
        Returns:
            Detailed recommendation report
        """
        predictor = self.get_predictor(model_type)
        return predictor.get_recommendation_report(features, top_k=top_k)
    
    @property
    def feature_names(self) -> list[str]:
        """Get the list of required feature names."""
        return CropPredictor.FEATURE_NAMES
    
    @property
    def feature_ranges(self) -> dict[str, tuple[float, float]]:
        """Get the valid ranges for each feature."""
        return CropPredictor.FEATURE_RANGES
    
    @property
    def available_models(self) -> list[str]:
        """Get list of available model types."""
        return ["random_forest", "neural_network"]
    
    def health_check(self) -> dict:
        """
        Check if models are loaded and operational.
        
        Returns:
            Health status dictionary
        """
        status = {
            "status": "healthy",
            "models": {}
        }
        
        try:
            # Check Random Forest
            _ = self.random_forest
            status["models"]["random_forest"] = "loaded"
        except Exception as e:
            status["models"]["random_forest"] = f"error: {str(e)}"
            status["status"] = "degraded"
        
        try:
            # Check Neural Network
            _ = self.neural_network
            status["models"]["neural_network"] = "loaded"
        except Exception as e:
            status["models"]["neural_network"] = f"error: {str(e)}"
            status["status"] = "degraded"
        
        if all(v == "error" for v in status["models"].values()):
            status["status"] = "unhealthy"
        
        return status


# Module-level singleton instance
prediction_service = PredictionService()
