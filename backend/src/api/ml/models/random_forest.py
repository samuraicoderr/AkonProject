"""
Random Forest model implementation for crop recommendation.
"""
import json
import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier

from ..config import RandomForestConfig
from .base import BaseModel

logger = logging.getLogger(__name__)


class RandomForestModel(BaseModel):
    """Random Forest classifier for crop recommendation."""
    
    def __init__(
        self,
        n_features: int,
        n_classes: int,
        class_names: Optional[list[str]] = None,
        config: Optional[RandomForestConfig] = None
    ):
        """
        Initialize the Random Forest model.
        
        Args:
            n_features: Number of input features.
            n_classes: Number of output classes.
            class_names: Optional list of class names.
            config: Model configuration.
        """
        super().__init__(n_features, n_classes, class_names)
        self.config = config or RandomForestConfig()
        self.model: Optional[RandomForestClassifier] = None
        self._feature_importances: Optional[np.ndarray] = None
    
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
    
    def get_feature_importances(
        self,
        feature_names: Optional[list[str]] = None
    ) -> dict[str, float]:
        """
        Get feature importances.
        
        Args:
            feature_names: Optional list of feature names.
            
        Returns:
            Dictionary mapping feature names to importance scores.
        """
        if self._feature_importances is None:
            raise ValueError("Model not trained. Load a model first.")
        
        if feature_names is None:
            feature_names = [f"feature_{i}" for i in range(len(self._feature_importances))]
        
        importance_dict = dict(zip(feature_names, self._feature_importances))
        return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
    
    @classmethod
    def load(cls, path: Path) -> "RandomForestModel":
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
        config = RandomForestConfig(**metadata["config"])
        
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
        instance._feature_importances = (
            np.array(metadata["feature_importances"]) 
            if metadata.get("feature_importances") else None
        )
        
        logger.info(f"RandomForest model loaded from {model_path}")
        return instance
