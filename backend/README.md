# AkonProject Backend API

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue.svg" alt="Python">
  <img src="https://img.shields.io/badge/Django-4.2+-green.svg" alt="Django">
  <img src="https://img.shields.io/badge/Django%20Ninja-1.0+-orange.svg" alt="Django Ninja">
  <img src="https://img.shields.io/badge/scikit--learn-1.8.0-yellow.svg" alt="scikit-learn">
</p>

A production-grade REST API backend for the **AkonProject Intelligent Crop Recommendation System**. This service exposes machine learning models via a fast, type-safe API, enabling farmers and agricultural advisors to receive crop recommendations based on soil and climate conditions.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [Model Information](#model-information)
- [Contributing](#contributing)

---

## 🎯 Overview

AkonProject Backend provides a RESTful API interface to machine learning models trained for crop recommendation. The system analyzes 7 agricultural features and recommends the most suitable crops from 22 different options with confidence scores.

### Problem Statement

Farmers often struggle to determine which crops are best suited for their specific soil and climate conditions. Making the wrong choice can lead to:
- Poor yields
- Wasted resources (water, fertilizers)
- Economic losses

### Solution

AkonProject uses machine learning to analyze soil composition (N, P, K), climate factors (temperature, humidity, rainfall), and soil pH to provide data-driven crop recommendations with high accuracy.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Dual ML Models** | Random Forest (99.77%) and Neural Network (97.95%) accuracy |
| **22 Crop Classes** | Comprehensive coverage of major agricultural crops |
| **Top-K Recommendations** | Get multiple ranked suggestions with probabilities |
| **Batch Predictions** | Process up to 100 samples per request |
| **Interactive API Docs** | Swagger/OpenAPI documentation at `/api/docs` |
| **CORS Enabled** | Ready for frontend integration |
| **Thread-Safe** | Singleton service with lazy model loading |
| **Production Ready** | Proper error handling, logging, and validation |

---

## 🏗️ Architecture

The backend follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer (Routers)                       │
│              Handles HTTP requests, validation, responses        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer (Services)                    │
│           Business logic, model management, predictions          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ML Layer (Predictor)                        │
│              Model loading, preprocessing, inference             │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Trained Models (joblib)                       │
│              Random Forest & Neural Network models               │
└─────────────────────────────────────────────────────────────────┘
```

### Design Patterns Used

- **Singleton Pattern**: `PredictionService` ensures single instance with thread-safe initialization
- **Lazy Loading**: Models loaded on first request, not at startup
- **Repository Pattern**: Service layer abstracts model access
- **DTO Pattern**: Pydantic schemas for request/response validation

---

## 📁 Project Structure

```
sen_grp_2_backend/
├── manage.py                      # Django management script
├── Makefile                       # Build automation
├── requirements.txt               # Python dependencies
├── .gitignore                     # Git ignore rules
│
└── src/
    ├── __init__.py
    ├── db.sqlite3                 # SQLite database (if needed)
    │
    ├── akonproject_backend/          # Django project settings
    │   ├── __init__.py
    │   ├── settings.py            # Django configuration
    │   ├── urls.py                # Root URL configuration
    │   ├── wsgi.py                # WSGI application
    │   └── asgi.py                # ASGI application
    │
    ├── api/                       # API application
    │   ├── __init__.py
    │   ├── api.py                 # NinjaAPI initialization
    │   ├── urls.py                # API URL patterns
    │   │
    │   ├── routers/               # API endpoint routers
    │   │   ├── __init__.py
    │   │   ├── health.py          # Health & info endpoints
    │   │   └── prediction.py      # Prediction endpoints
    │   │
    │   ├── schemas/               # Request/Response schemas
    │   │   ├── __init__.py
    │   │   └── prediction.py      # Pydantic models
    │   │
    │   └── services/              # Business logic layer
    │       ├── __init__.py
    │       └── prediction.py      # PredictionService
    │
    └── lib/                       # ML library
        └── akonproject_training_ground/
            ├── models/            # Trained model files
            │   ├── random_forest_*.joblib
            │   ├── neural_network_*.joblib
            │   └── preprocessor_*.joblib
            │
            └── src/training/      # Training code
                ├── predictor.py   # Inference class
                ├── config.py      # Configuration
                └── models/        # Model implementations
```

---

## 🚀 Installation

### Prerequisites

- Python 3.10 or higher
- pip package manager
- Git

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sen_grp_2_backend
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

   Or using Make:
   ```bash
   make install
   ```

4. **Verify installation**
   ```bash
   python manage.py check
   ```

---

## 🖥️ Running the Server

### Development Server

```bash
# Using manage.py
python manage.py runserver

# Using Make
make runserver

# Custom port
python manage.py runserver 0.0.0.0:8080
```

The server will start at `http://127.0.0.1:8000`

### API Documentation

Once running, access the interactive API documentation at:
- **Swagger UI**: http://127.0.0.1:8000/api/docs

---

## 📚 API Documentation

### Base URL

```
http://localhost:8000/api/
```

### Authentication

**No authentication required** - All endpoints are public.

### Content Type

All requests and responses use `application/json`.

---

## 🔌 API Endpoints

### Health & Information

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ping` | Simple health check |
| `GET` | `/api/health` | Detailed health status |
| `GET` | `/api/models/info` | Model and feature information |

### Predictions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/crops/predict` | Single crop prediction |
| `POST` | `/api/crops/predict/top-k` | Top-K recommendations |
| `POST` | `/api/crops/recommend` | Detailed recommendation report |
| `POST` | `/api/crops/predict/batch` | Batch predictions (up to 100) |

---

## 💡 Usage Examples

### 1. Simple Prediction

**Request:**
```bash
curl -X POST http://localhost:8000/api/crops/predict \
  -H "Content-Type: application/json" \
  -d '{
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 20.87,
    "humidity": 82.0,
    "ph": 6.5,
    "rainfall": 202.9
  }'
```

**Response:**
```json
{
  "crop": "rice",
  "model_type": "random_forest"
}
```

### 2. Top-K Recommendations

**Request:**
```bash
curl -X POST "http://localhost:8000/api/crops/predict/top-k?k=5" \
  -H "Content-Type: application/json" \
  -d '{
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 20.87,
    "humidity": 82.0,
    "ph": 6.5,
    "rainfall": 202.9
  }'
```

**Response:**
```json
{
  "recommendations": [
    {"crop": "rice", "probability": 0.9823},
    {"crop": "jute", "probability": 0.0089},
    {"crop": "coconut", "probability": 0.0045},
    {"crop": "papaya", "probability": 0.0021},
    {"crop": "banana", "probability": 0.0012}
  ],
  "model_type": "random_forest"
}
```

### 3. Using Neural Network Model

**Request:**
```bash
curl -X POST "http://localhost:8000/api/crops/predict?model_type=neural_network" \
  -H "Content-Type: application/json" \
  -d '{
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 20.87,
    "humidity": 82.0,
    "ph": 6.5,
    "rainfall": 202.9
  }'
```

### 4. Batch Predictions

**Request:**
```bash
curl -X POST http://localhost:8000/api/crops/predict/batch \
  -H "Content-Type: application/json" \
  -d '{
    "samples": [
      {"N": 90, "P": 42, "K": 43, "temperature": 20.87, "humidity": 82.0, "ph": 6.5, "rainfall": 202.9},
      {"N": 20, "P": 30, "K": 20, "temperature": 25.0, "humidity": 60.0, "ph": 7.0, "rainfall": 100.0}
    ],
    "model_type": "random_forest"
  }'
```

**Response:**
```json
{
  "predictions": ["rice", "maize"],
  "model_type": "random_forest",
  "count": 2
}
```

### 5. Health Check

**Request:**
```bash
curl http://localhost:8000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "models": {
    "random_forest": "loaded",
    "neural_network": "loaded"
  }
}
```

### 6. Python Client Example

```python
import requests

BASE_URL = "http://localhost:8000/api"

# Define conditions
conditions = {
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 20.87,
    "humidity": 82.0,
    "ph": 6.5,
    "rainfall": 202.9
}

# Get prediction
response = requests.post(f"{BASE_URL}/crops/predict", json=conditions)
print(response.json())

# Get top-5 recommendations
response = requests.post(
    f"{BASE_URL}/crops/predict/top-k",
    json=conditions,
    params={"k": 5}
)
print(response.json())
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | (insecure default) | Django secret key |
| `DJANGO_DEBUG` | `True` | Debug mode |
| `DJANGO_ALLOWED_HOSTS` | `*` | Comma-separated allowed hosts |
| `DJANGO_LOG_LEVEL` | `INFO` | Logging level |

### Production Deployment

```bash
# Set environment variables
export DJANGO_SECRET_KEY="your-secure-secret-key"
export DJANGO_DEBUG="False"
export DJANGO_ALLOWED_HOSTS="your-domain.com,api.your-domain.com"

# Run with gunicorn
gunicorn src.akonproject_backend.wsgi:application --bind 0.0.0.0:8000
```

---

## 🤖 Model Information

### Available Models

| Model | Accuracy | F1-Score | Best For |
|-------|----------|----------|----------|
| Random Forest | 99.77% | 0.9977 | Production use (recommended) |
| Neural Network | 97.95% | 0.9795 | Complex pattern recognition |

### Input Features

| Feature | Unit | Range | Description |
|---------|------|-------|-------------|
| N | kg/ha | 0-140 | Nitrogen content in soil |
| P | kg/ha | 5-145 | Phosphorus content in soil |
| K | kg/ha | 5-205 | Potassium content in soil |
| temperature | °C | 8.83-43.68 | Average temperature |
| humidity | % | 14.26-99.98 | Relative humidity |
| ph | - | 3.5-9.94 | Soil pH value |
| rainfall | mm | 20.21-298.56 | Annual rainfall |

### Supported Crops (22 Classes)

| | | | |
|---|---|---|---|
| Apple | Banana | Blackgram | Chickpea |
| Coconut | Coffee | Cotton | Grapes |
| Jute | Kidney Beans | Lentil | Maize |
| Mango | Mothbeans | Mungbean | Muskmelon |
| Orange | Papaya | Pigeonpeas | Pomegranate |
| Rice | Watermelon | | |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is developed for academic purposes as part of the SEN Group 2 project.

---

## 👥 Team

**SEN Group 2** - Software Engineering Project
