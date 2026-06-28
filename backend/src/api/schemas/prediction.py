"""
Pydantic schemas for prediction API endpoints.
"""
from typing import Literal, Optional

from ninja import Schema
from pydantic import Field, field_validator


ModelType = Literal["random_forest", "neural_network"]


class CropFeaturesSchema(Schema):
    """Input features for crop prediction."""
    
    N: float = Field(
        ...,
        description="Nitrogen content in soil (kg/ha)",
        ge=0,
        le=200,
        examples=[90]
    )
    P: float = Field(
        ...,
        description="Phosphorus content in soil (kg/ha)",
        ge=0,
        le=200,
        examples=[42]
    )
    K: float = Field(
        ...,
        description="Potassium content in soil (kg/ha)",
        ge=0,
        le=250,
        examples=[43]
    )
    temperature: float = Field(
        ...,
        description="Average temperature (°C)",
        ge=-10,
        le=60,
        examples=[20.87]
    )
    humidity: float = Field(
        ...,
        description="Relative humidity (%)",
        ge=0,
        le=100,
        examples=[82.0]
    )
    ph: float = Field(
        ...,
        description="Soil pH value",
        ge=0,
        le=14,
        examples=[6.5]
    )
    rainfall: float = Field(
        ...,
        description="Annual rainfall (mm)",
        ge=0,
        le=500,
        examples=[202.9]
    )
    
    def to_dict(self) -> dict[str, float]:
        """Convert to dictionary for prediction service."""
        return {
            "N": self.N,
            "P": self.P,
            "K": self.K,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "ph": self.ph,
            "rainfall": self.rainfall,
        }


class PredictionResponseSchema(Schema):
    """Response for single crop prediction."""
    
    crop: str = Field(..., description="Predicted crop name")
    model_type: str = Field(..., description="Model used for prediction")


class RecommendationItemSchema(Schema):
    """Single recommendation item with probability."""
    
    crop: str = Field(..., description="Crop name")
    probability: float = Field(..., description="Prediction probability (0-1)")


class TopKPredictionResponseSchema(Schema):
    """Response for top-k predictions."""
    
    recommendations: list[RecommendationItemSchema] = Field(
        ...,
        description="List of crop recommendations with probabilities"
    )
    model_type: str = Field(..., description="Model used for prediction")


class RecommendationReportSchema(Schema):
    """Comprehensive recommendation report."""
    
    input_conditions: dict[str, float] = Field(
        ...,
        description="Input agricultural conditions"
    )
    recommended_crop: str = Field(..., description="Top recommended crop")
    confidence: float = Field(..., description="Confidence score (0-1)")
    top_recommendations: list[RecommendationItemSchema] = Field(
        ...,
        description="Top crop recommendations"
    )
    model_type: str = Field(..., description="Model used for prediction")


class BatchPredictionRequestSchema(Schema):
    """Request for batch predictions."""
    
    samples: list[CropFeaturesSchema] = Field(
        ...,
        description="List of feature sets to predict",
        min_length=1,
        max_length=100
    )
    model_type: ModelType = Field(
        default="random_forest",
        description="Model to use for predictions"
    )


class BatchPredictionResponseSchema(Schema):
    """Response for batch predictions."""
    
    predictions: list[str] = Field(..., description="List of predicted crops")
    model_type: str = Field(..., description="Model used for predictions")
    count: int = Field(..., description="Number of predictions made")


class ModelInfoResponseSchema(Schema):
    """Information about available models."""
    
    available_models: list[str] = Field(
        ...,
        description="List of available model types"
    )
    feature_names: list[str] = Field(
        ...,
        description="Required input feature names"
    )
    feature_ranges: dict[str, list[float]] = Field(
        ...,
        description="Valid ranges for each feature [min, max]"
    )


class HealthCheckResponseSchema(Schema):
    """Health check response."""
    
    status: str = Field(..., description="Overall service status")
    models: dict[str, str] = Field(..., description="Status of each model")


class ErrorResponseSchema(Schema):
    """Error response schema."""
    
    detail: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")
