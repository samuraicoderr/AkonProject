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
  FileText
} from "lucide-react";
import { Button, Card, Badge, Progress } from "./ui";
import CropService, { 
  type CropFeatures, 
  type ModelType, 
  type BatchPredictOut 
} from "@/lib/api/services/CropService";
import { useCropStore } from "@/lib/api/stores/cropStore";

/* ----------------------------- TYPES ----------------------------- */

interface ParsedSample extends CropFeatures {
  id: number;
}

interface BatchResult {
  samples: ParsedSample[];
  predictions: string[];
  modelType: ModelType;
}

/* ----------------------------- BATCH PREDICTOR ----------------------------- */

export function BatchPredictor() {
  const [samples, setSamples] = useState<ParsedSample[]>([]);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const modelType = useCropStore((s) => s.modelType);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
      } catch (err) {
        setError("Failed to parse CSV file. Please check the format.");
      }
    };

    reader.onerror = () => {
      setError("Failed to read file.");
    };

    reader.readAsText(file);
  }, []);

  const parseCSV = (content: string): ParsedSample[] => {
    const lines = content.trim().split("\n");
    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
    
    const requiredHeaders = ["n", "p", "k", "temperature", "humidity", "ph", "rainfall"];
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
        samples: samples.map(({ id, ...rest }) => rest),
        model_type: modelType,
      });

      setResult({
        samples,
        predictions: response.predictions,
        modelType: response.model_type,
      });
    } catch (err) {
      setError("Batch prediction failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResults = () => {
    if (!result) return;

    const headers = ["N", "P", "K", "Temperature", "Humidity", "pH", "Rainfall", "Predicted_Crop"];
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Batch Prediction</h3>
            <p className="text-sm text-slate-500">Upload a CSV file with multiple soil samples</p>
          </div>
          {samples.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              Drop your CSV file here or click to upload
            </p>
            <p className="text-xs text-slate-500">
              Required columns: N, P, K, temperature, humidity, ph, rainfall
            </p>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <Progress value={uploadProgress} size="sm" />
            </div>
          )}
        </div>

        {/* Template Download */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
          <FileText className="w-4 h-4" />
          <span>Need a template?</span>
          <button
            onClick={() => downloadTemplate()}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
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
            className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-slate-900">
                    {samples.length} samples loaded
                  </span>
                  <Badge variant="info">{modelType === "random_forest" ? "Random Forest" : "Neural Network"}</Badge>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  loading={isLoading}
                  onClick={handleBatchPredict}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Predictions
                </Button>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">N</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">P</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">K</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Temp</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Humidity</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">pH</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Rainfall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.slice(0, 5).map((sample) => (
                      <tr key={sample.id} className="border-b border-slate-100">
                        <td className="px-3 py-2 text-slate-500">{sample.id}</td>
                        <td className="px-3 py-2 text-slate-700">{sample.N}</td>
                        <td className="px-3 py-2 text-slate-700">{sample.P}</td>
                        <td className="px-3 py-2 text-slate-700">{sample.K}</td>
                        <td className="px-3 py-2 text-slate-700">{sample.temperature}°C</td>
                        <td className="px-3 py-2 text-slate-700">{sample.humidity}%</td>
                        <td className="px-3 py-2 text-slate-700">{sample.ph}</td>
                        <td className="px-3 py-2 text-slate-700">{sample.rainfall}mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {samples.length > 5 && (
                  <p className="text-xs text-slate-500 text-center py-2">
                    and {samples.length - 5} more samples...
                  </p>
                )}
              </div>
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-slate-900">
                    Predictions Complete
                  </span>
                  <Badge variant="success">{result.predictions.length} results</Badge>
                </div>
                <Button variant="primary" size="md" onClick={downloadResults}>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">N</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">P</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">K</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Temp</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Humidity</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">pH</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Rainfall</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-600">Predicted Crop</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.samples.slice(0, 10).map((sample, i) => (
                      <tr key={sample.id} className="border-b border-slate-100">
                        <td className="px-3 py-2 text-slate-500">{sample.id}</td>
                        <td className="px-3 py-2 text-slate-700">{sample.N}</td>
                        <td className="px-3 py-2 text-slate-700">{sample.P}</td>
                        <td className="px-3 py-2 text-slate-700">{sample.K}</td>
                        <td className="px-3 py-2 text-slate-700">{sample.temperature}°C</td>
                        <td className="px-3 py-2 text-slate-700">{sample.humidity}%</td>
                        <td className="px-3 py-2 text-slate-700">{sample.ph}</td>
                        <td className="px-3 py-2 text-slate-700">{sample.rainfall}mm</td>
                        <td className="px-3 py-2">
                          <Badge variant="success" size="sm" className="capitalize">
                            {result.predictions[i]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.samples.length > 10 && (
                  <p className="text-xs text-slate-500 text-center py-2">
                    and {result.samples.length - 10} more results in downloaded CSV...
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
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
