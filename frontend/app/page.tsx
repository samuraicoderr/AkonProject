"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import {
  Sprout,
  Sparkles,
  Layers,
  MessageCircle,
  AlertTriangle,
  Cpu,
  Brain,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card, Badge, PillTabs } from "@/components/ui";
import { InputForm, QuickPresets } from "@/components/InputForm";
import { ResultCard, InsightsCard } from "@/components/ResultCard";
import { ChatAssistant } from "@/components/ChatAssistant";
import { BatchPredictor } from "@/components/BatchPredictor";
import { cn } from "@/lib/utils";
import { useCropStore } from "@/lib/api/stores/cropStore";
import CropService from "@/lib/api/services/CropService";
import GroqService, { type CropInsight } from "@/lib/api/services/GroqService";

type View = "predict" | "batch" | "chat";

export default function HomePage() {
  const [activeView, setActiveView] = useState<View>("predict");
  const [insights, setInsights] = useState<CropInsight | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const {
    features,
    modelType,
    topK,
    prediction,
    healthStatus,
    setPrediction,
    setLoading,
    setError,
    setHealthStatus,
  } = useCropStore();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await CropService.health();
        setHealthStatus(health);
      } catch {
        setHealthStatus({ status: "unhealthy", models: {} });
      }
    };
    checkHealth();
  }, [setHealthStatus]);

  const handlePredict = useCallback(async () => {
    setLoading(true);
    setError(null);
      setInsights(null);

    try {
      const result = await CropService.recommend(features, topK, modelType);
      setPrediction(result);
      toast.success(`Recommended: ${result.recommended_crop}`, {
        icon: "🌱",
        duration: 3000,
      });

      setInsightsLoading(true);

      GroqService.getCropInsights(result, features)
        .then(setInsights)
        .catch(() => null)
        .finally(() => setInsightsLoading(false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get prediction");
      toast.error("Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [features, modelType, topK, setLoading, setError, setPrediction]);

  const tabs = [
    { id: "predict", label: "Predict", icon: <Sprout className="w-4 h-4" /> },
    { id: "batch", label: "Batch", icon: <Layers className="w-4 h-4" /> },
    { id: "chat", label: "Ask AI", icon: <MessageCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#fbf9f8] grain relative overflow-x-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#2d2424",
            border: "1px solid #efe4e4",
            borderRadius: "20px",
            padding: "14px 20px",
            boxShadow: "0 12px 40px rgba(45, 36, 36, 0.08)",
          },
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50">
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <div className="glass rounded-full px-4 py-3 shadow-sm shadow-[#2d2424]/[0.03]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#bf9494] flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-[#2d2424] leading-none">
                    AkonProject
                  </h1>
                  <p className="text-xs text-[#8c7b7b] mt-0.5">Crop intelligence</p>
                </div>
              </div>
              <HealthDot status={healthStatus?.status || "unknown"} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-32 pt-8">
        {/* Hero */}
        {activeView === "predict" && !prediction && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center mb-10"
          >
            <Badge variant="primary" className="mb-5">
              <Sparkles className="w-3 h-3 mr-1.5" />
              ML-powered recommendations
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#2d2424] leading-tight mb-4">
              Discover the perfect
              <br />
              <span className="text-[#bf9494]">crop for your soil</span>
            </h2>
            <p className="text-[#8c7b7b] text-base max-w-sm mx-auto leading-relaxed">
              Enter your soil and climate conditions. Our models analyze the data
              and suggest the best crop to plant.
            </p>
          </motion.section>
        )}

        {/* View Switcher */}
        <div className="flex justify-center mb-8">
          <PillTabs
            tabs={tabs}
            activeTab={activeView}
            onChange={(id) => setActiveView(id as View)}
          />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeView === "predict" && (
            <PredictView
              key="predict"
              onPredict={handlePredict}
              insights={insights}
              insightsLoading={insightsLoading}
            />
          )}

          {activeView === "batch" && (
            <motion.div
              key="batch"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-[#2d2424] mb-2">
                  Batch Prediction
                </h3>
                <p className="text-sm text-[#8c7b7b]">
                  Upload a CSV with multiple samples and predict them all at once.
                </p>
              </div>
              <BatchPredictor />
            </motion.div>
          )}

          {activeView === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-[#2d2424] mb-2">
                  Ask the Farming AI
                </h3>
                <p className="text-sm text-[#8c7b7b]">
                  Get personalized advice about crops, soil, and best practices.
                </p>
              </div>
              <ChatAssistant />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#efe4e4] mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-[#8c7b7b]">
            AkonProject • AI-powered crop intelligence • 22 crops supported
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ----------------------------- PREDICT VIEW ----------------------------- */

interface PredictViewProps {
  onPredict: () => void;
  insights: CropInsight | null;
  insightsLoading: boolean;
}

function PredictView({
  onPredict,
  insights,
  insightsLoading,
}: PredictViewProps) {
  const { prediction, isLoading, error } = useCropStore();

  // Keep error state mounted for transitions
  void error;

  return (
    <motion.div
      key="predict"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Input Card */}
      <Card variant="elevated" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#bf9494]/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[#efe4e4] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#8a6a6a]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#2d2424]">
                Input Conditions
              </h3>
              <p className="text-sm text-[#8c7b7b]">
                Adjust sliders to match your field data
              </p>
            </div>
          </div>

          <QuickPresets onSelect={() => {}} />

          <div className="mt-8 pt-8 border-t border-[#efe4e4]">
            <InputForm onSubmit={onPredict} isLoading={isLoading} />
          </div>
        </div>
      </Card>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && !prediction && <LoadingState />}

      {/* Results */}
          <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <ResultCard prediction={prediction} isLoading={isLoading} />

            <InsightsCard
              insights={insights}
              isLoading={insightsLoading}
              cropName={prediction.recommended_crop}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty */}
      {!prediction && !isLoading && !error && <EmptyState />}
    </motion.div>
  );
}

/* ----------------------------- HEALTH DOT ----------------------------- */

function HealthDot({ status }: { status: string }) {
  const statusConfig = {
    healthy: { color: "bg-[#94a98c]", label: "Online" },
    degraded: { color: "bg-[#c4a484]", label: "Degraded" },
    unhealthy: { color: "bg-red-400", label: "Offline" },
    unknown: { color: "bg-[#d9baba]", label: "Checking" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5f0ef]">
      <span className={cn("w-2 h-2 rounded-full", config.color)} />
      <span className="text-xs font-medium text-[#8c7b7b]">{config.label}</span>
    </div>
  );
}

/* ----------------------------- LOADING STATE ----------------------------- */

function LoadingState() {
  return (
    <Card variant="soft" className="py-14 text-center">
      <div className="relative w-24 h-24 mx-auto mb-5">
        <div className="absolute inset-0 rounded-full border-4 border-[#efe4e4]" />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-[#bf9494] border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <Sprout className="absolute inset-0 m-auto w-8 h-8 text-[#bf9494]" />
      </div>
      <h3 className="text-lg font-semibold text-[#2d2424] mb-1">
        Analyzing your soil
      </h3>
      <p className="text-sm text-[#8c7b7b]">
        Running models to find the best match...
      </p>
    </Card>
  );
}

/* ----------------------------- EMPTY STATE ----------------------------- */

function EmptyState() {
  return (
    <Card variant="soft" className="py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[#efe4e4] flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="w-7 h-7 text-[#bf9494]" />
      </div>
      <h3 className="text-lg font-semibold text-[#2d2424] mb-2">
        Ready when you are
      </h3>
      <p className="text-sm text-[#8c7b7b] max-w-xs mx-auto mb-6">
        Set your conditions and tap the button to get a recommendation.
      </p>
      <div className="flex items-center justify-center gap-6 text-sm text-[#8c7b7b]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#94a98c]" />
          <span>Random Forest</span>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#bf9494]" />
          <span>Neural Network</span>
        </div>
      </div>
    </Card>
  );
}


