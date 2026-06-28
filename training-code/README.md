# AkonProject - Intelligent Crop Recommendation System

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue.svg" alt="Python">
  <img src="https://img.shields.io/badge/scikit--learn-1.8.0-orange.svg" alt="scikit-learn">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</p>

AkonProject is a machine learning-powered crop recommendation system that predicts the most suitable crops based on agricultural conditions. The system uses both **Random Forest** and **Neural Network** models to provide accurate recommendations with confidence scores.

AkonProject was trained on <a href="https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset/data">this</a> dataset, credits to **<a href="https://www.kaggle.com/atharvaingle">Atharva Ingle</a>** 

## 🌾 Features

- **Dual Model Architecture**: Random Forest (99.77% accuracy) and Neural Network (97.95% accuracy)
- **22 Crop Classes**: Supports recommendations for rice, wheat, maize, cotton, and 18 other crops
- **7 Agricultural Features**: Nitrogen (N), Phosphorus (P), Potassium (K), temperature, humidity, pH, and rainfall
- **Production-Ready**: Modular codebase with model persistence, input validation, and comprehensive evaluation
- **Top-K Recommendations**: Returns multiple crop suggestions with probability scores
- **CLI Interface**: Configurable training via command-line arguments

## 📁 Project Structure

```
akonproject/
├── data/
│   └── processed/
│       └── crop_recommendation.csv    # Training dataset (2,200 samples)
├── models/                            # Saved trained models
├── logs/                              # Training logs and evaluation results
├── src/
│   └── training/
│       ├── __init__.py
│       ├── config.py                  # Configuration dataclasses
│       ├── data_loader.py             # Data loading and preprocessing
│       ├── trainer.py                 # Main training orchestrator
│       ├── predictor.py               # Production inference class
│       ├── evaluation.py              # Metrics and reporting
│       ├── run_training.py            # CLI training script
│       ├── example_inference.py       # Usage examples
│       ├── utils.py                   # Utility functions
│       └── models/
│           ├── __init__.py
│           ├── base.py                # Abstract model interface
│           ├── random_forest.py       # Random Forest implementation
│           └── neural_network.py      # Neural Network implementation
├── requirements.txt
├── Makefile
├── README.md
└── how_it_works.md                    # Detailed technical documentation
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10 or higher
- pip package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/akonproject.git
   cd akonproject
   ```

2. **Create a virtual environment**
   ```bash
   # Windows
   python -m venv env
   env\Scripts\activate

   # Linux/macOS
   python -m venv env
   source env/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

   Or install manually:
   ```bash
   pip install numpy pandas scikit-learn joblib
   ```

### Training Models

Run the training pipeline with default settings:

```bash
python src/training/run_training.py
```

**With custom parameters:**

```bash
python src/training/run_training.py \
    --rf-estimators 200 \
    --rf-max-depth 20 \
    --nn-hidden-layers 256,128,64 \
    --nn-epochs 150 \
    --nn-learning-rate 0.0005 \
    --test-size 0.2
```

**Train specific models only:**

```bash
# Random Forest only
python src/training/run_training.py --model rf

# Neural Network only
python src/training/run_training.py --model nn
```

### Making Predictions

```python
from src.training.predictor import load_predictor

# Load the trained model
predictor = load_predictor("models", model_type="random_forest")

# Define agricultural conditions
conditions = {
    "N": 90,           # Nitrogen content (kg/ha)
    "P": 42,           # Phosphorus content (kg/ha)
    "K": 43,           # Potassium content (kg/ha)
    "temperature": 21.0,  # Temperature (°C)
    "humidity": 82.0,     # Relative humidity (%)
    "ph": 6.5,            # Soil pH
    "rainfall": 200.0     # Rainfall (mm)
}

# Get single prediction
crop = predictor.predict(conditions)
print(f"Recommended crop: {crop}")

# Get top-5 recommendations with probabilities
top_crops = predictor.predict_top_k(conditions, k=5)
for crop, prob in top_crops:
    print(f"  {crop}: {prob:.2%}")

# Get detailed report
report = predictor.get_recommendation_report(conditions)
print(report)
```

### Running Example Inference

```bash
python src/training/example_inference.py
```

## 📊 Model Performance

| Model | Test Accuracy | F1 Score (Macro) | Top-3 Accuracy |
|-------|--------------|------------------|----------------|
| Random Forest | **99.77%** | 0.9977 | 100% |
| Neural Network | 97.95% | 0.9795 | 100% |

### Feature Importance (Random Forest)

| Feature | Importance |
|---------|------------|
| Rainfall | 22.42% |
| Humidity | 20.59% |
| Potassium (K) | 17.48% |
| Phosphorus (P) | 15.21% |
| Nitrogen (N) | 11.28% |
| Temperature | 7.98% |
| pH | 5.04% |

## 🌱 Supported Crops

The system can recommend 22 different crops:

| | | | |
|---|---|---|---|
| Apple | Banana | Blackgram | Chickpea |
| Coconut | Coffee | Cotton | Grapes |
| Jute | Kidney Beans | Lentil | Maize |
| Mango | Mothbeans | Mungbean | Muskmelon |
| Orange | Papaya | Pigeonpeas | Pomegranate |
| Rice | Watermelon | | |

## ⚙️ Configuration

All configurations are managed through dataclasses in `src/training/config.py`:

```python
from src.training.config import TrainingConfig, RandomForestConfig, NeuralNetworkConfig

config = TrainingConfig(
    random_forest=RandomForestConfig(
        n_estimators=200,
        max_depth=20,
        class_weight="balanced"
    ),
    neural_network=NeuralNetworkConfig(
        hidden_layers=[256, 128, 64],
        learning_rate=0.001,
        epochs=100,
        early_stopping_patience=10
    )
)
```

## 📖 Documentation

For a comprehensive technical deep-dive, see [how_it_works.md](how_it_works.md).

## 🧪 Data Format

The input CSV should have the following columns:

| Column | Type | Description | Range |
|--------|------|-------------|-------|
| N | float | Nitrogen content (kg/ha) | 0-140 |
| P | float | Phosphorus content (kg/ha) | 5-145 |
| K | float | Potassium content (kg/ha) | 5-205 |
| temperature | float | Temperature (°C) | 8.83-43.68 |
| humidity | float | Relative humidity (%) | 14.26-99.98 |
| ph | float | Soil pH value | 3.5-9.94 |
| rainfall | float | Rainfall (mm) | 20.21-298.56 |
| label | string | Crop name | 22 classes |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Dataset sourced from agricultural research databases
- Built with scikit-learn and pandas
- Inspired by precision agriculture initiatives

---

<p align="center">
  Made with ❤️ for sustainable agriculture
</p>
