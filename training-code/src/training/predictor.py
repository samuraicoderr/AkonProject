"""
Inference module for crop recommendation predictions.
"""
import logging
from pathlib import Path
from typing import Optional, Union

import joblib
import numpy as np
import pandas as pd

from .models import NeuralNetworkModel, RandomForestModel
from .models.base import BaseModel

logger = logging.getLogger(__name__)


class CropPredictor:
    """
    Production-ready predictor for crop recommendations.
    
    Handles model loading, input preprocessing, and prediction.
    """
    
    FEATURE_NAMES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    FEATURE_RANGES = {
        "N": (0, 140),
        "P": (5, 145),
        "K": (5, 205),
        "temperature": (8.83, 43.68),
        "humidity": (14.26, 99.98),
        "ph": (3.5, 9.94),
        "rainfall": (20.21, 298.56),
    }
    
    def __init__(
        self,
        model_path: Union[str, Path],
        preprocessor_path: Union[str, Path],
        model_type: str = "random_forest"
    ):
        """
        Initialize the predictor.
        
        Args:
            model_path: Path to the saved model.
            preprocessor_path: Path to the saved preprocessor.
            model_type: Type of model ('random_forest' or 'neural_network').
        """
        self.model_path = Path(model_path)
        self.preprocessor_path = Path(preprocessor_path)
        self.model_type = model_type
        
        self.model: Optional[BaseModel] = None
        self.scaler = None
        self.label_encoder = None
        self.feature_names: list[str] = []
        self.class_names: list[str] = []
        
        self._load_model()
        self._load_preprocessor()
    
    def _load_model(self) -> None:
        """Load the trained model."""
        logger.info(f"Loading {self.model_type} model from {self.model_path}")
        
        if self.model_type == "random_forest":
            self.model = RandomForestModel.load(self.model_path)
        elif self.model_type == "neural_network":
            self.model = NeuralNetworkModel.load(self.model_path)
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
        
        logger.info("Model loaded successfully")
    
    def _load_preprocessor(self) -> None:
        """Load the preprocessor (scaler and label encoder)."""
        logger.info(f"Loading preprocessor from {self.preprocessor_path}")
        
        preprocessor_data = joblib.load(self.preprocessor_path)
        self.scaler = preprocessor_data["scaler"]
        self.label_encoder = preprocessor_data["label_encoder"]
        self.feature_names = preprocessor_data["feature_names"]
        self.class_names = preprocessor_data["class_names"]
        
        logger.info("Preprocessor loaded successfully")
    
    def _validate_input(self, features: dict[str, float]) -> None:
        """
        Validate input features.
        
        Args:
            features: Dictionary of feature values.
            
        Raises:
            ValueError: If features are invalid.
        """
        # Check for missing features
        missing = set(self.FEATURE_NAMES) - set(features.keys())
        if missing:
            raise ValueError(f"Missing required features: {missing}")
        
        # Validate feature ranges (warn but don't fail)
        for name, value in features.items():
            if name in self.FEATURE_RANGES:
                min_val, max_val = self.FEATURE_RANGES[name]
                if value < min_val or value > max_val:
                    logger.warning(
                        f"Feature '{name}' value {value} is outside expected range "
                        f"[{min_val}, {max_val}]. Predictions may be less reliable."
                    )
    
    def _prepare_features(
        self,
        features: Union[dict[str, float], list[dict[str, float]], pd.DataFrame]
    ) -> np.ndarray:
        """
        Prepare features for prediction.
        
        Args:
            features: Input features in various formats.
            
        Returns:
            Preprocessed feature array.
        """
        # Convert to DataFrame for consistent handling
        if isinstance(features, dict):
            df = pd.DataFrame([features])
        elif isinstance(features, list):
            df = pd.DataFrame(features)
        elif isinstance(features, pd.DataFrame):
            df = features.copy()
        else:
            raise ValueError(f"Unsupported input type: {type(features)}")
        
        # Ensure correct column order
        df = df[self.feature_names]
        
        # Scale features
        X = self.scaler.transform(df.values)
        
        return X
    
    def predict(
        self,
        features: Union[dict[str, float], list[dict[str, float]], pd.DataFrame],
        validate: bool = True
    ) -> Union[str, list[str]]:
        """
        Predict the best crop for given conditions.
        
        Args:
            features: Input features (single dict, list of dicts, or DataFrame).
            validate: Whether to validate input features.
            
        Returns:
            Predicted crop name(s).
        """
        # Validate input
        if validate:
            if isinstance(features, dict):
                self._validate_input(features)
            elif isinstance(features, list):
                for f in features:
                    self._validate_input(f)
        
        # Prepare features
        X = self._prepare_features(features)
        
        # Make predictions
        predictions = self.model.predict(X)
        
        # Decode predictions
        crop_names = self.label_encoder.inverse_transform(predictions)
        
        if len(crop_names) == 1:
            return crop_names[0]
        return list(crop_names)
    
    def predict_proba(
        self,
        features: Union[dict[str, float], list[dict[str, float]], pd.DataFrame],
        validate: bool = True
    ) -> Union[dict[str, float], list[dict[str, float]]]:
        """
        Predict probabilities for all crops.
        
        Args:
            features: Input features.
            validate: Whether to validate input features.
            
        Returns:
            Dictionary mapping crop names to probabilities.
        """
        # Validate input
        if validate:
            if isinstance(features, dict):
                self._validate_input(features)
            elif isinstance(features, list):
                for f in features:
                    self._validate_input(f)
        
        # Prepare features
        X = self._prepare_features(features)
        
        # Get probabilities
        probas = self.model.predict_proba(X)
        
        # Convert to dictionaries
        results = []
        for proba in probas:
            prob_dict = dict(zip(self.class_names, proba.tolist()))
            # Sort by probability (descending)
            prob_dict = dict(sorted(prob_dict.items(), key=lambda x: x[1], reverse=True))
            results.append(prob_dict)
        
        if len(results) == 1:
            return results[0]
        return results
    
    def predict_top_k(
        self,
        features: Union[dict[str, float], list[dict[str, float]], pd.DataFrame],
        k: int = 3,
        validate: bool = True
    ) -> Union[list[tuple[str, float]], list[list[tuple[str, float]]]]:
        """
        Get top-k crop recommendations with probabilities.
        
        Args:
            features: Input features.
            k: Number of top recommendations to return.
            validate: Whether to validate input features.
            
        Returns:
            List of (crop_name, probability) tuples.
        """
        probas = self.predict_proba(features, validate=validate)
        
        if isinstance(probas, dict):
            probas = [probas]
            single_input = True
        else:
            single_input = False
        
        results = []
        for prob_dict in probas:
            top_k = list(prob_dict.items())[:k]
            results.append(top_k)
        
        if single_input:
            return results[0]
        return results
    
    def get_recommendation_report(
        self,
        features: dict[str, float],
        top_k: int = 5
    ) -> dict:
        """
        Generate a comprehensive recommendation report.
        
        Args:
            features: Input features.
            top_k: Number of top recommendations to include.
            
        Returns:
            Detailed recommendation report.
        """
        # Validate input
        self._validate_input(features)
        
        # Get predictions
        best_crop = self.predict(features, validate=False)
        top_recommendations = self.predict_top_k(features, k=top_k, validate=False)
        
        # Build report
        report = {
            "input_conditions": features,
            "recommended_crop": best_crop,
            "confidence": top_recommendations[0][1] if top_recommendations else 0.0,
            "top_recommendations": [
                {"crop": crop, "probability": prob}
                for crop, prob in top_recommendations
            ],
            "model_type": self.model_type,
        }
        
        return report


def load_predictor(
    model_dir: Union[str, Path],
    model_type: str = "random_forest",
    model_timestamp: Optional[str] = None
) -> CropPredictor:
    """
    Convenience function to load a predictor from a model directory.
    
    Args:
        model_dir: Directory containing saved models.
        model_type: Type of model to load.
        model_timestamp: Specific timestamp to load. Uses latest if not provided.
        
    Returns:
        Initialized CropPredictor.
    """
    model_dir = Path(model_dir)
    
    if model_timestamp:
        model_path = model_dir / f"{model_type}_{model_timestamp}"
        preprocessor_path = model_dir / f"preprocessor_{model_timestamp}.joblib"
    else:
        # Find latest model
        model_files = list(model_dir.glob(f"{model_type}_*.joblib"))
        if not model_files:
            raise FileNotFoundError(f"No {model_type} models found in {model_dir}")
        
        latest_model = max(model_files, key=lambda p: p.stat().st_mtime)
        model_path = latest_model.with_suffix("")
        
        # Find corresponding preprocessor - extract timestamp from filename
        # Model filename format: {model_type}_{timestamp}.joblib
        model_stem = model_path.stem  # e.g., "random_forest_20260125_171106"
        # Remove the model_type prefix to get the timestamp
        timestamp = model_stem[len(model_type) + 1:]  # Skip "{model_type}_"
        preprocessor_path = model_dir / f"preprocessor_{timestamp}.joblib"
    
    return CropPredictor(
        model_path=model_path,
        preprocessor_path=preprocessor_path,
        model_type=model_type
    )
