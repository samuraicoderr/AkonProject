# =============================================================================
# AkonProject - Crop Recommendation System
# =============================================================================

.PHONY: help install install-dev clean clean-models clean-logs clean-all \
        train train-rf train-nn evaluate predict test lint format \
        setup dirs

# Default target
help:
	@echo "AkonProject - Crop Recommendation System"
	@echo "======================================"
	@echo ""
	@echo "Setup:"
	@echo "  make install       Install production dependencies"
	@echo "  make install-dev   Install development dependencies"
	@echo "  make setup         Create virtual environment and install deps"
	@echo "  make dirs          Create required directories"
	@echo ""
	@echo "Training:"
	@echo "  make train         Train all models (Random Forest + Neural Network)"
	@echo "  make train-rf      Train Random Forest model only"
	@echo "  make train-nn      Train Neural Network model only"
	@echo ""
	@echo "Inference:"
	@echo "  make predict       Run example inference script"
	@echo "  make evaluate      Evaluate trained models on test set"
	@echo ""
	@echo "Development:"
	@echo "  make test          Run unit tests"
	@echo "  make lint          Run linter (ruff)"
	@echo "  make format        Format code (black)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean         Remove Python cache files"
	@echo "  make clean-models  Remove trained models"
	@echo "  make clean-logs    Remove log files"
	@echo "  make clean-all     Remove all generated files"

# =============================================================================
# Configuration
# =============================================================================

PYTHON := python
VENV := env
VENV_PYTHON := $(VENV)/Scripts/python.exe
SRC_DIR := src/training
DATA_PATH := data/processed/crop_recommendation.csv
MODEL_DIR := models
LOG_DIR := logs

# Training hyperparameters (can be overridden: make train RF_ESTIMATORS=200)
RF_ESTIMATORS := 100
RF_MAX_DEPTH :=
NN_HIDDEN_LAYERS := 128,64,32
NN_EPOCHS := 100
NN_LEARNING_RATE := 0.001
TEST_SIZE := 0.2
RANDOM_STATE := 42

# =============================================================================
# Setup
# =============================================================================

install:
	pip install -r requirements.txt

install-dev:
	pip install -r requirements.txt
	pip install pytest pytest-cov ruff black mypy

setup: dirs
	$(PYTHON) -m venv $(VENV)
	$(VENV_PYTHON) -m pip install --upgrade pip
	$(VENV_PYTHON) -m pip install -r requirements.txt

dirs:
	@mkdir -p $(MODEL_DIR)
	@mkdir -p $(LOG_DIR)
	@mkdir -p $(SRC_DIR)/models
	@echo "Created directories: $(MODEL_DIR), $(LOG_DIR)"

# =============================================================================
# Training
# =============================================================================

train: dirs
	$(VENV_PYTHON) $(SRC_DIR)/run_training.py \
		--data-path $(DATA_PATH) \
		--output-dir $(MODEL_DIR) \
		--log-dir $(LOG_DIR) \
		--rf-estimators $(RF_ESTIMATORS) \
		$(if $(RF_MAX_DEPTH),--rf-max-depth $(RF_MAX_DEPTH),) \
		--nn-hidden-layers $(NN_HIDDEN_LAYERS) \
		--nn-epochs $(NN_EPOCHS) \
		--nn-learning-rate $(NN_LEARNING_RATE) \
		--test-size $(TEST_SIZE) \
		--random-state $(RANDOM_STATE) \
		--model all

train-rf: dirs
	$(VENV_PYTHON) $(SRC_DIR)/run_training.py \
		--data-path $(DATA_PATH) \
		--output-dir $(MODEL_DIR) \
		--log-dir $(LOG_DIR) \
		--rf-estimators $(RF_ESTIMATORS) \
		$(if $(RF_MAX_DEPTH),--rf-max-depth $(RF_MAX_DEPTH),) \
		--test-size $(TEST_SIZE) \
		--random-state $(RANDOM_STATE) \
		--model rf

train-nn: dirs
	$(VENV_PYTHON) $(SRC_DIR)/run_training.py \
		--data-path $(DATA_PATH) \
		--output-dir $(MODEL_DIR) \
		--log-dir $(LOG_DIR) \
		--nn-hidden-layers $(NN_HIDDEN_LAYERS) \
		--nn-epochs $(NN_EPOCHS) \
		--nn-learning-rate $(NN_LEARNING_RATE) \
		--test-size $(TEST_SIZE) \
		--random-state $(RANDOM_STATE) \
		--model nn

# =============================================================================
# Inference & Evaluation
# =============================================================================

predict:
	$(VENV_PYTHON) $(SRC_DIR)/example_inference.py

evaluate: train
	@echo "Evaluation complete - see $(LOG_DIR) for results"

# =============================================================================
# Development
# =============================================================================

test:
	$(VENV_PYTHON) -m pytest tests/ -v --cov=$(SRC_DIR) --cov-report=html

lint:
	$(VENV_PYTHON) -m ruff check $(SRC_DIR)

format:
	$(VENV_PYTHON) -m black $(SRC_DIR)

typecheck:
	$(VENV_PYTHON) -m mypy $(SRC_DIR) --ignore-missing-imports

# =============================================================================
# Cleanup
# =============================================================================

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type f -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleaned Python cache files"

clean-models:
	rm -rf $(MODEL_DIR)/*.joblib
	rm -rf $(MODEL_DIR)/*.json
	@echo "Cleaned trained models"

clean-logs:
	rm -rf $(LOG_DIR)/*.json
	rm -rf $(LOG_DIR)/*.log
	@echo "Cleaned log files"

clean-all: clean clean-models clean-logs
	@echo "Cleaned all generated files"


