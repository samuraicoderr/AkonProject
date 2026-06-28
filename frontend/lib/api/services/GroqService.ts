/**
 * GROQ AI Service for enhanced crop insights
 * Uses the OpenAI-compatible API
 */

import type { CropFeatures, RecommendationReportOut } from "./CropService";

/* ----------------------------- TYPES ----------------------------- */

export interface CropInsight {
  summary: string;
  plantingTips: string[];
  expectedYield: string;
  seasonalAdvice: string;
  riskFactors: string[];
  marketInsights: string;
}

export interface SoilAnalysis {
  overallHealth: "excellent" | "good" | "moderate" | "poor";
  nutrientBalance: string;
  phAssessment: string;
  recommendations: string[];
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/* ----------------------------- SERVICE ----------------------------- */

class GroqService {
  /**
   * Get detailed AI insights for a crop recommendation
   */
  static async getCropInsights(
    recommendation: RecommendationReportOut,
    features: CropFeatures
  ): Promise<CropInsight> {
    const response = await fetch("/api/ai/crop-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recommendation, features }),
    });

    if (!response.ok) {
      throw new Error("Failed to get crop insights");
    }

    return response.json();
  }

  /**
   * Analyze soil conditions
   */
  static async analyzeSoil(features: CropFeatures): Promise<SoilAnalysis> {
    const response = await fetch("/api/ai/soil-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze soil");
    }

    return response.json();
  }

  /**
   * Chat with AI farming assistant
   */
  static async chat(
    messages: ChatMessage[],
    context?: { features?: CropFeatures; recommendation?: RecommendationReportOut }
  ): Promise<string> {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, context }),
    });

    if (!response.ok) {
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    return data.message;
  }

  /**
   * Stream chat response
   */
  static async *chatStream(
    messages: ChatMessage[],
    context?: { features?: CropFeatures; recommendation?: RecommendationReportOut }
  ): AsyncGenerator<string, void, unknown> {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, context, stream: true }),
    });

    if (!response.ok) {
      throw new Error("Failed to get AI response");
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No response body");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  }
}

export default GroqService;
