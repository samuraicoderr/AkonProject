"""
Configuration dataclasses for ML models.
"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class RandomForestConfig:
    """Configuration for Random Forest model."""
    n_estimators: int = 100
    max_depth: Optional[int] = None
    min_samples_split: int = 2
    min_samples_leaf: int = 1
    max_features: str = "sqrt"
    bootstrap: bool = True
    random_state: int = 42
    n_jobs: int = -1
    class_weight: Optional[str] = "balanced"


@dataclass
class NeuralNetworkConfig:
    """Configuration for Neural Network model."""
    hidden_layers: list[int] = field(default_factory=lambda: [128, 64, 32])
    dropout_rate: float = 0.3
    learning_rate: float = 0.001
    batch_size: int = 32
    epochs: int = 100
    early_stopping_patience: int = 10
    random_state: int = 42
