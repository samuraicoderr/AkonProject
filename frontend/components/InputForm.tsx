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
  Brain,
} from "lucide-react";
import { Slider, Button, Tooltip } from "./ui";
import { useCropStore } from "@/lib/api/stores/cropStore";
import type { ModelType } from "@/lib/api/services/CropService";

const featureConfig = [
  {
    key: "N" as const,
    label: "Nitrogen (N)",
    icon: Leaf,
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
    min: 3.5,
    max: 10,
    step: 0.1,
    unit: "",
    hint: "Soil acidity / alkalinity",
  },
  {
    key: "rainfall" as const,
    label: "Rainfall",
    icon: CloudRain,
    min: 20,
    max: 300,
    step: 1,
    unit: " mm",
    hint: "Annual rainfall in millimeters",
  },
];

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* Model Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#2d2424]">ML Model</h3>
          <p className="text-xs text-[#8c7b7b] mt-0.5">Choose a prediction engine</p>
        </div>
        <ModelSelector value={modelType} onChange={setModelType} />
      </div>

      {/* Soil Nutrients */}
      <section className="space-y-5">
        <h3 className="text-sm font-semibold text-[#2d2424] flex items-center gap-2">
          <Leaf className="w-4 h-4 text-[#94a98c]" />
          Soil Nutrients
        </h3>
        <div className="space-y-6">
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
      </section>

      {/* Climate */}
      <section className="space-y-5">
        <h3 className="text-sm font-semibold text-[#2d2424] flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-[#c4a484]" />
          Climate Conditions
        </h3>
        <div className="space-y-6">
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
      </section>

      {/* Soil pH & Rainfall */}
      <section className="space-y-5">
        <h3 className="text-sm font-semibold text-[#2d2424] flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-[#bf9494]" />
          Soil pH & Rainfall
        </h3>
        <div className="space-y-6">
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
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="xl"
          loading={isLoading}
          className="flex-1 rounded-full"
        >
          {isLoading ? "Analyzing..." : "Get Recommendation"}
        </Button>
        <Tooltip content="Reset to defaults">
          <Button
            type="button"
            variant="secondary"
            size="xl"
            onClick={resetFeatures}
            className="!rounded-full !px-4"
          >
            <RotateCcw className="w-5 h-5" />
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
    <div className="flex items-center gap-1 p-1 bg-[#f5f0ef] rounded-full">
      <button
        type="button"
        onClick={() => onChange("random_forest")}
        className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-2 ${
          value === "random_forest"
            ? "text-[#2d2424]"
            : "text-[#8c7b7b] hover:text-[#5a4a4a]"
        }`}
      >
        {value === "random_forest" && (
          <motion.div
            layoutId="modelSelector"
            className="absolute inset-0 bg-white rounded-full shadow-sm"
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
        className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-2 ${
          value === "neural_network"
            ? "text-[#2d2424]"
            : "text-[#8c7b7b] hover:text-[#5a4a4a]"
        }`}
      >
        {value === "neural_network" && (
          <motion.div
            layoutId="modelSelector"
            className="absolute inset-0 bg-white rounded-full shadow-sm"
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
      features: {
        N: 80,
        P: 40,
        K: 40,
        temperature: 25,
        humidity: 80,
        ph: 6.5,
        rainfall: 220,
      },
    },
    {
      name: "Wheat Field",
      emoji: "🌾",
      features: {
        N: 100,
        P: 50,
        K: 50,
        temperature: 20,
        humidity: 60,
        ph: 7,
        rainfall: 100,
      },
    },
    {
      name: "Coffee",
      emoji: "☕",
      features: {
        N: 100,
        P: 30,
        K: 30,
        temperature: 22,
        humidity: 70,
        ph: 6,
        rainfall: 180,
      },
    },
    {
      name: "Tropical Fruit",
      emoji: "🥭",
      features: {
        N: 20,
        P: 20,
        K: 30,
        temperature: 32,
        humidity: 85,
        ph: 5.5,
        rainfall: 100,
      },
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#2d2424]">Quick Presets</h3>
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
            className="flex items-center gap-2 p-3 rounded-2xl bg-[#f5f0ef] hover:bg-[#efe4e4] transition-colors text-left"
          >
            <span className="text-2xl">{preset.emoji}</span>
            <span className="text-sm font-medium text-[#2d2424]">{preset.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
