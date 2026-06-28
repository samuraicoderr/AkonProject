import { create } from "zustand";
import type {
  CropFeatures,
  ModelType,
  RecommendationReportOut,
  ModelInfoOut,
  HealthOut,
} from "../services/CropService";

/* ----------------------------- TYPES ----------------------------- */

export interface CropState {
  // Input state
  features: CropFeatures;
  modelType: ModelType;
  topK: number;

  // Results
  prediction: RecommendationReportOut | null;
  modelInfo: ModelInfoOut | null;
  healthStatus: HealthOut | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  activeTab: "single" | "batch" | "insights";

  // Actions
  setFeature: <K extends keyof CropFeatures>(key: K, value: CropFeatures[K]) => void;
  setFeatures: (features: Partial<CropFeatures>) => void;
  setModelType: (type: ModelType) => void;
  setTopK: (k: number) => void;
  setPrediction: (prediction: RecommendationReportOut | null) => void;
  setModelInfo: (info: ModelInfoOut | null) => void;
  setHealthStatus: (status: HealthOut | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: "single" | "batch" | "insights") => void;
  resetFeatures: () => void;
  resetAll: () => void;
}

/* ----------------------------- DEFAULTS ----------------------------- */

const DEFAULT_FEATURES: CropFeatures = {
  N: 90,
  P: 42,
  K: 43,
  temperature: 25,
  humidity: 70,
  ph: 6.5,
  rainfall: 200,
};

/* ----------------------------- STORE ----------------------------- */

export const useCropStore = create<CropState>((set) => ({
  // Initial State
  features: DEFAULT_FEATURES,
  modelType: "random_forest",
  topK: 5,
  prediction: null,
  modelInfo: null,
  healthStatus: null,
  isLoading: false,
  error: null,
  activeTab: "single",

  // Actions
  setFeature: (key, value) =>
    set((state) => ({
      features: { ...state.features, [key]: value },
    })),

  setFeatures: (features) =>
    set((state) => ({
      features: { ...state.features, ...features },
    })),

  setModelType: (modelType) => set({ modelType }),

  setTopK: (topK) => set({ topK }),

  setPrediction: (prediction) => set({ prediction }),

  setModelInfo: (modelInfo) => set({ modelInfo }),

  setHealthStatus: (healthStatus) => set({ healthStatus }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setActiveTab: (activeTab) => set({ activeTab }),

  resetFeatures: () => set({ features: DEFAULT_FEATURES }),

  resetAll: () =>
    set({
      features: DEFAULT_FEATURES,
      modelType: "random_forest",
      topK: 5,
      prediction: null,
      error: null,
      activeTab: "single",
    }),
}));
