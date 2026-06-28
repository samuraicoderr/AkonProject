import { apiClient } from "../ApiClient";
import { BackendRoutes } from "../BackendRoutes";

/* ----------------------------- TYPES ----------------------------- */

export type ModelType = "random_forest" | "neural_network";

export interface CropFeatures {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

/* ----------------------------- HEALTH ----------------------------- */

export interface HealthOut {
  status: "healthy" | "degraded" | "unhealthy";
  models: Record<string, string>;
}

/* ----------------------------- MODELS ----------------------------- */

export interface ModelInfoOut {
  available_models: string[];
  feature_names: string[];
  feature_ranges: Record<string, [number, number]>;
}

/* ----------------------------- PREDICTIONS ----------------------------- */

export interface PredictOut {
  crop: string;
  model_type: ModelType;
}

export interface RecommendationItem {
  crop: string;
  probability: number;
}

export interface TopKOut {
  recommendations: RecommendationItem[];
  model_type: ModelType;
}

export interface RecommendationReportOut {
  input_conditions: CropFeatures;
  recommended_crop: string;
  confidence: number;
  top_recommendations: RecommendationItem[];
  model_type: ModelType;
}

/* ----------------------------- BATCH ----------------------------- */

export interface BatchPredictIn {
  samples: CropFeatures[];
  model_type?: ModelType;
}

export interface BatchPredictOut {
  predictions: string[];
  model_type: ModelType;
  count: number;
}

/* ----------------------------- SERVICE ----------------------------- */

class CropService {
  /* -------- META -------- */

  static async health(): Promise<HealthOut> {
    const res = await apiClient.get<HealthOut>(BackendRoutes.health, {
      requiresAuth: false,
    });
    return res.data;
  }

  static async ping(): Promise<{ message: string }> {
    const res = await apiClient.get<{ message: string }>(BackendRoutes.ping, {
      requiresAuth: false,
    });
    return res.data;
  }

  static async getModelInfo(): Promise<ModelInfoOut> {
    const res = await apiClient.get<ModelInfoOut>(BackendRoutes.getModelInfo, {
      requiresAuth: false,
    });
    return res.data;
  }

  /* -------- PREDICTIONS -------- */

  static async predictCrop(
    features: CropFeatures,
    modelType: ModelType = "random_forest"
  ): Promise<PredictOut> {
    const res = await apiClient.post<PredictOut>(
      BackendRoutes.predictCrop(modelType),
      features,
      { requiresAuth: false }
    );
    return res.data;
  }

  static async predictTopK(
    features: CropFeatures,
    k: number = 3,
    modelType: ModelType = "random_forest"
  ): Promise<TopKOut> {
    const res = await apiClient.post<TopKOut>(
      BackendRoutes.predictTopK(k, modelType),
      features,
      { requiresAuth: false }
    );
    return res.data;
  }

  static async recommend(
    features: CropFeatures,
    topK: number = 5,
    modelType: ModelType = "random_forest"
  ): Promise<RecommendationReportOut> {
    const res = await apiClient.post<RecommendationReportOut>(
      BackendRoutes.recommendCrops(topK, modelType),
      features,
      { requiresAuth: false }
    );
    return res.data;
  }

  /* -------- BATCH -------- */

  static async predictBatch(
    payload: BatchPredictIn
  ): Promise<BatchPredictOut> {
    const res = await apiClient.post<BatchPredictOut>(
      BackendRoutes.predictBatch,
      payload,
      { requiresAuth: false }
    );
    return res.data;
  }
}

export default CropService;
