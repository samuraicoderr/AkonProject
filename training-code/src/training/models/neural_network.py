"""
Neural Network model implementation for crop recommendation.
"""
import json
import logging
from pathlib import Path
from typing import Any, Optional

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
    
    def _create_model(self):
        """Create a new MLP classifier with current config."""
        from sklearn.neural_network import MLPClassifier
        
        return MLPClassifier(
            hidden_layer_sizes=tuple(self.config.hidden_layers),
            activation='relu',
            solver='adam',
            alpha=0.0001,  # L2 regularization
            batch_size=self.config.batch_size,
            learning_rate='adaptive',
            learning_rate_init=self.config.learning_rate,
            max_iter=self.config.epochs,
            early_stopping=True,
            validation_fraction=0.1,
            n_iter_no_change=self.config.early_stopping_patience,
            random_state=self.config.random_state,
            verbose=True
        )
    
    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None
    ) -> dict[str, Any]:
        """
        Train the Neural Network model.
        
        Args:
            X_train: Training features.
            y_train: Training labels.
            X_val: Optional validation features (used for evaluation, not training).
            y_val: Optional validation labels.
            
        Returns:
            Dictionary containing training metrics and history.
        """
        logger.info("Training Neural Network model...")
        logger.info(f"Training set size: {len(X_train)}")
        logger.info(f"Architecture: {self.config.hidden_layers}")
        logger.info(f"Learning rate: {self.config.learning_rate}, Epochs: {self.config.epochs}")
        
        self.model = self._create_model()
        self.model.fit(X_train, y_train)
        
        self._is_trained = True
        
        # Store training history
        self._training_history = {
            "loss": self.model.loss_curve_,
        }
        
        # Calculate metrics
        train_accuracy = self.model.score(X_train, y_train)
        metrics = {
            "train_accuracy": train_accuracy,
            "n_iterations": self.model.n_iter_,
            "final_loss": self.model.loss_,
            "loss_curve": self.model.loss_curve_
        }
        
        if X_val is not None and y_val is not None:
            val_accuracy = self.model.score(X_val, y_val)
            metrics["val_accuracy"] = val_accuracy
            logger.info(f"Training accuracy: {train_accuracy:.4f}, Validation accuracy: {val_accuracy:.4f}")
        else:
            logger.info(f"Training accuracy: {train_accuracy:.4f}")
        
        logger.info(f"Training completed in {self.model.n_iter_} iterations")
        
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
    
    @property
    def training_history(self) -> dict[str, list[float]]:
        """Get the training history."""
        return self._training_history
    
    def save(self, path: Path) -> None:
        """
        Save the model to disk.
        
        Args:
            path: Path to save the model.
        """
        import joblib
        
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
                "hidden_layers": self.config.hidden_layers,
                "dropout_rate": self.config.dropout_rate,
                "learning_rate": self.config.learning_rate,
                "batch_size": self.config.batch_size,
                "epochs": self.config.epochs,
                "early_stopping_patience": self.config.early_stopping_patience,
                "random_state": self.config.random_state,
            },
            "training_history": {
                "loss": self._training_history.get("loss", [])
            },
            "n_iterations": self.model.n_iter_,
            "final_loss": float(self.model.loss_)
        }
        metadata_path = path.with_suffix(".json")
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Model saved to {model_path}")
    
    @classmethod
    def load(cls, path: Path) -> "NeuralNetworkModel":
        """
        Load a model from disk.
        
        Args:
            path: Path to the saved model.
            
        Returns:
            Loaded model instance.
        """
        import joblib
        
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
        
        logger.info(f"Model loaded from {model_path}")
        return instance
