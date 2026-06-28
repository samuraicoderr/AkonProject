#!/usr/bin/env python
"""
Script to run the crop recommendation model training pipeline.

Usage:
    python -m src.training.run_training
    
Or from the project root:
    python src/training/run_training.py
"""
import argparse
import logging
import sys
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from src.training.config import (
    DataConfig,
    NeuralNetworkConfig,
    RandomForestConfig,
    TrainingConfig,
)
from src.training.trainer import CropRecommendationTrainer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Train crop recommendation models"
    )
    
    parser.add_argument(
        "--data-path",
        type=Path,
        default=Path("data/processed/crop_recommendation.csv"),
        help="Path to the training data CSV file"
    )
    
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("models"),
        help="Directory to save trained models"
    )
    
    parser.add_argument(
        "--log-dir",
        type=Path,
        default=Path("logs"),
        help="Directory to save logs and evaluation results"
    )
    
    parser.add_argument(
        "--rf-estimators",
        type=int,
        default=100,
        help="Number of trees in Random Forest"
    )
    
    parser.add_argument(
        "--rf-max-depth",
        type=int,
        default=None,
        help="Maximum depth of Random Forest trees"
    )
    
    parser.add_argument(
        "--nn-hidden-layers",
        type=str,
        default="128,64,32",
        help="Comma-separated hidden layer sizes for Neural Network"
    )
    
    parser.add_argument(
        "--nn-epochs",
        type=int,
        default=100,
        help="Number of training epochs for Neural Network"
    )
    
    parser.add_argument(
        "--nn-learning-rate",
        type=float,
        default=0.001,
        help="Learning rate for Neural Network"
    )
    
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Fraction of data to use for testing"
    )
    
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random seed for reproducibility"
    )
    
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Don't save trained models"
    )
    
    parser.add_argument(
        "--model",
        choices=["all", "rf", "nn"],
        default="all",
        help="Which model(s) to train: all, rf (Random Forest), nn (Neural Network)"
    )
    
    return parser.parse_args()


def create_config(args) -> TrainingConfig:
    """Create training configuration from arguments."""
    # Parse hidden layers
    hidden_layers = [int(x) for x in args.nn_hidden_layers.split(",")]
    
    return TrainingConfig(
        data=DataConfig(
            data_path=args.data_path,
            test_size=args.test_size,
            random_state=args.random_state
        ),
        random_forest=RandomForestConfig(
            n_estimators=args.rf_estimators,
            max_depth=args.rf_max_depth,
            random_state=args.random_state
        ),
        neural_network=NeuralNetworkConfig(
            hidden_layers=hidden_layers,
            epochs=args.nn_epochs,
            learning_rate=args.nn_learning_rate,
            random_state=args.random_state
        ),
        model_output_dir=args.output_dir,
        log_dir=args.log_dir
    )


def main():
    """Main training entry point."""
    args = parse_args()
    
    logger.info("=" * 70)
    logger.info("Crop Recommendation Model Training")
    logger.info("=" * 70)
    
    # Create configuration
    config = create_config(args)
    
    # Log configuration
    logger.info("Configuration:")
    logger.info(f"  Data path: {config.data.data_path}")
    logger.info(f"  Output directory: {config.model_output_dir}")
    logger.info(f"  Test size: {config.data.test_size}")
    logger.info(f"  Random state: {config.data.random_state}")
    
    if args.model in ["all", "rf"]:
        logger.info(f"  RF estimators: {config.random_forest.n_estimators}")
        logger.info(f"  RF max depth: {config.random_forest.max_depth}")
    
    if args.model in ["all", "nn"]:
        logger.info(f"  NN hidden layers: {config.neural_network.hidden_layers}")
        logger.info(f"  NN epochs: {config.neural_network.epochs}")
        logger.info(f"  NN learning rate: {config.neural_network.learning_rate}")
    
    # Create trainer
    trainer = CropRecommendationTrainer(config)
    
    # Load data
    trainer.load_data()
    
    # Train selected models
    if args.model == "all":
        trainer.train_all()
    elif args.model == "rf":
        trainer.train_random_forest()
    elif args.model == "nn":
        trainer.train_neural_network()
    
    # Evaluate
    results = trainer.evaluate_all("test")
    
    # Save models and results
    if not args.no_save:
        trainer.save_models()
        trainer.save_evaluation_results(results)
    
    logger.info("\n" + "=" * 70)
    logger.info("Training completed successfully!")
    logger.info("=" * 70)
    
    return results


if __name__ == "__main__":
    main()
