"""
Base model interface for crop recommendation models.
"""
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

import numpy as np


class BaseModel(ABC):
    """Abstract base class for all crop recommendation models."""
    
    def __init__(
        self,
        n_features: int,
        n_classes: int,
        class_names: Optional[list[str]] = None
    ):
        """
        Initialize the base model.
        
        Args:
            n_features: Number of input features.
            n_classes: Number of output classes.
            class_names: Optional list of class names.
        """
        self.n_features = n_features
        self.n_classes = n_classes
        self.class_names = class_names
        self._is_trained = False
    
    @property
    def is_trained(self) -> bool:
        """Check if the model has been trained."""
        return self._is_trained
    
    @abstractmethod
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions.
        
        Args:
            X: Input features.
            
        Returns:
            Predicted class indices.
        """
        pass
    
    @abstractmethod
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Predict class probabilities.
        
        Args:
            X: Input features.
            
        Returns:
            Class probabilities for each sample.
        """
        pass
    
    @classmethod
    @abstractmethod
    def load(cls, path: Path) -> "BaseModel":
        """
        Load a model from disk.
        
        Args:
            path: Path to the saved model.
            
        Returns:
            Loaded model instance.
        """
        pass
    
    def get_top_predictions(
        self,
        X: np.ndarray,
        top_k: int = 3
    ) -> list[list[tuple[str, float]]]:
        """
        Get top-k predictions with probabilities.
        
        Args:
            X: Input features.
            top_k: Number of top predictions to return.
            
        Returns:
            List of top-k (class_name, probability) tuples for each sample.
        """
        if self.class_names is None:
            raise ValueError("Class names not set.")
        
        probas = self.predict_proba(X)
        results = []
        
        for proba in probas:
            top_indices = np.argsort(proba)[::-1][:top_k]
            top_preds = [
                (self.class_names[idx], float(proba[idx]))
                for idx in top_indices
            ]
            results.append(top_preds)
        
        return results
