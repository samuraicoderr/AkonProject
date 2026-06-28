#!/usr/bin/env python
"""
Example script demonstrating how to use the trained crop recommendation models.

Usage:
    python src/training/example_inference.py
    python src/training/example_inference.py --test-accuracy
"""
import sys
import argparse
from pathlib import Path

import numpy as np
import pandas as pd

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from src.training.predictor import load_predictor


def main():
    """Run example predictions."""
    print("=" * 70)
    print("Crop Recommendation - Example Inference")
    print("=" * 70)
    
    # Load the predictor (uses latest trained model by default)
    model_dir = Path("models")
    
    print("\nLoading Random Forest model...")
    rf_predictor = load_predictor(model_dir, model_type="random_forest")
    
    print("Loading Neural Network model...")
    nn_predictor = load_predictor(model_dir, model_type="neural_network")
    
    # Example agricultural conditions
    example_conditions = [
        {   
            "name": "Tropical humid conditions",
            "features": {
                "N": 90,  # Nitrogen content
                "P": 42,  # Phosphorus content  
                "K": 43,  # Potassium content
                "temperature": 21.0,  # Temperature in Celsius
                "humidity": 82.0,  # Humidity percentage
                "ph": 6.5,  # Soil pH
                "rainfall": 200.0  # Rainfall in mm
            }
        },
        {
            "name": "Semi-arid conditions",
            "features": {
                "N": 20,
                "P": 35,
                "K": 20,
                "temperature": 28.0,
                "humidity": 40.0,
                "ph": 7.5,
                "rainfall": 45.0
            }
        },
        {
            "name": "Temperate mild conditions",
            "features": {
                "N": 60,
                "P": 50,
                "K": 50,
                "temperature": 18.0,
                "humidity": 65.0,
                "ph": 6.8,
                "rainfall": 100.0
            }
        }
    ]
    
    for condition in example_conditions:
        print(f"\n{'=' * 70}")
        print(f"Conditions: {condition['name']}")
        print("-" * 70)
        print("Input features:")
        for key, value in condition['features'].items():
            print(f"  {key}: {value}")
        
        features = condition['features']
        
        # Get predictions from both models
        print("\n--- Random Forest Predictions ---")
        rf_report = rf_predictor.get_recommendation_report(features, top_k=5)
        print(f"Recommended crop: {rf_report['recommended_crop']}")
        print(f"Confidence: {rf_report['confidence']:.2%}")
        print("Top 5 recommendations:")
        for i, rec in enumerate(rf_report['top_recommendations'], 1):
            print(f"  {i}. {rec['crop']}: {rec['probability']:.2%}")
        
        print("\n--- Neural Network Predictions ---")
        nn_report = nn_predictor.get_recommendation_report(features, top_k=5)
        print(f"Recommended crop: {nn_report['recommended_crop']}")
        print(f"Confidence: {nn_report['confidence']:.2%}")
        print("Top 5 recommendations:")
        for i, rec in enumerate(nn_report['top_recommendations'], 1):
            print(f"  {i}. {rec['crop']}: {rec['probability']:.2%}")
    
    print(f"\n{'=' * 70}")
    print("Inference example completed!")
    print("=" * 70)


def test_accuracy(sample_fraction: float = 0.2):
    """
    Test model accuracy on a random sample of the dataset.
    
    Args:
        sample_fraction: Fraction of dataset to sample (default 20%)
    """
    print("=" * 70)
    print(f"Testing Model Accuracy on {sample_fraction:.0%} Random Sample")
    print("=" * 70)
    
    # Load the dataset
    data_path = Path("data/processed/crop_recommendation.csv")
    if not data_path.exists():
        print(f"Error: Dataset not found at {data_path}")
        return
    
    df = pd.read_csv(data_path)
    total_samples = len(df)
    
    # Randomly sample the dataset
    sample_size = int(total_samples * sample_fraction)
    sample_df = df.sample(n=sample_size, random_state=None)  # None = truly random
    
    print(f"\nDataset: {total_samples} total samples")
    print(f"Test sample: {sample_size} samples ({sample_fraction:.0%})")
    
    # Load models
    model_dir = Path("models")
    print("\nLoading models...")
    rf_predictor = load_predictor(model_dir, model_type="random_forest")
    nn_predictor = load_predictor(model_dir, model_type="neural_network")
    
    # Feature columns
    feature_cols = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    
    # Test both models
    rf_correct = 0
    nn_correct = 0
    
    print(f"\nTesting on {sample_size} samples...")
    print("-" * 70)
    
    for idx, row in sample_df.iterrows():
        features = {col: row[col] for col in feature_cols}
        actual_crop = row["label"]
        
        # Random Forest prediction
        rf_pred = rf_predictor.predict(features)
        if rf_pred == actual_crop:
            rf_correct += 1
        
        # Neural Network prediction
        nn_pred = nn_predictor.predict(features)
        if nn_pred == actual_crop:
            nn_correct += 1
    
    # Calculate accuracies
    rf_accuracy = rf_correct / sample_size
    nn_accuracy = nn_correct / sample_size
    
    # Print results
    print(f"\n{'=' * 70}")
    print("RESULTS")
    print("=" * 70)
    print(f"\nRandom Forest:")
    print(f"  Correct: {rf_correct}/{sample_size}")
    print(f"  Accuracy: {rf_accuracy:.2%}")
    
    print(f"\nNeural Network:")
    print(f"  Correct: {nn_correct}/{sample_size}")
    print(f"  Accuracy: {nn_accuracy:.2%}")
    
    print(f"\n{'=' * 70}")
    
    # Show some example predictions
    print("\nSample Predictions (first 10):")
    print("-" * 70)
    print(f"{'Actual':<15} {'RF Prediction':<15} {'NN Prediction':<15} {'RF ✓':<5} {'NN ✓':<5}")
    print("-" * 70)
    
    for i, (idx, row) in enumerate(sample_df.head(10).iterrows()):
        features = {col: row[col] for col in feature_cols}
        actual = row["label"]
        rf_pred = rf_predictor.predict(features)
        nn_pred = nn_predictor.predict(features)
        
        rf_check = "✓" if rf_pred == actual else "✗"
        nn_check = "✓" if nn_pred == actual else "✗"
        
        print(f"{actual:<15} {rf_pred:<15} {nn_pred:<15} {rf_check:<5} {nn_check:<5}")
    
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Crop Recommendation Model Inference")
    parser.add_argument(
        "--test-accuracy", 
        action="store_true",
        help="Test model accuracy on random 20%% sample of dataset"
    )
    parser.add_argument(
        "--sample-fraction",
        type=float,
        default=0.2,
        help="Fraction of dataset to sample (default: 0.2)"
    )
    args = parser.parse_args()
    
    if args.test_accuracy:
        test_accuracy(args.sample_fraction)
    else:
        main()
