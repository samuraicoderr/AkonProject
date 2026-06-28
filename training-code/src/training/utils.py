"""
Utility functions for crop recommendation training.
"""
import json
import logging
from pathlib import Path
from typing import Any, Optional

import numpy as np

logger = logging.getLogger(__name__)


def set_random_seeds(seed: int = 42) -> None:
    """
    Set random seeds for reproducibility.
    
    Args:
        seed: Random seed value.
    """
    import random
    random.seed(seed)
    np.random.seed(seed)
    
    logger.info(f"Random seeds set to {seed}")


def save_json(data: dict[str, Any], path: Path) -> None:
    """
    Save dictionary to JSON file.
    
    Args:
        data: Dictionary to save.
        path: Output file path.
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    
    logger.debug(f"Saved JSON to {path}")


def load_json(path: Path) -> dict[str, Any]:
    """
    Load dictionary from JSON file.
    
    Args:
        path: Input file path.
        
    Returns:
        Loaded dictionary.
    """
    with open(path, "r") as f:
        return json.load(f)


class NumpyEncoder(json.JSONEncoder):
    """JSON encoder that handles numpy types."""
    
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


def format_metrics(metrics: dict[str, float], precision: int = 4) -> str:
    """
    Format metrics dictionary as a string.
    
    Args:
        metrics: Dictionary of metric names to values.
        precision: Number of decimal places.
        
    Returns:
        Formatted string.
    """
    lines = []
    for name, value in metrics.items():
        if isinstance(value, float):
            lines.append(f"  {name}: {value:.{precision}f}")
        else:
            lines.append(f"  {name}: {value}")
    return "\n".join(lines)


def get_class_distribution(y: np.ndarray, class_names: Optional[list[str]] = None) -> dict[str, int]:
    """
    Get the distribution of classes in the labels.
    
    Args:
        y: Label array.
        class_names: Optional list of class names.
        
    Returns:
        Dictionary mapping class names to counts.
    """
    unique, counts = np.unique(y, return_counts=True)
    
    if class_names is not None:
        return {class_names[i]: int(count) for i, count in zip(unique, counts)}
    return {str(i): int(count) for i, count in zip(unique, counts)}


def print_model_summary(model_name: str, metrics: dict[str, Any]) -> None:
    """
    Print a formatted model summary.
    
    Args:
        model_name: Name of the model.
        metrics: Dictionary of metrics.
    """
    print(f"\n{'=' * 50}")
    print(f"Model: {model_name}")
    print("=" * 50)
    
    for key, value in metrics.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.4f}")
        elif isinstance(value, list) and len(value) > 5:
            print(f"  {key}: [{value[0]:.4f}, {value[1]:.4f}, ..., {value[-1]:.4f}] (length: {len(value)})")
        else:
            print(f"  {key}: {value}")
    
    print("=" * 50)
