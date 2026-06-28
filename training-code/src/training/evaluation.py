"""
Model evaluation utilities for crop recommendation models.
"""
import json
import logging
from pathlib import Path
from typing import Optional

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    top_k_accuracy_score,
)

from .models.base import BaseModel

logger = logging.getLogger(__name__)


class ModelEvaluator:
    """Evaluates model performance with comprehensive metrics."""
    
    def __init__(self, class_names: Optional[list[str]] = None):
        """
        Initialize the evaluator.
        
        Args:
            class_names: List of class names for labeling.
        """
        self.class_names = class_names
    
    def evaluate(
        self,
        model: BaseModel,
        X: np.ndarray,
        y_true: np.ndarray,
        dataset_name: str = "test"
    ) -> dict:
        """
        Perform comprehensive model evaluation.
        
        Args:
            model: Trained model to evaluate.
            X: Input features.
            y_true: True labels.
            dataset_name: Name of the dataset (for logging).
            
        Returns:
            Dictionary containing all evaluation metrics.
        """
        logger.info(f"Evaluating model on {dataset_name} set ({len(X)} samples)...")
        
        # Get predictions
        y_pred = model.predict(X)
        y_proba = model.predict_proba(X)
        
        # Calculate metrics
        metrics = {
            "dataset": dataset_name,
            "n_samples": len(X),
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision_macro": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
            "recall_macro": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
            "f1_macro": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
            "precision_weighted": float(precision_score(y_true, y_pred, average="weighted", zero_division=0)),
            "recall_weighted": float(recall_score(y_true, y_pred, average="weighted", zero_division=0)),
            "f1_weighted": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
        }
        
        # Top-k accuracy (useful for multi-class problems)
        n_classes = y_proba.shape[1]
        for k in [3, 5]:
            if k <= n_classes:
                metrics[f"top_{k}_accuracy"] = float(
                    top_k_accuracy_score(y_true, y_proba, k=k)
                )
        
        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        metrics["confusion_matrix"] = cm.tolist()
        
        # Per-class classification report
        report = classification_report(
            y_true, y_pred,
            target_names=self.class_names,
            output_dict=True,
            zero_division=0
        )
        metrics["classification_report"] = report
        
        # Log summary
        logger.info(f"Results on {dataset_name}:")
        logger.info(f"  Accuracy: {metrics['accuracy']:.4f}")
        logger.info(f"  F1 (macro): {metrics['f1_macro']:.4f}")
        logger.info(f"  F1 (weighted): {metrics['f1_weighted']:.4f}")
        if "top_3_accuracy" in metrics:
            logger.info(f"  Top-3 Accuracy: {metrics['top_3_accuracy']:.4f}")
        
        return metrics
    
    def compare_models(
        self,
        models: dict[str, BaseModel],
        X: np.ndarray,
        y_true: np.ndarray,
        dataset_name: str = "test"
    ) -> dict[str, dict]:
        """
        Compare multiple models on the same dataset.
        
        Args:
            models: Dictionary mapping model names to model instances.
            X: Input features.
            y_true: True labels.
            dataset_name: Name of the dataset.
            
        Returns:
            Dictionary mapping model names to their evaluation results.
        """
        logger.info(f"Comparing {len(models)} models on {dataset_name} set...")
        
        results = {}
        for name, model in models.items():
            logger.info(f"\nEvaluating {name}...")
            results[name] = self.evaluate(model, X, y_true, dataset_name)
        
        # Print comparison summary
        logger.info("\n" + "=" * 60)
        logger.info("Model Comparison Summary:")
        logger.info("=" * 60)
        logger.info(f"{'Model':<20} {'Accuracy':<12} {'F1 (macro)':<12} {'F1 (weighted)':<12}")
        logger.info("-" * 60)
        
        for name, metrics in results.items():
            logger.info(
                f"{name:<20} {metrics['accuracy']:<12.4f} "
                f"{metrics['f1_macro']:<12.4f} {metrics['f1_weighted']:<12.4f}"
            )
        
        return results
    
    def save_results(self, results: dict, path: Path) -> None:
        """
        Save evaluation results to a JSON file.
        
        Args:
            results: Evaluation results dictionary.
            path: Path to save the results.
        """
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, "w") as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Results saved to {path}")


def print_classification_report(results: dict, class_names: Optional[list[str]] = None) -> None:
    """
    Print a formatted classification report.
    
    Args:
        results: Evaluation results dictionary.
        class_names: Optional list of class names.
    """
    report = results.get("classification_report", {})
    
    print("\n" + "=" * 70)
    print("Classification Report")
    print("=" * 70)
    print(f"{'Class':<20} {'Precision':<12} {'Recall':<12} {'F1-Score':<12} {'Support':<10}")
    print("-" * 70)
    
    for cls_name, metrics in report.items():
        if cls_name in ["accuracy", "macro avg", "weighted avg"]:
            continue
        if isinstance(metrics, dict):
            print(
                f"{cls_name:<20} {metrics.get('precision', 0):<12.4f} "
                f"{metrics.get('recall', 0):<12.4f} {metrics.get('f1-score', 0):<12.4f} "
                f"{int(metrics.get('support', 0)):<10}"
            )
    
    print("-" * 70)
    
    # Print averages
    for avg_type in ["macro avg", "weighted avg"]:
        if avg_type in report:
            metrics = report[avg_type]
            print(
                f"{avg_type:<20} {metrics.get('precision', 0):<12.4f} "
                f"{metrics.get('recall', 0):<12.4f} {metrics.get('f1-score', 0):<12.4f} "
                f"{int(metrics.get('support', 0)):<10}"
            )
    
    print("=" * 70)
    print(f"Overall Accuracy: {results.get('accuracy', 0):.4f}")
    print("=" * 70)
