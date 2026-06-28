"use client";

import { motion } from "framer-motion";
import { Leaf, Activity, Zap, TrendingUp, Droplets, Thermometer } from "lucide-react";
import { Badge, Progress, Card, Skeleton } from "./ui";
import type { RecommendationReportOut, RecommendationItem } from "@/lib/api/services/CropService";
import type { CropInsight } from "@/lib/api/services/GroqService";

/* ----------------------------- CROP ICONS ----------------------------- */

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card variant="elevated" className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                Recommended Crop
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-5xl">{emoji}</span>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 capitalize">
                    {prediction.recommended_crop}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="success" size="sm">
                      {prediction.model_type === "random_forest" ? "Random Forest" : "Neural Network"}
                    </Badge>
                    <Badge variant="info" size="sm">
                      99.77% Model Accuracy
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Confidence Circle */}
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: `${(confidence / 100) * 251.2} 251.2` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-900">{confidence.toFixed(0)}%</span>
                <span className="text-xs text-slate-500">confidence</span>
              </div>
            </div>
          </div>

          {/* Top Recommendations */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Recommendations
            </h3>
            <div className="space-y-2">
              {prediction.top_recommendations.slice(0, 5).map((rec, index) => (
                <RecommendationRow key={rec.crop} recommendation={rec} rank={index + 1} />
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
    >
      <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-400">
        #{rank}
      </span>
      <span className="text-2xl">{emoji}</span>
      <span className="flex-1 font-medium text-slate-700 capitalize">{recommendation.crop}</span>
      <div className="w-32">
        <Progress value={probability} size="sm" variant={rank === 1 ? "gradient" : "default"} />
      </div>
      <span className="w-16 text-right text-sm font-semibold text-slate-600">
        {probability.toFixed(1)}%
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
            <Skeleton className="w-14 h-14 rounded-xl" />
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card variant="elevated" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
        
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-bold text-slate-900">AI-Powered Insights</h3>
          <Badge variant="info" size="sm">Powered by Llama 3.3</Badge>
        </div>

        {/* Summary */}
        <p className="text-slate-600 mb-6 leading-relaxed">{insights.summary}</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Planting Tips */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <Leaf className="w-4 h-4 text-emerald-500" />
              Planting Tips
            </h4>
            <ul className="space-y-2">
              {insights.plantingTips.map((tip, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <span className="w-5 h-5 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Risk Factors */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-amber-500" />
              Risk Factors
            </h4>
            <ul className="space-y-2">
              {insights.riskFactors.map((risk, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0 mt-2" />
                  {risk}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-emerald-50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 uppercase">Expected Yield</span>
            </div>
            <p className="text-sm text-emerald-800">{insights.expectedYield}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700 uppercase">Seasonal Advice</span>
            </div>
            <p className="text-sm text-blue-800">{insights.seasonalAdvice}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-purple-50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-purple-700 uppercase">Market Insights</span>
            </div>
            <p className="text-sm text-purple-800">{insights.marketInsights}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function InsightsCardSkeleton() {
  return (
    <Card variant="elevated">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-16 w-full mb-6" />
      <div className="grid md:grid-cols-2 gap-6">
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

/* ----------------------------- CONDITION DISPLAY ----------------------------- */

interface ConditionDisplayProps {
  features: {
    N: number;
    P: number;
    K: number;
    temperature: number;
    humidity: number;
    ph: number;
    rainfall: number;
  };
}

export function ConditionDisplay({ features }: ConditionDisplayProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
        Input Conditions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ConditionItem icon={<Leaf className="w-4 h-4" />} label="Nitrogen" value={features.N} unit="kg/ha" color="emerald" />
        <ConditionItem icon={<Leaf className="w-4 h-4" />} label="Phosphorus" value={features.P} unit="kg/ha" color="blue" />
        <ConditionItem icon={<Leaf className="w-4 h-4" />} label="Potassium" value={features.K} unit="kg/ha" color="purple" />
        <ConditionItem icon={<Thermometer className="w-4 h-4" />} label="Temperature" value={features.temperature} unit="°C" color="orange" />
        <ConditionItem icon={<Droplets className="w-4 h-4" />} label="Humidity" value={features.humidity} unit="%" color="cyan" />
        <ConditionItem icon={<Activity className="w-4 h-4" />} label="pH Level" value={features.ph} unit="" color="pink" />
        <ConditionItem icon={<Droplets className="w-4 h-4" />} label="Rainfall" value={features.rainfall} unit="mm" color="sky" />
      </div>
    </Card>
  );
}

interface ConditionItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color: string;
}

function ConditionItem({ icon, label, value, unit, color }: ConditionItemProps) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
    cyan: "text-cyan-400",
    pink: "text-pink-400",
    sky: "text-sky-400",
  };

  return (
    <div className="p-3 rounded-xl bg-white/5">
      <div className={`flex items-center gap-2 mb-1 ${colors[color]}`}>
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">
        {value.toFixed(1)}<span className="text-xs text-slate-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}
