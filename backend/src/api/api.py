"""
AkonProject Crop Recommendation API.

Production-grade API for ML-powered crop recommendations.
"""
from ninja import NinjaAPI

from .routers import prediction_router, health_router

# Initialize API with metadata
api = NinjaAPI(
    title="AkonProject Crop Recommendation API",
    version="1.0.0",
    description="""
    ## Overview
    
    AkonProject is an intelligent crop recommendation system that predicts the most 
    suitable crops based on agricultural conditions using machine learning.
    
    ## Features
    
    - **Dual Model Support**: Random Forest (99.77% accuracy) and Neural Network (97.95% accuracy)
    - **22 Crop Classes**: Comprehensive support for various crops
    - **7 Agricultural Features**: N, P, K, temperature, humidity, pH, rainfall
    - **Batch Predictions**: Process multiple samples in a single request
    
    ## Input Features
    
    | Feature | Unit | Description |
    |---------|------|-------------|
    | N | kg/ha | Nitrogen content in soil |
    | P | kg/ha | Phosphorus content in soil |
    | K | kg/ha | Potassium content in soil |
    | temperature | °C | Average temperature |
    | humidity | % | Relative humidity |
    | ph | - | Soil pH (0-14) |
    | rainfall | mm | Annual rainfall |
    """,
    docs_url="/docs",
)

# Register routers
api.add_router("/", health_router)
api.add_router("/crops", prediction_router)


@api.get("/ping", tags=["Health & Info"], summary="Simple ping check")
def ping(request):
    """Simple endpoint to check if the API is responding."""
    return {"message": "pong"}
