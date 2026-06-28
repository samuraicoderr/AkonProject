"""
Neural Network model implementation for crop recommendation.
"""
import json
import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np

from ..config import NeuralNetworkConfig
from .base import BaseModel

logger = logging.getLogger(__name__)


class NeuralNetworkModel(BaseModel):
    """Neural Network classifier for crop recommendation using scikit-learn MLPClassifier."""
    
    def __init__(
        self,
        n_features: int,
        n_classes: int,
        class_names: Optional[list[str]] = None,
        config: Optional[NeuralNetworkConfig] = None
    ):
        """
        Initialize the Neural Network model.
        
        Args:
            n_features: Number of input features.
            n_classes: Number of output classes.
            class_names: Optional list of class names.
            config: Model configuration.
        """
        super().__init__(n_features, n_classes, class_names)
        self.config = config or NeuralNetworkConfig()
        self.model = None
        self._training_history: dict[str, list[float]] = {}
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions.
        
        Args:
            X: Input features.
            
        Returns:
            Predicted class indices.
        """
        if not self._is_trained or self.model is None:
            raise ValueError("Model not trained. Load a model first.")
        return self.model.predict(X)
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Predict class probabilities.
        
        Args:
            X: Input features.
            
        Returns:
            Class probabilities for each sample.
        """
        if not self._is_trained or self.model is None:
            raise ValueError("Model not trained. Load a model first.")
        return self.model.predict_proba(X)
    
    @property
    def training_history(self) -> dict[str, list[float]]:
        """Get the training history."""
        return self._training_history
    
    @classmethod
    def load(cls, path: Path) -> "NeuralNetworkModel":
        """
        Load a model from disk.
        
        Args:
            path: Path to the saved model.
            
        Returns:
            Loaded model instance.
        """
        path = Path(path)
        model_path = path.with_suffix(".joblib")
        metadata_path = path.with_suffix(".json")
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        # Load metadata
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        
        # Create config from metadata
        config = NeuralNetworkConfig(**metadata["config"])
        
        # Create instance
        instance = cls(
            n_features=metadata["n_features"],
            n_classes=metadata["n_classes"],
            class_names=metadata["class_names"],
            config=config
        )
        
        # Load the sklearn model
        instance.model = joblib.load(model_path)
        instance._is_trained = True
        instance._training_history = metadata.get("training_history", {})
        
        logger.info(f"NeuralNetwork model loaded from {model_path}")
        return instance
