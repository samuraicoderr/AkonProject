"""
Prediction API endpoints.
"""
import logging
from typing import Literal

from ninja import Query, Router

from ..schemas import (
    CropFeaturesSchema,
    PredictionResponseSchema,
    TopKPredictionResponseSchema,
    RecommendationReportSchema,
    RecommendationItemSchema,
    BatchPredictionRequestSchema,
    BatchPredictionResponseSchema,
    ErrorResponseSchema,
)
from ..services import PredictionService

logger = logging.getLogger(__name__)
router = Router(tags=["Predictions"])

# Get singleton service instance
_service = PredictionService()


@router.post(
    "/predict",
    response={200: PredictionResponseSchema, 400: ErrorResponseSchema, 500: ErrorResponseSchema},
    summary="Predict best crop",
    description="Predict the most suitable crop based on soil and climate conditions.",
)
def predict_crop(
    request,
    data: CropFeaturesSchema,
    model_type: Literal["random_forest", "neural_network"] = Query(
        default="random_forest",
        description="Model to use for prediction"
    ),
) -> PredictionResponseSchema:
    """Predict the best crop for given agricultural conditions."""
    try:
        crop = _service.predict(
            features=data.to_dict(),
            model_type=model_type
        )
        return PredictionResponseSchema(crop=crop, model_type=model_type)
    except ValueError as e:
        logger.warning(f"Validation error in predict: {e}")
        return 400, ErrorResponseSchema(detail=str(e), code="VALIDATION_ERROR")
    except Exception as e:
        logger.exception(f"Error in predict: {e}")
        return 500, ErrorResponseSchema(detail="Internal server error", code="INTERNAL_ERROR")


@router.post(
    "/predict/top-k",
    response={200: TopKPredictionResponseSchema, 400: ErrorResponseSchema, 500: ErrorResponseSchema},
    summary="Get top-k crop recommendations",
    description="Get multiple crop recommendations ranked by probability.",
)
def predict_top_k(
    request,
    data: CropFeaturesSchema,
    k: int = Query(default=3, ge=1, le=22, description="Number of recommendations"),
    model_type: Literal["random_forest", "neural_network"] = Query(
        default="random_forest",
        description="Model to use for prediction"
    ),
) -> TopKPredictionResponseSchema:
    """Get top-k crop recommendations with probabilities."""
    try:
        results = _service.predict_top_k(
            features=data.to_dict(),
            k=k,
            model_type=model_type
        )
        recommendations = [
            RecommendationItemSchema(crop=crop, probability=round(prob, 4))
            for crop, prob in results
        ]
        return TopKPredictionResponseSchema(
            recommendations=recommendations,
            model_type=model_type
        )
    except ValueError as e:
        logger.warning(f"Validation error in predict_top_k: {e}")
        return 400, ErrorResponseSchema(detail=str(e), code="VALIDATION_ERROR")
    except Exception as e:
        logger.exception(f"Error in predict_top_k: {e}")
        return 500, ErrorResponseSchema(detail="Internal server error", code="INTERNAL_ERROR")


@router.post(
    "/recommend",
    response={200: RecommendationReportSchema, 400: ErrorResponseSchema, 500: ErrorResponseSchema},
    summary="Get detailed recommendation report",
    description="Generate a comprehensive crop recommendation report.",
)
def get_recommendation(
    request,
    data: CropFeaturesSchema,
    top_k: int = Query(default=5, ge=1, le=22, description="Number of top recommendations"),
    model_type: Literal["random_forest", "neural_network"] = Query(
        default="random_forest",
        description="Model to use for prediction"
    ),
) -> RecommendationReportSchema:
    """Generate a comprehensive recommendation report."""
    try:
        report = _service.get_recommendation_report(
            features=data.to_dict(),
            top_k=top_k,
            model_type=model_type
        )
        return RecommendationReportSchema(
            input_conditions=report["input_conditions"],
            recommended_crop=report["recommended_crop"],
            confidence=round(report["confidence"], 4),
            top_recommendations=[
                RecommendationItemSchema(
                    crop=item["crop"],
                    probability=round(item["probability"], 4)
                )
                for item in report["top_recommendations"]
            ],
            model_type=report["model_type"]
        )
    except ValueError as e:
        logger.warning(f"Validation error in get_recommendation: {e}")
        return 400, ErrorResponseSchema(detail=str(e), code="VALIDATION_ERROR")
    except Exception as e:
        logger.exception(f"Error in get_recommendation: {e}")
        return 500, ErrorResponseSchema(detail="Internal server error", code="INTERNAL_ERROR")


@router.post(
    "/predict/batch",
    response={200: BatchPredictionResponseSchema, 400: ErrorResponseSchema, 500: ErrorResponseSchema},
    summary="Batch predict crops",
    description="Predict crops for multiple samples in a single request.",
)
def predict_batch(
    request,
    data: BatchPredictionRequestSchema,
) -> BatchPredictionResponseSchema:
    """Predict crops for multiple samples."""
    try:
        predictions = []
        for sample in data.samples:
            crop = _service.predict(
                features=sample.to_dict(),
                model_type=data.model_type
            )
            predictions.append(crop)
        
        return BatchPredictionResponseSchema(
            predictions=predictions,
            model_type=data.model_type,
            count=len(predictions)
        )
    except ValueError as e:
        logger.warning(f"Validation error in predict_batch: {e}")
        return 400, ErrorResponseSchema(detail=str(e), code="VALIDATION_ERROR")
    except Exception as e:
        logger.exception(f"Error in predict_batch: {e}")
        return 500, ErrorResponseSchema(detail="Internal server error", code="INTERNAL_ERROR")
