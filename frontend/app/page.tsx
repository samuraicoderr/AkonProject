"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import {
  Leaf,
  Sparkles,
  Layers,
  MessageCircle,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Brain,
  Zap,
  TrendingUp,
  ChevronRight,
  Menu,
  X,
  BarChart3
} from "lucide-react";
import { Card, Badge, Tabs, Skeleton } from "@/components/ui";
import { InputForm, QuickPresets } from "@/components/InputForm";
import { ResultCard, InsightsCard, ConditionDisplay } from "@/components/ResultCard";
import { ChatAssistant } from "@/components/ChatAssistant";
import { BatchPredictor } from "@/components/BatchPredictor";
import { useCropStore } from "@/lib/api/stores/cropStore";
import CropService from "@/lib/api/services/CropService";
import GroqService, { type CropInsight, type SoilAnalysis } from "@/lib/api/services/GroqService";

/* ----------------------------- MAIN APP ----------------------------- */

export default function HomePage() {
  const [activeView, setActiveView] = useState<"predict" | "batch" | "chat">("predict");
  const [insights, setInsights] = useState<CropInsight | null>(null);
  const [soilAnalysis, setSoilAnalysis] = useState<SoilAnalysis | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [soilLoading, setSoilLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    features,
    modelType,
    topK,
    prediction,
    isLoading,
    error,
    healthStatus,
    setPrediction,
    setLoading,
    setError,
    setHealthStatus,
  } = useCropStore();

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await CropService.health();
        setHealthStatus(health);
      } catch (err) {
        setHealthStatus({ status: "unhealthy", models: {} });
      }
    };
    checkHealth();
  }, [setHealthStatus]);

  // Get prediction
  const handlePredict = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInsights(null);
    setSoilAnalysis(null);

    try {
      const result = await CropService.recommend(features, topK, modelType);
      setPrediction(result);
      toast.success(`Recommended: ${result.recommended_crop}`, {
        icon: "🌱",
        duration: 3000,
      });

      // Fetch AI insights in background
      setInsightsLoading(true);
      setSoilLoading(true);
      
      Promise.all([
        GroqService.getCropInsights(result, features).then(setInsights).catch(() => null),
        GroqService.analyzeSoil(features).then(setSoilAnalysis).catch(() => null),
      ]).finally(() => {
        setInsightsLoading(false);
        setSoilLoading(false);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get prediction");
      toast.error("Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [features, modelType, topK, setLoading, setError, setPrediction]);

  const tabs = [
    { id: "predict", label: "Single Prediction", icon: <Leaf className="w-4 h-4" /> },
    { id: "batch", label: "Batch Upload", icon: <Layers className="w-4 h-4" /> },
    { id: "chat", label: "AI Assistant", icon: <MessageCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">AkonProject</h1>
                <p className="text-xs text-slate-500">AI Crop Advisor</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Tabs 
                tabs={tabs} 
                activeTab={activeView} 
                onChange={(id) => setActiveView(id as typeof activeView)} 
              />
            </nav>

            {/* Status & Mobile Menu */}
            <div className="flex items-center gap-3">
              <HealthIndicator status={healthStatus?.status || "unknown"} />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200 bg-white"
            >
              <div className="px-4 py-3 space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveView(tab.id as typeof activeView);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      activeView === tab.id
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section (only on predict view without results) */}
        {activeView === "predict" && !prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge variant="success" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by Machine Learning
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Find the Perfect Crop<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">
                for Your Farm
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Enter your soil and climate conditions to get instant, AI-powered crop recommendations.
              No signup required.
            </p>
          </motion.div>
        )}

        {/* Content Views */}
        <AnimatePresence mode="wait">
          {activeView === "predict" && (
            <motion.div
              key="predict"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-12 gap-8"
            >
              {/* Input Panel */}
              <div className="lg:col-span-5">
                <Card variant="elevated" className="sticky top-24">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-semibold text-slate-900">Input Conditions</h3>
                  </div>
                  
                  <QuickPresets onSelect={() => {}} />
                  
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <InputForm onSubmit={handlePredict} isLoading={isLoading} />
                  </div>
                </Card>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-7 space-y-6">
                {/* Error State */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}

                {/* Loading State */}
                {isLoading && !prediction && <LoadingState />}

                {/* Results */}
                {prediction && (
                  <>
                    <ConditionDisplay features={features} />
                    <ResultCard prediction={prediction} isLoading={isLoading} />
                    
                    {/* Soil Analysis */}
                    {(soilLoading || soilAnalysis) && (
                      <SoilAnalysisCard analysis={soilAnalysis} isLoading={soilLoading} />
                    )}
                    
                    {/* AI Insights */}
                    <InsightsCard 
                      insights={insights} 
                      isLoading={insightsLoading}
                      cropName={prediction.recommended_crop}
                    />
                  </>
                )}

                {/* Empty State */}
                {!prediction && !isLoading && !error && (
                  <EmptyState />
                )}
              </div>
            </motion.div>
          )}

          {activeView === "batch" && (
            <motion.div
              key="batch"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Batch Prediction</h2>
                <p className="text-slate-600">Process multiple soil samples at once by uploading a CSV file</p>
              </div>
              <BatchPredictor />
            </motion.div>
          )}

          {activeView === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Farming Assistant</h2>
                <p className="text-slate-600">Ask questions about crops, soil management, and farming best practices</p>
              </div>
              <ChatAssistant />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Leaf className="w-4 h-4 text-emerald-500" />
              <span>AkonProject • AI-Powered Crop Recommendations</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>Model Accuracy: 99.77%</span>
              <span>•</span>
              <span>22 Supported Crops</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ----------------------------- HEALTH INDICATOR ----------------------------- */

function HealthIndicator({ status }: { status: string }) {
  const statusConfig = {
    healthy: { color: "bg-emerald-500", text: "All Systems Operational", icon: CheckCircle2 },
    degraded: { color: "bg-amber-500", text: "Partial Outage", icon: AlertTriangle },
    unhealthy: { color: "bg-red-500", text: "Service Unavailable", icon: AlertTriangle },
    unknown: { color: "bg-slate-400", text: "Checking...", icon: Activity },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown;

  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100">
      <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
      <span className="text-xs text-slate-600">{config.text}</span>
    </div>
  );
}

/* ----------------------------- LOADING STATE ----------------------------- */

function LoadingState() {
  return (
    <Card variant="elevated" className="p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative w-20 h-20 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <Leaf className="absolute inset-0 m-auto w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Analyzing Conditions</h3>
        <p className="text-sm text-slate-500">Running ML models to find the best crop...</p>
      </div>
    </Card>
  );
}

/* ----------------------------- EMPTY STATE ----------------------------- */

function EmptyState() {
  return (
    <Card className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="w-8 h-8 text-emerald-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Analyze</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
        Adjust the sliders on the left to enter your soil and climate conditions, then click &quot;Get Recommendation&quot;
      </p>
      <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-500" />
          <span>Random Forest: 99.77%</span>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-500" />
          <span>Neural Network: 97.95%</span>
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

function SoilAnalysisCard({ analysis, isLoading }: SoilAnalysisCardProps) {
  if (isLoading) {
    return (
      <Card variant="elevated">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-20 w-full mb-4" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!analysis) return null;

  const healthColors = {
    excellent: "bg-emerald-500",
    good: "bg-green-500",
    moderate: "bg-amber-500",
    poor: "bg-red-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card variant="elevated" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-500" />
            <h3 className="text-lg font-bold text-slate-900">Soil Analysis</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${healthColors[analysis.overallHealth]}`} />
            <span className="text-sm font-medium text-slate-700 capitalize">{analysis.overallHealth} Health</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-slate-50">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Nutrient Balance</h4>
            <p className="text-sm text-slate-700">{analysis.nutrientBalance}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">pH Assessment</h4>
            <p className="text-sm text-slate-700">{analysis.phAssessment}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <ChevronRight className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </motion.div>
  );
}
