"""
Random Forest model implementation for crop recommendation.
"""
import json
import logging
from pathlib import Path
from typing import Any, Optional

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
    
    def _create_model(self) -> RandomForestClassifier:
        """Create a new Random Forest classifier with current config."""
        return RandomForestClassifier(
            n_estimators=self.config.n_estimators,
            max_depth=self.config.max_depth,
            min_samples_split=self.config.min_samples_split,
            min_samples_leaf=self.config.min_samples_leaf,
            max_features=self.config.max_features,
            bootstrap=self.config.bootstrap,
            random_state=self.config.random_state,
            n_jobs=self.config.n_jobs,
            class_weight=self.config.class_weight,
            verbose=1
        )
    
    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None
    ) -> dict[str, Any]:
        """
        Train the Random Forest model.
        
        Args:
            X_train: Training features.
            y_train: Training labels.
            X_val: Optional validation features.
            y_val: Optional validation labels.
            
        Returns:
            Dictionary containing training metrics.
        """
        logger.info("Training Random Forest model...")
        logger.info(f"Training set size: {len(X_train)}")
        logger.info(f"Config: n_estimators={self.config.n_estimators}, max_depth={self.config.max_depth}")
        
        self.model = self._create_model()
        self.model.fit(X_train, y_train)
        
        self._feature_importances = self.model.feature_importances_
        self._is_trained = True
        
        # Calculate metrics
        train_accuracy = self.model.score(X_train, y_train)
        metrics = {
            "train_accuracy": train_accuracy,
            "n_estimators": self.config.n_estimators,
            "feature_importances": self._feature_importances.tolist()
        }
        
        if X_val is not None and y_val is not None:
            val_accuracy = self.model.score(X_val, y_val)
            metrics["val_accuracy"] = val_accuracy
            logger.info(f"Training accuracy: {train_accuracy:.4f}, Validation accuracy: {val_accuracy:.4f}")
        else:
            logger.info(f"Training accuracy: {train_accuracy:.4f}")
        
        return metrics
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions.
        
        Args:
            X: Input features.
            
        Returns:
            Predicted class indices.
        """
        if not self._is_trained or self.model is None:
            raise ValueError("Model not trained. Call train() first.")
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
            raise ValueError("Model not trained. Call train() first.")
        return self.model.predict_proba(X)
    
    def get_feature_importances(self, feature_names: Optional[list[str]] = None) -> dict[str, float]:
        """
        Get feature importances.
        
        Args:
            feature_names: Optional list of feature names.
            
        Returns:
            Dictionary mapping feature names to importance scores.
        """
        if self._feature_importances is None:
            raise ValueError("Model not trained. Call train() first.")
        
        if feature_names is None:
            feature_names = [f"feature_{i}" for i in range(len(self._feature_importances))]
        
        importance_dict = dict(zip(feature_names, self._feature_importances))
        return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
    
    def save(self, path: Path) -> None:
        """
        Save the model to disk.
        
        Args:
            path: Path to save the model.
        """
        if not self._is_trained or self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save the sklearn model
        model_path = path.with_suffix(".joblib")
        joblib.dump(self.model, model_path)
        
        # Save metadata
        metadata = {
            "n_features": self.n_features,
            "n_classes": self.n_classes,
            "class_names": self.class_names,
            "config": {
                "n_estimators": self.config.n_estimators,
                "max_depth": self.config.max_depth,
                "min_samples_split": self.config.min_samples_split,
                "min_samples_leaf": self.config.min_samples_leaf,
                "max_features": self.config.max_features,
                "bootstrap": self.config.bootstrap,
                "random_state": self.config.random_state,
            },
            "feature_importances": self._feature_importances.tolist() if self._feature_importances is not None else None
        }
        metadata_path = path.with_suffix(".json")
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Model saved to {model_path}")
    
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
        instance._feature_importances = np.array(metadata["feature_importances"]) if metadata["feature_importances"] else None
        
        logger.info(f"Model loaded from {model_path}")
        return instance
