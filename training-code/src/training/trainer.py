"""
Main trainer module for crop recommendation models.
"""
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np

from .config import TrainingConfig
from .data_loader import CropDataLoader
from .evaluation import ModelEvaluator, print_classification_report
from .models import NeuralNetworkModel, RandomForestModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class CropRecommendationTrainer:
    """
    Main trainer class for crop recommendation models.
    
    Handles the complete training pipeline including data loading,
    model training, evaluation, and saving.
    """
    
    def __init__(self, config: Optional[TrainingConfig] = None):
        """
        Initialize the trainer.
        
        Args:
            config: Training configuration. Uses defaults if not provided.
        """
        self.config = config or TrainingConfig()
        self.data_loader = CropDataLoader(self.config.data)
        self.evaluator: Optional[ModelEvaluator] = None
        self.models: dict[str, object] = {}
        self.splits: Optional[dict] = None
        self.training_results: dict = {}
    
    def load_data(self, data_path: Optional[Path] = None) -> None:
        """
        Load and prepare the training data.
        
        Args:
            data_path: Optional path to the data file.
        """
        logger.info("=" * 60)
        logger.info("Loading and preparing data...")
        logger.info("=" * 60)
        
        df = self.data_loader.load_data(data_path)
        self.splits = self.data_loader.prepare_splits(df)
        self.evaluator = ModelEvaluator(class_names=self.data_loader.class_names)
        
        logger.info(f"Data loaded successfully!")
        logger.info(f"Features: {self.data_loader.feature_names}")
        logger.info(f"Classes: {self.data_loader.class_names}")
    
    def train_random_forest(self) -> RandomForestModel:
        """
        Train a Random Forest model.
        
        Returns:
            Trained Random Forest model.
        """
        if self.splits is None:
            raise ValueError("Data not loaded. Call load_data() first.")
        
        logger.info("\n" + "=" * 60)
        logger.info("Training Random Forest Model")
        logger.info("=" * 60)
        
        X_train, y_train = self.splits["train"]
        X_val, y_val = self.splits["val"]
        
        model = RandomForestModel(
            n_features=self.data_loader.n_features,
            n_classes=self.data_loader.n_classes,
            class_names=self.data_loader.class_names,
            config=self.config.random_forest
        )
        
        train_metrics = model.train(X_train, y_train, X_val, y_val)
        
        self.models["random_forest"] = model
        self.training_results["random_forest"] = train_metrics
        
        # Log feature importances
        importance = model.get_feature_importances(self.data_loader.feature_names)
        logger.info("\nFeature Importances:")
        for feature, score in importance.items():
            logger.info(f"  {feature}: {score:.4f}")
        
        return model
    
    def train_neural_network(self) -> NeuralNetworkModel:
        """
        Train a Neural Network model.
        
        Returns:
            Trained Neural Network model.
        """
        if self.splits is None:
            raise ValueError("Data not loaded. Call load_data() first.")
        
        logger.info("\n" + "=" * 60)
        logger.info("Training Neural Network Model")
        logger.info("=" * 60)
        
        X_train, y_train = self.splits["train"]
        X_val, y_val = self.splits["val"]
        
        model = NeuralNetworkModel(
            n_features=self.data_loader.n_features,
            n_classes=self.data_loader.n_classes,
            class_names=self.data_loader.class_names,
            config=self.config.neural_network
        )
        
        train_metrics = model.train(X_train, y_train, X_val, y_val)
        
        self.models["neural_network"] = model
        self.training_results["neural_network"] = train_metrics
        
        return model
    
    def train_all(self) -> dict:
        """
        Train all models.
        
        Returns:
            Dictionary of trained models.
        """
        self.train_random_forest()
        self.train_neural_network()
        return self.models
    
    def evaluate_all(self, dataset: str = "test") -> dict:
        """
        Evaluate all trained models.
        
        Args:
            dataset: Which dataset to use ('train', 'val', or 'test').
            
        Returns:
            Dictionary of evaluation results for each model.
        """
        if self.splits is None:
            raise ValueError("Data not loaded. Call load_data() first.")
        if not self.models:
            raise ValueError("No models trained. Call train_all() first.")
        if self.evaluator is None:
            raise ValueError("Evaluator not initialized.")
        
        logger.info("\n" + "=" * 60)
        logger.info(f"Evaluating Models on {dataset.upper()} Set")
        logger.info("=" * 60)
        
        X, y = self.splits[dataset]
        results = self.evaluator.compare_models(self.models, X, y, dataset)
        
        # Print detailed reports
        for model_name, model_results in results.items():
            logger.info(f"\nDetailed report for {model_name}:")
            print_classification_report(model_results, self.data_loader.class_names)
        
        return results
    
    def save_models(self, output_dir: Optional[Path] = None) -> dict[str, Path]:
        """
        Save all trained models.
        
        Args:
            output_dir: Directory to save models. Uses config default if not provided.
            
        Returns:
            Dictionary mapping model names to save paths.
        """
        if not self.models:
            raise ValueError("No models to save. Train models first.")
        
        output_dir = output_dir or self.config.model_output_dir
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        saved_paths = {}
        
        logger.info("\n" + "=" * 60)
        logger.info("Saving Models")
        logger.info("=" * 60)
        
        for name, model in self.models.items():
            model_path = output_dir / f"{name}_{timestamp}"
            model.save(model_path)
            saved_paths[name] = model_path
            logger.info(f"Saved {name} to {model_path}")
        
        # Save the data loader (scaler and encoder)
        import joblib
        
        preprocessor_path = output_dir / f"preprocessor_{timestamp}.joblib"
        preprocessor_data = {
            "scaler": self.data_loader.scaler,
            "label_encoder": self.data_loader.label_encoder,
            "feature_names": self.data_loader.feature_names,
            "class_names": self.data_loader.class_names,
        }
        joblib.dump(preprocessor_data, preprocessor_path)
        logger.info(f"Saved preprocessor to {preprocessor_path}")
        saved_paths["preprocessor"] = preprocessor_path
        
        return saved_paths
    
    def save_evaluation_results(
        self,
        results: dict,
        output_dir: Optional[Path] = None
    ) -> Path:
        """
        Save evaluation results to a file.
        
        Args:
            results: Evaluation results dictionary.
            output_dir: Directory to save results.
            
        Returns:
            Path to the saved results file.
        """
        output_dir = output_dir or self.config.log_dir
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_path = output_dir / f"evaluation_results_{timestamp}.json"
        
        self.evaluator.save_results(results, results_path)
        
        return results_path
    
    def run_full_pipeline(
        self,
        data_path: Optional[Path] = None,
        save_models: bool = True,
        save_results: bool = True
    ) -> dict:
        """
        Run the complete training and evaluation pipeline.
        
        Args:
            data_path: Optional path to the data file.
            save_models: Whether to save trained models.
            save_results: Whether to save evaluation results.
            
        Returns:
            Dictionary containing training and evaluation results.
        """
        logger.info("=" * 70)
        logger.info("Starting Crop Recommendation Model Training Pipeline")
        logger.info("=" * 70)
        
        # Load data
        self.load_data(data_path)
        
        # Train models
        self.train_all()
        
        # Evaluate on test set
        test_results = self.evaluate_all("test")
        
        # Save models and results
        saved_paths = {}
        if save_models:
            saved_paths = self.save_models()
        
        if save_results:
            results_path = self.save_evaluation_results(test_results)
            saved_paths["evaluation_results"] = results_path
        
        logger.info("\n" + "=" * 70)
        logger.info("Training Pipeline Completed Successfully!")
        logger.info("=" * 70)
        
        return {
            "training_results": self.training_results,
            "evaluation_results": test_results,
            "saved_paths": saved_paths
        }


def main():
    """Main entry point for training."""
    # Create configuration
    config = TrainingConfig()
    
    # Create trainer and run pipeline
    trainer = CropRecommendationTrainer(config)
    results = trainer.run_full_pipeline(save_models=True, save_results=True)
    
    return results


if __name__ == "__main__":
    main()
