"use client";

import { motion } from "framer-motion";
import {
  Leaf,
  Activity,
  Zap,
  TrendingUp,
  Droplets,
  CheckCircle2,
} from "lucide-react";
import { Badge, Progress, Card, Skeleton } from "./ui";
import type {
  RecommendationReportOut,
  RecommendationItem,
} from "@/lib/api/services/CropService";
import type { CropInsight, SoilAnalysis } from "@/lib/api/services/GroqService";

const cropEmojis: Record<string, string> = {
  apple: "🍎",
  banana: "🍌",
  blackgram: "🫘",
  chickpea: "🫛",
  coconut: "🥥",
  coffee: "☕",
  cotton: "🌾",
  grapes: "🍇",
  jute: "🌿",
  kidneybeans: "🫘",
  lentil: "🥣",
  maize: "🌽",
  mango: "🥭",
  mothbeans: "🫛",
  mungbean: "🌱",
  muskmelon: "🍈",
  orange: "🍊",
  papaya: "🍐",
  pigeonpeas: "🫛",
  pomegranate: "🍎",
  rice: "🍚",
  watermelon: "🍉",
};

/* ----------------------------- MAIN RESULT CARD ----------------------------- */

interface ResultCardProps {
  prediction: RecommendationReportOut;
  isLoading?: boolean;
}

export function ResultCard({ prediction, isLoading }: ResultCardProps) {
  if (isLoading) {
    return <ResultCardSkeleton />;
  }

  const confidence = prediction.confidence * 100;
  const emoji = cropEmojis[prediction.recommended_crop.toLowerCase()] || "🌱";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card variant="elevated" className="relative overflow-hidden">
        {/* Soft decorative blob */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#bf9494]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#94a98c]/10 rounded-full blur-3xl" />

        <div className="relative">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="w-20 h-20 rounded-3xl bg-[#efe4e4] flex items-center justify-center text-4xl"
              >
                {emoji}
              </motion.div>
              <div>
                <p className="text-xs font-semibold text-[#8c7b7b] uppercase tracking-wider mb-1">
                  Recommended Crop
                </p>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#2d2424] capitalize">
                  {prediction.recommended_crop}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="primary" size="sm">
                    {prediction.model_type === "random_forest"
                      ? "Random Forest"
                      : "Neural Network"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Confidence Ring */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#efe4e4"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#bf9494"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 301.6" }}
                  animate={{
                    strokeDasharray: `${(confidence / 100) * 301.6} 301.6`,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold text-[#2d2424]">
                  {confidence.toFixed(0)}%
                </span>
                <span className="text-xs text-[#8c7b7b]">confidence</span>
              </div>
            </div>
          </div>

          {/* Top Recommendations */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#2d2424] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#8c7b7b]" />
              Top Matches
            </h3>
            <div className="space-y-3">
              {prediction.top_recommendations.slice(0, 5).map((rec, index) => (
                <RecommendationRow
                  key={rec.crop}
                  recommendation={rec}
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ----------------------------- RECOMMENDATION ROW ----------------------------- */

interface RecommendationRowProps {
  recommendation: RecommendationItem;
  rank: number;
}

function RecommendationRow({ recommendation, rank }: RecommendationRowProps) {
  const probability = recommendation.probability * 100;
  const emoji = cropEmojis[recommendation.crop.toLowerCase()] || "🌱";

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.08 }}
      className="flex items-center gap-3 p-3 rounded-2xl bg-[#f5f0ef] hover:bg-[#efe4e4] transition-colors"
    >
      <span className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-[#8c7b7b] bg-white rounded-full">
        {rank}
      </span>
      <span className="text-2xl">{emoji}</span>
      <span className="flex-1 font-medium text-[#2d2424] capitalize">
        {recommendation.crop}
      </span>
      <div className="w-24 sm:w-32">
        <Progress
          value={probability}
          size="sm"
          variant={rank === 1 ? "default" : "default"}
        />
      </div>
      <span className="w-14 text-right text-sm font-semibold text-[#8a6a6a]">
        {probability.toFixed(0)}%
      </span>
    </motion.div>
  );
}

/* ----------------------------- SKELETON ----------------------------- */

function ResultCardSkeleton() {
  return (
    <Card variant="elevated">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-5 w-56" />
            </div>
          </div>
        </div>
        <Skeleton className="w-24 h-24 rounded-full" />
      </div>
      <Skeleton className="h-5 w-40 mb-3" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-14 w-full mb-2" />
      ))}
    </Card>
  );
}

/* ----------------------------- AI INSIGHTS CARD ----------------------------- */

interface InsightsCardProps {
  insights: CropInsight | null;
  isLoading?: boolean;
  cropName?: string;
}

export function InsightsCard({ insights, isLoading, cropName }: InsightsCardProps) {
  if (isLoading) {
    return <InsightsCardSkeleton />;
  }

  if (!insights) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <Card variant="elevated" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#bf9494] via-[#d9baba] to-[#94a98c]" />

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#efe4e4] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#8a6a6a]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#2d2424]">
              AI Insights for {cropName && <span className="capitalize">{cropName}</span>}
            </h3>
            <p className="text-xs text-[#8c7b7b]">Powered by Llama 3.3</p>
          </div>
        </div>

        <p className="text-[#8c7b7b] mb-8 leading-relaxed">{insights.summary}</p>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="text-sm font-semibold text-[#2d2424] flex items-center gap-2 mb-4">
              <Leaf className="w-4 h-4 text-[#94a98c]" />
              Planting Tips
            </h4>
            <ul className="space-y-3">
              {insights.plantingTips.map((tip, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-start gap-3 text-sm text-[#8c7b7b]"
                >
                  <span className="w-5 h-5 flex items-center justify-center bg-[#efe4e4] text-[#8a6a6a] rounded-full text-xs font-semibold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </motion.li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#2d2424] flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#c4a484]" />
              Risk Factors
            </h4>
            <ul className="space-y-3">
              {insights.riskFactors.map((risk, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-start gap-3 text-sm text-[#8c7b7b]"
                >
                  <span className="w-1.5 h-1.5 bg-[#bf9494] rounded-full flex-shrink-0 mt-2" />
                  {risk}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <InfoPill
            icon={TrendingUp}
            label="Expected Yield"
            value={insights.expectedYield}
            tone="sage"
          />
          <InfoPill
            icon={Droplets}
            label="Seasonal Advice"
            value={insights.seasonalAdvice}
            tone="primary"
          />
          <InfoPill
            icon={Activity}
            label="Market Insights"
            value={insights.marketInsights}
            tone="warm"
          />
        </div>
      </Card>
    </motion.div>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: "sage" | "primary" | "warm";
}) {
  const tones = {
    sage: "bg-[#e8efe6] text-[#5a7352]",
    primary: "bg-[#efe4e4] text-[#8a6a6a]",
    warm: "bg-[#f5f0e6] text-[#8a7a5a]",
  };

  return (
    <div className={`p-4 rounded-2xl ${tones[tone]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 opacity-70" />
        <span className="text-[11px] font-semibold uppercase opacity-70">{label}</span>
      </div>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function InsightsCardSkeleton() {
  return (
    <Card variant="elevated">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-16 w-full mb-6" />
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <Skeleton className="h-5 w-32 mb-3" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full mb-2" />
          ))}
        </div>
        <div>
          <Skeleton className="h-5 w-32 mb-3" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full mb-2" />
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ----------------------------- SOIL ANALYSIS CARD ----------------------------- */

interface SoilAnalysisCardProps {
  analysis: SoilAnalysis | null;
  isLoading: boolean;
}

export function SoilAnalysisCard({ analysis, isLoading }: SoilAnalysisCardProps) {
  if (isLoading) {
    return (
      <Card variant="elevated">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!analysis) return null;

  const healthColors = {
    excellent: "bg-[#94a98c]",
    good: "bg-[#bf9494]",
    moderate: "bg-[#c4a484]",
    poor: "bg-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card variant="elevated">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f5f0ef] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#8a6a6a]" />
            </div>
            <h3 className="text-lg font-semibold text-[#2d2424]">Soil Health</h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${healthColors[analysis.overallHealth]}`}
            />
            <span className="text-sm font-medium text-[#2d2424] capitalize">
              {analysis.overallHealth}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-[#f5f0ef]">
            <h4 className="text-xs font-semibold text-[#8c7b7b] uppercase mb-2">
              Nutrient Balance
            </h4>
            <p className="text-sm text-[#2d2424]">{analysis.nutrientBalance}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#f5f0ef]">
            <h4 className="text-xs font-semibold text-[#8c7b7b] uppercase mb-2">
              pH Assessment
            </h4>
            <p className="text-sm text-[#2d2424]">{analysis.phAssessment}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#2d2424] mb-3">Recommendations</h4>
          <ul className="space-y-3">
            {analysis.recommendations.map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-[#8c7b7b]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#bf9494] flex-shrink-0 mt-0.5" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </motion.div>
  );
}
