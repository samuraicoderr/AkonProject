"""
Data loading and preprocessing utilities for crop recommendation.
"""
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

from .config import DataConfig

logger = logging.getLogger(__name__)


class CropDataLoader:
    """Handles data loading and preprocessing for crop recommendation models."""
    
    def __init__(self, config: Optional[DataConfig] = None):
        """
        Initialize the data loader.
        
        Args:
            config: Data configuration object. Uses defaults if not provided.
        """
        self.config = config or DataConfig()
        self.scaler: Optional[StandardScaler] = None
        self.label_encoder: Optional[LabelEncoder] = None
        self._feature_names: Optional[list[str]] = None
        self._class_names: Optional[list[str]] = None
    
    @property
    def feature_names(self) -> list[str]:
        """Return the feature names used for training."""
        if self._feature_names is None:
            raise ValueError("Data not loaded yet. Call load_data() first.")
        return self._feature_names
    
    @property
    def class_names(self) -> list[str]:
        """Return the class names (crop types)."""
        if self._class_names is None:
            raise ValueError("Data not loaded yet. Call load_data() first.")
        return self._class_names
    
    @property
    def n_features(self) -> int:
        """Return the number of features."""
        return len(self.feature_names)
    
    @property
    def n_classes(self) -> int:
        """Return the number of classes."""
        return len(self.class_names)
    
    def load_data(self, data_path: Optional[Path] = None) -> pd.DataFrame:
        """
        Load the crop recommendation dataset.
        
        Args:
            data_path: Optional path to the data file. Uses config default if not provided.
            
        Returns:
            Loaded DataFrame.
            
        Raises:
            FileNotFoundError: If the data file doesn't exist.
            ValueError: If required columns are missing.
        """
        path = data_path or self.config.data_path
        
        if not path.exists():
            raise FileNotFoundError(f"Data file not found: {path}")
        
        logger.info(f"Loading data from {path}")
        df = pd.read_csv(path)
        
        # Validate columns
        required_cols = self.config.feature_columns + [self.config.target_column]
        missing_cols = set(required_cols) - set(df.columns)
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")
        
        self._feature_names = self.config.feature_columns.copy()
        
        logger.info(f"Loaded {len(df)} samples with {len(self._feature_names)} features")
        logger.info(f"Target classes: {df[self.config.target_column].nunique()} unique crops")
        
        return df
    
    def preprocess(
        self,
        df: pd.DataFrame,
        fit_transformers: bool = True
    ) -> tuple[np.ndarray, np.ndarray]:
        """
        Preprocess the data for model training.
        
        Args:
            df: Input DataFrame.
            fit_transformers: Whether to fit the scaler and encoder (True for training).
            
        Returns:
            Tuple of (features, labels) as numpy arrays.
        """
        # Extract features and target
        X = df[self.config.feature_columns].values
        y = df[self.config.target_column].values
        
        # Handle missing values
        if np.isnan(X).any():
            logger.warning("Found missing values in features. Filling with column means.")
            col_means = np.nanmean(X, axis=0)
            for i in range(X.shape[1]):
                mask = np.isnan(X[:, i])
                X[mask, i] = col_means[i]
        
        # Scale features
        if fit_transformers:
            self.scaler = StandardScaler()
            X = self.scaler.fit_transform(X)
            
            self.label_encoder = LabelEncoder()
            y = self.label_encoder.fit_transform(y)
            self._class_names = list(self.label_encoder.classes_)
        else:
            if self.scaler is None or self.label_encoder is None:
                raise ValueError("Transformers not fitted. Call preprocess with fit_transformers=True first.")
            X = self.scaler.transform(X)
            y = self.label_encoder.transform(y)
        
        logger.info(f"Preprocessed data shape: X={X.shape}, y={y.shape}")
        return X, y
    
    def prepare_splits(
        self,
        df: pd.DataFrame
    ) -> dict[str, tuple[np.ndarray, np.ndarray]]:
        """
        Prepare train, validation, and test splits.
        
        Args:
            df: Input DataFrame.
            
        Returns:
            Dictionary with 'train', 'val', and 'test' splits.
        """
        X, y = self.preprocess(df, fit_transformers=True)
        
        # First split: separate test set
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y,
            test_size=self.config.test_size,
            random_state=self.config.random_state,
            stratify=y
        )
        
        # Second split: separate validation set from training
        val_ratio = self.config.validation_size / (1 - self.config.test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp,
            test_size=val_ratio,
            random_state=self.config.random_state,
            stratify=y_temp
        )
        
        splits = {
            "train": (X_train, y_train),
            "val": (X_val, y_val),
            "test": (X_test, y_test)
        }
        
        for name, (X_split, y_split) in splits.items():
            logger.info(f"{name.capitalize()} set: {len(X_split)} samples")
        
        return splits
    
    def transform_input(self, features: np.ndarray) -> np.ndarray:
        """
        Transform new input features for prediction.
        
        Args:
            features: Input features array.
            
        Returns:
            Scaled features.
        """
        if self.scaler is None:
            raise ValueError("Scaler not fitted. Load and preprocess training data first.")
        return self.scaler.transform(features)
    
    def decode_predictions(self, predictions: np.ndarray) -> list[str]:
        """
        Decode numeric predictions back to crop names.
        
        Args:
            predictions: Numeric predictions array.
            
        Returns:
            List of crop names.
        """
        if self.label_encoder is None:
            raise ValueError("Label encoder not fitted. Load and preprocess training data first.")
        return list(self.label_encoder.inverse_transform(predictions))
