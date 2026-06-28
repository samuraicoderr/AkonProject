"""
API schemas (request/response models).
"""
from .prediction import (
    CropFeaturesSchema,
    PredictionResponseSchema,
    TopKPredictionResponseSchema,
    RecommendationReportSchema,
    RecommendationItemSchema,
    BatchPredictionRequestSchema,
    BatchPredictionResponseSchema,
    HealthCheckResponseSchema,
    ModelInfoResponseSchema,
    ErrorResponseSchema,
)

__all__ = [
    "CropFeaturesSchema",
    "PredictionResponseSchema",
    "TopKPredictionResponseSchema",
    "RecommendationReportSchema",
    "RecommendationItemSchema",
    "BatchPredictionRequestSchema",
    "BatchPredictionResponseSchema",
    "HealthCheckResponseSchema",
    "ModelInfoResponseSchema",
    "ErrorResponseSchema",
]
