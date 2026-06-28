"""
Configuration settings for model training.
"""
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class DataConfig:
    """Configuration for data loading and preprocessing."""
    data_path: Path = Path("data/processed/crop_recommendation.csv")
    test_size: float = 0.2
    validation_size: float = 0.1
    random_state: int = 42
    feature_columns: list[str] = field(default_factory=lambda: [
        "N", "P", "K", "temperature", "humidity", "ph", "rainfall"
    ])
    target_column: str = "label"


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


@dataclass
class TrainingConfig:
    """Main training configuration."""
    data: DataConfig = field(default_factory=DataConfig)
    random_forest: RandomForestConfig = field(default_factory=RandomForestConfig)
    neural_network: NeuralNetworkConfig = field(default_factory=NeuralNetworkConfig)
    model_output_dir: Path = Path("models")
    log_dir: Path = Path("logs")
    
    def __post_init__(self):
        """Ensure output directories exist."""
        self.model_output_dir.mkdir(parents=True, exist_ok=True)
        self.log_dir.mkdir(parents=True, exist_ok=True)
