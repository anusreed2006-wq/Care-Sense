/**
 * CareSense AI Model Insights Service
 * Tracks model versions, architecture specifications, global SHAP importance, and calibration
 */

import { supabase, isSupabaseConfigured, isLiveMode } from '../lib/supabase';
import { ModelVersion } from '../types';
import { INITIAL_MODEL_VERSION } from '../data/demoData';

export interface GlobalFeatureImportance {
  feature: string;
  category: 'Vital Sign' | 'Laboratory' | 'Temporal Derivation' | 'Demographic';
  importance: number; // 0 - 100
  shapContribution: number;
  description: string;
}

export const GLOBAL_FEATURE_IMPORTANCE: GlobalFeatureImportance[] = [
  {
    feature: 'Lactate Elevation & Slope',
    category: 'Laboratory',
    importance: 96,
    shapContribution: 0.285,
    description: '4-hour delta in arterial serum lactate reflecting microcirculatory hypoperfusion',
  },
  {
    feature: 'Mean Arterial Pressure (MAP)',
    category: 'Vital Sign',
    importance: 91,
    shapContribution: 0.242,
    description: 'Sustained hypotension below autoregulatory perfusion limits (<65 mmHg)',
  },
  {
    feature: 'Shock Index (HR / SBP)',
    category: 'Temporal Derivation',
    importance: 85,
    shapContribution: 0.198,
    description: 'Ratio indicating early occult hypovolemia and compensatory sympathetic tone',
  },
  {
    feature: 'Respiratory Rate / SpO2 Ratio',
    category: 'Vital Sign',
    importance: 79,
    shapContribution: 0.187,
    description: 'Tachypnea coupled with refractory gas exchange impairment',
  },
  {
    feature: 'WBC Count & Bandemia',
    category: 'Laboratory',
    importance: 74,
    shapContribution: 0.134,
    description: 'Leukocytosis or severe leukopenia marking systemic inflammatory reaction',
  },
  {
    feature: 'Acute Creatinine Delta',
    category: 'Laboratory',
    importance: 68,
    shapContribution: 0.092,
    description: 'Acute kidney injury biomarker reflecting early end-organ hypoperfusion',
  },
  {
    feature: 'Temperature Divergence',
    category: 'Vital Sign',
    importance: 62,
    shapContribution: 0.078,
    description: 'Hyperpyrexia (>38.3°C) or paradoxical hypothermia (<36.0°C)',
  },
  {
    feature: 'Platelet Consumption Trend',
    category: 'Laboratory',
    importance: 54,
    shapContribution: 0.054,
    description: 'Consumptive microvascular coagulopathy indicator',
  },
];

export const modelService = {
  async getModelInfo(): Promise<ModelVersion> {
    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('model_versions')
        .select('*')
        .eq('version', 'v1.0.0')
        .single();

      if (!error && data) return data as ModelVersion;
    }

    return INITIAL_MODEL_VERSION;
  },

  getGlobalFeatureImportance(): GlobalFeatureImportance[] {
    return GLOBAL_FEATURE_IMPORTANCE;
  },
};
