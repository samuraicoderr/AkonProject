# AkonProject API Endpoints Documentation

> **Base URL**: `https://your-api-domain.com/api`  
> **Interactive Docs**: `{BASE_URL}/docs` (Swagger UI)

## Overview

AkonProject is an intelligent crop recommendation API that predicts the most suitable crops based on soil and climate conditions using machine learning models.

### Available Models

| Model | Accuracy | Description |
|-------|----------|-------------|
| `random_forest` | 99.77% | Ensemble learning model (default, recommended) |
| `neural_network` | 97.95% | MLP-based deep learning model |

### Supported Crops (22 classes)

`apple`, `banana`, `blackgram`, `chickpea`, `coconut`, `coffee`, `cotton`, `grapes`, `jute`, `kidneybeans`, `lentil`, `maize`, `mango`, `mothbeans`, `mungbean`, `muskmelon`, `orange`, `papaya`, `pigeonpeas`, `pomegranate`, `rice`, `watermelon`

---

## Input Features

All prediction endpoints require these 7 agricultural features:

| Feature | Type | Unit | Range | Description |
|---------|------|------|-------|-------------|
| `N` | `float` | kg/ha | 0-200 | Nitrogen content in soil |
| `P` | `float` | kg/ha | 0-200 | Phosphorus content in soil |
| `K` | `float` | kg/ha | 0-250 | Potassium content in soil |
| `temperature` | `float` | °C | -10 to 60 | Average temperature |
| `humidity` | `float` | % | 0-100 | Relative humidity |
| `ph` | `float` | - | 0-14 | Soil pH value |
| `rainfall` | `float` | mm | 0-500 | Annual rainfall |

---

## Endpoints

### 1. Health Check

Check if the API and models are operational.

```
GET /health
```

**Response** `200 OK`
```json
{
  "status": "healthy",
  "models": {
    "random_forest": "loaded",
    "neural_network": "loaded"
  }
}
```

**Status Values**:
- `healthy` - All models loaded
- `degraded` - Some models failed to load
- `unhealthy` - All models failed

---

### 2. Get Model Info

Get information about available models and expected input features.

```
GET /models/info
```

**Response** `200 OK`
```json
{
  "available_models": ["random_forest", "neural_network"],
  "feature_names": ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"],
  "feature_ranges": {
    "N": [0, 140],
    "P": [5, 145],
    "K": [5, 205],
    "temperature": [8.83, 43.68],
    "humidity": [14.26, 99.98],
    "ph": [3.5, 9.94],
    "rainfall": [20.21, 298.56]
  }
}
```

---

### 3. Predict Best Crop

Get the single best crop recommendation.

```
POST /crops/predict?model_type=random_forest
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model_type` | `string` | `random_forest` | Model to use: `random_forest` or `neural_network` |

**Request Body**
```json
{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 20.87,
  "humidity": 82.0,
  "ph": 6.5,
  "rainfall": 202.9
}
```

**Response** `200 OK`
```json
{
  "crop": "rice",
  "model_type": "random_forest"
}
```

**TypeScript Example**
```typescript
interface CropFeatures {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

interface PredictionResponse {
  crop: string;
  model_type: string;
}

async function predictCrop(features: CropFeatures): Promise<PredictionResponse> {
  const response = await fetch('/api/crops/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features)
  });
  return response.json();
}
```

---

### 4. Get Top-K Recommendations

Get multiple crop recommendations ranked by probability.

```
POST /crops/predict/top-k?k=3&model_type=random_forest
```

**Query Parameters**

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `k` | `integer` | `3` | 1-22 | Number of recommendations |
| `model_type` | `string` | `random_forest` | - | Model to use |

**Request Body**
```json
{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 20.87,
  "humidity": 82.0,
  "ph": 6.5,
  "rainfall": 202.9
}
```

**Response** `200 OK`
```json
{
  "recommendations": [
    { "crop": "rice", "probability": 0.9823 },
    { "crop": "jute", "probability": 0.0102 },
    { "crop": "papaya", "probability": 0.0041 }
  ],
  "model_type": "random_forest"
}
```

**TypeScript Example**
```typescript
interface RecommendationItem {
  crop: string;
  probability: number;
}

interface TopKResponse {
  recommendations: RecommendationItem[];
  model_type: string;
}

async function getTopRecommendations(
  features: CropFeatures, 
  k: number = 3
): Promise<TopKResponse> {
  const response = await fetch(`/api/crops/predict/top-k?k=${k}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features)
  });
  return response.json();
}
```

---

### 5. Get Detailed Recommendation Report

Get a comprehensive report with input conditions and recommendations.

```
POST /crops/recommend?top_k=5&model_type=random_forest
```

**Query Parameters**

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `top_k` | `integer` | `5` | 1-22 | Number of top recommendations |
| `model_type` | `string` | `random_forest` | - | Model to use |

**Request Body**
```json
{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 20.87,
  "humidity": 82.0,
  "ph": 6.5,
  "rainfall": 202.9
}
```

**Response** `200 OK`
```json
{
  "input_conditions": {
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 20.87,
    "humidity": 82.0,
    "ph": 6.5,
    "rainfall": 202.9
  },
  "recommended_crop": "rice",
  "confidence": 0.9823,
  "top_recommendations": [
    { "crop": "rice", "probability": 0.9823 },
    { "crop": "jute", "probability": 0.0102 },
    { "crop": "papaya", "probability": 0.0041 },
    { "crop": "coconut", "probability": 0.0018 },
    { "crop": "banana", "probability": 0.0009 }
  ],
  "model_type": "random_forest"
}
```

**TypeScript Example**
```typescript
interface RecommendationReport {
  input_conditions: CropFeatures;
  recommended_crop: string;
  confidence: number;
  top_recommendations: RecommendationItem[];
  model_type: string;
}

async function getRecommendationReport(
  features: CropFeatures,
  topK: number = 5
): Promise<RecommendationReport> {
  const response = await fetch(`/api/crops/recommend?top_k=${topK}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features)
  });
  return response.json();
}
```

---

### 6. Batch Predictions

Predict crops for multiple samples in a single request (max 100 samples).

```
POST /crops/predict/batch
```

**Request Body**
```json
{
  "samples": [
    {
      "N": 90, "P": 42, "K": 43,
      "temperature": 20.87, "humidity": 82.0,
      "ph": 6.5, "rainfall": 202.9
    },
    {
      "N": 20, "P": 30, "K": 20,
      "temperature": 28.5, "humidity": 70.0,
      "ph": 7.0, "rainfall": 100.0
    }
  ],
  "model_type": "random_forest"
}
```

**Response** `200 OK`
```json
{
  "predictions": ["rice", "maize"],
  "model_type": "random_forest",
  "count": 2
}
```

**TypeScript Example**
```typescript
interface BatchRequest {
  samples: CropFeatures[];
  model_type?: 'random_forest' | 'neural_network';
}

interface BatchResponse {
  predictions: string[];
  model_type: string;
  count: number;
}

async function predictBatch(samples: CropFeatures[]): Promise<BatchResponse> {
  const response = await fetch('/api/crops/predict/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ samples, model_type: 'random_forest' })
  });
  return response.json();
}
```

---

### 7. Ping

Simple endpoint to check if the API is responding.

```
GET /ping
```

**Response** `200 OK`
```json
{
  "message": "pong"
}
```

---

## Error Responses

All endpoints return consistent error responses.

**400 Bad Request** - Validation errors
```json
{
  "detail": "Missing required features: {'N', 'P'}",
  "code": "VALIDATION_ERROR"
}
```

**500 Internal Server Error** - Server-side errors
```json
{
  "detail": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

---

## Complete TypeScript SDK

```typescript
// types.ts
export interface CropFeatures {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export interface RecommendationItem {
  crop: string;
  probability: number;
}

export interface PredictionResponse {
  crop: string;
  model_type: string;
}

export interface TopKResponse {
  recommendations: RecommendationItem[];
  model_type: string;
}

export interface RecommendationReport {
  input_conditions: CropFeatures;
  recommended_crop: string;
  confidence: number;
  top_recommendations: RecommendationItem[];
  model_type: string;
}

export interface BatchResponse {
  predictions: string[];
  model_type: string;
  count: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  models: Record<string, string>;
}

export interface ModelInfo {
  available_models: string[];
  feature_names: string[];
  feature_ranges: Record<string, [number, number]>;
}

export type ModelType = 'random_forest' | 'neural_network';

// api.ts
const BASE_URL = 'https://your-api-domain.com/api';

class AkonProjectAPI {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async health(): Promise<HealthResponse> {
    const res = await fetch(`${this.baseUrl}/health`);
    return res.json();
  }

  async getModelInfo(): Promise<ModelInfo> {
    const res = await fetch(`${this.baseUrl}/models/info`);
    return res.json();
  }

  async predict(
    features: CropFeatures,
    modelType: ModelType = 'random_forest'
  ): Promise<PredictionResponse> {
    const res = await fetch(
      `${this.baseUrl}/crops/predict?model_type=${modelType}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
      }
    );
    return res.json();
  }

  async predictTopK(
    features: CropFeatures,
    k: number = 3,
    modelType: ModelType = 'random_forest'
  ): Promise<TopKResponse> {
    const res = await fetch(
      `${this.baseUrl}/crops/predict/top-k?k=${k}&model_type=${modelType}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
      }
    );
    return res.json();
  }

  async recommend(
    features: CropFeatures,
    topK: number = 5,
    modelType: ModelType = 'random_forest'
  ): Promise<RecommendationReport> {
    const res = await fetch(
      `${this.baseUrl}/crops/recommend?top_k=${topK}&model_type=${modelType}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
      }
    );
    return res.json();
  }

  async predictBatch(
    samples: CropFeatures[],
    modelType: ModelType = 'random_forest'
  ): Promise<BatchResponse> {
    const res = await fetch(`${this.baseUrl}/crops/predict/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ samples, model_type: modelType }),
    });
    return res.json();
  }
}

export const api = new AkonProjectAPI();
```

---

## Usage Examples

### React Hook Example

```typescript
import { useState } from 'react';
import { api, CropFeatures, RecommendationReport } from './api';

export function useCropRecommendation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationReport | null>(null);

  const getRecommendation = async (features: CropFeatures) => {
    setLoading(true);
    setError(null);
    try {
      const report = await api.recommend(features);
      setResult(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, result, getRecommendation };
}
```

### Form Component Example

```tsx
import { useState } from 'react';
import { useCropRecommendation } from './hooks';

export function CropForm() {
  const [features, setFeatures] = useState({
    N: 90, P: 42, K: 43,
    temperature: 20.87, humidity: 82.0,
    ph: 6.5, rainfall: 202.9
  });
  
  const { loading, error, result, getRecommendation } = useCropRecommendation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    getRecommendation(features);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Input fields for each feature */}
      <input
        type="number"
        value={features.N}
        onChange={(e) => setFeatures({ ...features, N: +e.target.value })}
        placeholder="Nitrogen (N)"
      />
      {/* ... other inputs ... */}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Analyzing...' : 'Get Recommendation'}
      </button>
      
      {error && <p className="error">{error}</p>}
      
      {result && (
        <div>
          <h3>Recommended: {result.recommended_crop}</h3>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
        </div>
      )}
    </form>
  );
}
```

---

## CORS

The API has CORS enabled for all origins. You can make requests from any frontend domain.

---

## Rate Limits

Currently no rate limits. Please use responsibly.
