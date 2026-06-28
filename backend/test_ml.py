"""
Test script to verify ML integration.

Run with: python test_ml.py
"""
import sys
sys.path.insert(0, ".")

print("Testing ML module imports...")

try:
    from src.api.ml import CropPredictor
    print("✓ CropPredictor imported successfully")
except Exception as e:
    print(f"✗ Failed to import CropPredictor: {e}")
    sys.exit(1)

try:
    from src.api.services.prediction import PredictionService
    print("✓ PredictionService imported successfully")
except Exception as e:
    print(f"✗ Failed to import PredictionService: {e}")
    sys.exit(1)

print("\nTesting PredictionService initialization...")
try:
    ps = PredictionService()
    print(f"✓ PredictionService initialized")
    print(f"  Model dir: {ps._MODEL_DIR}")
    print(f"  Model dir exists: {ps._MODEL_DIR.exists()}")
except Exception as e:
    print(f"✗ Failed to initialize PredictionService: {e}")
    sys.exit(1)

print("\nTesting model loading and predictions...")
try:
    test_features = {
        "N": 90,
        "P": 42,
        "K": 43,
        "temperature": 20.87,
        "humidity": 82.0,
        "ph": 6.5,
        "rainfall": 202.9
    }
    
    # Test Random Forest
    prediction = ps.predict(test_features, model_type="random_forest")
    print(f"✓ Random Forest prediction: {prediction}")
    
    top_k = ps.predict_top_k(test_features, k=3, model_type="random_forest")
    print(f"✓ Top-3 recommendations: {top_k}")
    
    # Test Neural Network
    nn_prediction = ps.predict(test_features, model_type="neural_network")
    print(f"✓ Neural Network prediction: {nn_prediction}")
    
except Exception as e:
    print(f"✗ Prediction failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 50)
print("✓ All tests passed!")
print("=" * 50)
