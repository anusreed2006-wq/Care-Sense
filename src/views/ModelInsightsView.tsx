import React, { useEffect, useState } from 'react';
import { modelService, GlobalFeatureImportance } from '../services/modelService';
import { ModelVersion } from '../types';
import {
  BrainCircuit,
  Cpu,
  ShieldCheck,
  Zap,
  Layers,
  Database,
  CheckCircle2,
  FileCode,
  Gauge,
} from 'lucide-react';

export const ModelInsightsView: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<ModelVersion | null>(null);
  const [features, setFeatures] = useState<GlobalFeatureImportance[]>([]);

  useEffect(() => {
    modelService.getModelInfo().then(setModelInfo);
    setFeatures(modelService.getGlobalFeatureImportance());
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <BrainCircuit size={20} className="text-sky-600" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            CareSense AI Model Architecture & Clinical Calibration
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          LightGBM + Temporal Bi-LSTM Ensemble specifications, feature attribution hierarchies, and validation benchmarks
        </p>
      </div>

      {/* Model Spec Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-2">
            <Cpu size={14} className="text-indigo-600" />
            <span>Architecture</span>
          </div>
          <p className="text-base font-extrabold text-slate-900">
            LightGBM + Bi-LSTM
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporal gradient-boosted tree ensemble
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-2">
            <Zap size={14} className="text-amber-600" />
            <span>Inference Latency</span>
          </div>
          <p className="text-base font-extrabold text-slate-900 font-mono">
            42 ms
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime bedside telemetry cycle
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-2">
            <Gauge size={14} className="text-emerald-600" />
            <span>Validation Metrics</span>
          </div>
          <p className="text-base font-extrabold text-slate-900 font-mono">
            0.884 AUROC
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            0.742 AUPRC • 86% Sensitivity
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-2">
            <ShieldCheck size={14} className="text-sky-600" />
            <span>Calibration</span>
          </div>
          <p className="text-base font-extrabold text-slate-900">
            Isotonic Regression
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrated on Sepsis-3 cohorts
          </p>
        </div>
      </div>

      {/* Global SHAP Feature Importance Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Global Feature Importance & SHAP Attribution Rankings
          </h2>
          <p className="text-xs text-slate-500">
            Derived from multi-center ICU validation datasets across 34 temporal features
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 pl-5 pr-3">Rank</th>
                <th className="px-3 py-3">Feature Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Global Relative Importance</th>
                <th className="px-3 py-3">Mean |SHAP|</th>
                <th className="py-3 pl-3 pr-5">Physiological Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {features.map((feat, idx) => (
                <tr key={feat.feature} className="hover:bg-slate-50/70">
                  <td className="py-3 pl-5 pr-3 font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="px-3 py-3 font-bold text-slate-900">
                    {feat.feature}
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {feat.category}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 w-32">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-600"
                          style={{ width: `${feat.importance}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-600">
                        {feat.importance}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-rose-700">
                    {feat.shapContribution.toFixed(3)}
                  </td>
                  <td className="py-3 pl-3 pr-5 text-slate-500 text-[11px]">
                    {feat.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
