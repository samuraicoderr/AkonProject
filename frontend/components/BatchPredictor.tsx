"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
} from "lucide-react";
import { Button, Card, Badge, Progress } from "./ui";
import CropService, {
  type CropFeatures,
  type ModelType,
} from "@/lib/api/services/CropService";
import { useCropStore } from "@/lib/api/stores/cropStore";

interface ParsedSample extends CropFeatures {
  id: number;
}

interface BatchResult {
  samples: ParsedSample[];
  predictions: string[];
  modelType: ModelType;
}

export function BatchPredictor() {
  const [samples, setSamples] = useState<ParsedSample[]>([]);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modelType = useCropStore((s) => s.modelType);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setUploadProgress(0);

      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress((event.loaded / event.total) * 100);
        }
      };

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = parseCSV(content);
          setSamples(parsed);
          setResult(null);
          setUploadProgress(100);
        } catch {
          setError("Failed to parse CSV file. Please check the format.");
        }
      };

      reader.onerror = () => {
        setError("Failed to read file.");
      };

      reader.readAsText(file);
    },
    []
  );

  const parseCSV = (content: string): ParsedSample[] => {
    const lines = content.trim().split("\n");
    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());

    const requiredHeaders = [
      "n",
      "p",
      "k",
      "temperature",
      "humidity",
      "ph",
      "rainfall",
    ];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
    }

    const samples: ParsedSample[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => parseFloat(v.trim()));

      if (values.some(isNaN)) continue;

      samples.push({
        id: i,
        N: values[headers.indexOf("n")],
        P: values[headers.indexOf("p")],
        K: values[headers.indexOf("k")],
        temperature: values[headers.indexOf("temperature")],
        humidity: values[headers.indexOf("humidity")],
        ph: values[headers.indexOf("ph")],
        rainfall: values[headers.indexOf("rainfall")],
      });
    }

    return samples;
  };

  const handleBatchPredict = async () => {
    if (samples.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await CropService.predictBatch({
        samples: samples.map((sample) => {
          const { id, ...rest } = sample;
          void id;
          return rest;
        }),
        model_type: modelType,
      });

      setResult({
        samples,
        predictions: response.predictions,
        modelType: response.model_type,
      });
    } catch {
      setError("Batch prediction failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResults = () => {
    if (!result) return;

    const headers = [
      "N",
      "P",
      "K",
      "Temperature",
      "Humidity",
      "pH",
      "Rainfall",
      "Predicted_Crop",
    ];
    const rows = result.samples.map((sample, i) => [
      sample.N,
      sample.P,
      sample.K,
      sample.temperature,
      sample.humidity,
      sample.ph,
      sample.rainfall,
      result.predictions[i],
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `crop_predictions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setSamples([]);
    setResult(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card variant="elevated">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-[#2d2424]">
              Upload Samples
            </h3>
            <p className="text-sm text-[#8c7b7b]">
              CSV with columns: N, P, K, temperature, humidity, ph, rainfall
            </p>
          </div>
          {samples.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-[#efe4e4] rounded-3xl p-10 text-center cursor-pointer hover:border-[#bf9494] hover:bg-[#fbf9f8] transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#efe4e4] flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-[#8a6a6a]" />
            </div>
            <p className="text-sm font-medium text-[#2d2424] mb-1">
              Drop your CSV file here or click to upload
            </p>
            <p className="text-xs text-[#8c7b7b]">
              Required columns: N, P, K, temperature, humidity, ph, rainfall
            </p>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-5">
              <Progress value={uploadProgress} size="sm" />
            </div>
          )}
        </div>

        {/* Template Download */}
        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-[#8c7b7b]">
          <FileText className="w-4 h-4" />
          <span>Need a template?</span>
          <button
            onClick={() => downloadTemplate()}
            className="text-[#8a6a6a] hover:text-[#2d2424] font-medium underline underline-offset-2"
          >
            Download CSV template
          </button>
        </div>
      </Card>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Samples Preview */}
      <AnimatePresence>
        {samples.length > 0 && !result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card variant="elevated">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-[#bf9494]" />
                  <span className="font-medium text-[#2d2424]">
                    {samples.length} samples loaded
                  </span>
                  <Badge variant="primary">
                    {modelType === "random_forest" ? "Random Forest" : "Neural Network"}
                  </Badge>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  loading={isLoading}
                  onClick={handleBatchPredict}
                  className="!rounded-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Predictions
                </Button>
              </div>

              <PreviewTable samples={samples} />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card variant="elevated">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#94a98c]" />
                  <span className="font-medium text-[#2d2424]">
                    Predictions Complete
                  </span>
                  <Badge variant="success">{result.predictions.length} results</Badge>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={downloadResults}
                  className="!rounded-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </div>

              <ResultsTable result={result} />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------- PREVIEW TABLE ----------------------------- */

function PreviewTable({ samples }: { samples: ParsedSample[] }) {
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#efe4e4]">
            {["#", "N", "P", "K", "Temp", "Humidity", "pH", "Rainfall"].map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left text-xs font-semibold text-[#8c7b7b]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {samples.slice(0, 5).map((sample) => (
            <tr key={sample.id} className="border-b border-[#f5f0ef]">
              <td className="px-3 py-2.5 text-[#8c7b7b]">{sample.id}</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.N}</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.P}</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.K}</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.temperature}°C</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.humidity}%</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.ph}</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.rainfall}mm</td>
            </tr>
          ))}
        </tbody>
      </table>
      {samples.length > 5 && (
        <p className="text-xs text-[#8c7b7b] text-center py-3">
          and {samples.length - 5} more samples...
        </p>
      )}
    </div>
  );
}

/* ----------------------------- RESULTS TABLE ----------------------------- */

function ResultsTable({ result }: { result: BatchResult }) {
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#efe4e4]">
            {["#", "N", "P", "K", "Temp", "Humidity", "pH", "Rainfall", "Crop"].map(
              (h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-[#8c7b7b]"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {result.samples.slice(0, 10).map((sample, i) => (
            <tr key={sample.id} className="border-b border-[#f5f0ef]">
              <td className="px-3 py-2.5 text-[#8c7b7b]">{sample.id}</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.N}</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.P}</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.K}</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.temperature}°C</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.humidity}%</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.ph}</td>
              <td className="px-3 py-2.5 text-[#2d2424]">{sample.rainfall}mm</td>
              <td className="px-3 py-2.5">
                <Badge variant="success" size="sm" className="capitalize">
                  {result.predictions[i]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {result.samples.length > 10 && (
        <p className="text-xs text-[#8c7b7b] text-center py-3">
          and {result.samples.length - 10} more results in downloaded CSV...
        </p>
      )}
    </div>
  );
}

/* ----------------------------- HELPER FUNCTIONS ----------------------------- */

function downloadTemplate() {
  const template = `N,P,K,temperature,humidity,ph,rainfall
90,42,43,20.87,82.0,6.5,202.9
85,58,41,21.77,80.3,7.0,226.6
60,55,44,23.00,82.3,7.8,263.9`;

  const blob = new Blob([template], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "crop_prediction_template.csv";
  a.click();

  URL.revokeObjectURL(url);
}
