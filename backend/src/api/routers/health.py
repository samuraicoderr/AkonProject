"""
Health check and service information endpoints.
"""
import logging

from ninja import Router

from ..schemas import (
    HealthCheckResponseSchema,
    ModelInfoResponseSchema,
)
from ..services import PredictionService

logger = logging.getLogger(__name__)
router = Router(tags=["Health & Info"])

# Get singleton service instance
_service = PredictionService()


@router.get(
    "/health",
    response=HealthCheckResponseSchema,
    summary="Health check",
    description="Check the health status of the prediction service.",
)
def health_check(request) -> HealthCheckResponseSchema:
    """Check service health and model availability."""
    status = _service.health_check()
    return HealthCheckResponseSchema(
        status=status["status"],
        models=status["models"]
    )


@router.get(
    "/models/info",
    response=ModelInfoResponseSchema,
    summary="Get model information",
    description="Get information about available models and required input features.",
)
def get_model_info(request) -> ModelInfoResponseSchema:
    """Get information about available models and features."""
    return ModelInfoResponseSchema(
        available_models=_service.available_models,
        feature_names=_service.feature_names,
        feature_ranges={
            name: list(range_tuple)
            for name, range_tuple in _service.feature_ranges.items()
        }
    )
