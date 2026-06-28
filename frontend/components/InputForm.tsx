"use client";

import { motion } from "framer-motion";
import { 
  Leaf, 
  Droplets, 
  Thermometer, 
  CloudRain, 
  FlaskConical,
  RotateCcw,
  Cpu,
  Brain
} from "lucide-react";
import { Slider, Button, Tabs, Tooltip } from "./ui";
import { useCropStore } from "@/lib/api/stores/cropStore";
import type { ModelType } from "@/lib/api/services/CropService";

/* ----------------------------- FEATURE CONFIG ----------------------------- */

const featureConfig = [
  {
    key: "N" as const,
    label: "Nitrogen (N)",
    icon: Leaf,
    color: "emerald",
    min: 0,
    max: 140,
    step: 1,
    unit: " kg/ha",
    hint: "Nitrogen content in soil",
  },
  {
    key: "P" as const,
    label: "Phosphorus (P)",
    icon: Leaf,
    color: "blue",
    min: 5,
    max: 145,
    step: 1,
    unit: " kg/ha",
    hint: "Phosphorus content in soil",
  },
  {
    key: "K" as const,
    label: "Potassium (K)",
    icon: Leaf,
    color: "purple",
    min: 5,
    max: 205,
    step: 1,
    unit: " kg/ha",
    hint: "Potassium content in soil",
  },
  {
    key: "temperature" as const,
    label: "Temperature",
    icon: Thermometer,
    color: "orange",
    min: 8,
    max: 44,
    step: 0.1,
    unit: "°C",
    hint: "Average ambient temperature",
  },
  {
    key: "humidity" as const,
    label: "Humidity",
    icon: Droplets,
    color: "cyan",
    min: 14,
    max: 100,
    step: 0.1,
    unit: "%",
    hint: "Relative humidity percentage",
  },
  {
    key: "ph" as const,
    label: "Soil pH",
    icon: FlaskConical,
    color: "pink",
    min: 3.5,
    max: 10,
    step: 0.1,
    unit: "",
    hint: "Soil acidity/alkalinity (neutral: 6.5-7.5)",
  },
  {
    key: "rainfall" as const,
    label: "Rainfall",
    icon: CloudRain,
    color: "sky",
    min: 20,
    max: 300,
    step: 1,
    unit: " mm",
    hint: "Annual rainfall in millimeters",
  },
];

/* ----------------------------- INPUT FORM ----------------------------- */

interface InputFormProps {
  onSubmit: () => void;
  isLoading: boolean;
}

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const { features, setFeature, modelType, setModelType, resetFeatures } = useCropStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Model Selection */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">ML Model</h3>
          <p className="text-xs text-slate-500 mt-0.5">Select prediction model</p>
        </div>
        <ModelSelector value={modelType} onChange={setModelType} />
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Soil Nutrients */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Leaf className="w-4 h-4 text-emerald-500" />
          Soil Nutrients
        </h3>
        <div className="grid gap-5">
          {featureConfig.slice(0, 3).map((config) => (
            <Slider
              key={config.key}
              label={config.label}
              value={features[config.key]}
              onChange={(v) => setFeature(config.key, v)}
              min={config.min}
              max={config.max}
              step={config.step}
              unit={config.unit}
              hint={config.hint}
            />
          ))}
        </div>
      </div>

      {/* Climate Conditions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-orange-500" />
          Climate Conditions
        </h3>
        <div className="grid gap-5">
          {featureConfig.slice(3, 5).map((config) => (
            <Slider
              key={config.key}
              label={config.label}
              value={features[config.key]}
              onChange={(v) => setFeature(config.key, v)}
              min={config.min}
              max={config.max}
              step={config.step}
              unit={config.unit}
              hint={config.hint}
            />
          ))}
        </div>
      </div>

      {/* Soil & Rainfall */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-sky-500" />
          Soil pH & Rainfall
        </h3>
        <div className="grid gap-5">
          {featureConfig.slice(5).map((config) => (
            <Slider
              key={config.key}
              label={config.label}
              value={features[config.key]}
              onChange={(v) => setFeature(config.key, v)}
              min={config.min}
              max={config.max}
              step={config.step}
              unit={config.unit}
              hint={config.hint}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="flex-1"
        >
          {isLoading ? "Analyzing..." : "Get Recommendation"}
        </Button>
        <Tooltip content="Reset to defaults">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={resetFeatures}
            className="!bg-slate-100 !text-slate-600 hover:!bg-slate-200 !border-0"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    </motion.form>
  );
}

/* ----------------------------- MODEL SELECTOR ----------------------------- */

interface ModelSelectorProps {
  value: ModelType;
  onChange: (value: ModelType) => void;
}

function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
      <button
        type="button"
        onClick={() => onChange("random_forest")}
        className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
          value === "random_forest" ? "text-emerald-700" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        {value === "random_forest" && (
          <motion.div
            layoutId="modelSelector"
            className="absolute inset-0 bg-white rounded-lg shadow-sm"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          Random Forest
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange("neural_network")}
        className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
          value === "neural_network" ? "text-emerald-700" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        {value === "neural_network" && (
          <motion.div
            layoutId="modelSelector"
            className="absolute inset-0 bg-white rounded-lg shadow-sm"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Neural Network
        </span>
      </button>
    </div>
  );
}

/* ----------------------------- QUICK PRESETS ----------------------------- */

interface QuickPresetsProps {
  onSelect: () => void;
}

export function QuickPresets({ onSelect }: QuickPresetsProps) {
  const setFeatures = useCropStore((s) => s.setFeatures);

  const presets = [
    {
      name: "Rice Paddy",
      emoji: "🍚",
      features: { N: 80, P: 40, K: 40, temperature: 25, humidity: 80, ph: 6.5, rainfall: 220 },
    },
    {
      name: "Wheat Field",
      emoji: "🌾",
      features: { N: 100, P: 50, K: 50, temperature: 20, humidity: 60, ph: 7.0, rainfall: 100 },
    },
    {
      name: "Coffee Plantation",
      emoji: "☕",
      features: { N: 100, P: 30, K: 30, temperature: 22, humidity: 70, ph: 6.0, rainfall: 180 },
    },
    {
      name: "Tropical Fruit",
      emoji: "🥭",
      features: { N: 20, P: 20, K: 30, temperature: 32, humidity: 85, ph: 5.5, rainfall: 100 },
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Quick Presets</h3>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <motion.button
            key={preset.name}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setFeatures(preset.features);
              onSelect();
            }}
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          >
            <span className="text-2xl">{preset.emoji}</span>
            <span className="text-sm font-medium text-slate-700">{preset.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
