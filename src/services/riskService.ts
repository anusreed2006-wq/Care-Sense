/**
 * CareSense Sepsis Risk Service
 * Retrieves model-generated predictions, risk trajectory horizons (6H, 12H, 24H, 48H), and SHAP explanations
 */

import { supabase, isSupabaseConfigured, isLiveMode } from '../lib/supabase';
import { RiskPrediction, RiskExplanation, RiskTier } from '../types';
import { TRAJECTORY_P1042, SHAP_P1042 } from '../data/demoData';

export function calculateRiskTier(prob: number): RiskTier {
  if (prob >= 0.80) return 'CRITICAL';
  if (prob >= 0.60) return 'ELEVATED';
  if (prob >= 0.30) return 'WATCH';
  return 'LOW';
}

export const riskService = {
  async getLatestPrediction(patientId: string): Promise<RiskPrediction> {
    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('risk_predictions')
        .select('*')
        .eq('patient_id', patientId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) return data as RiskPrediction;
    }

    if (patientId.includes('1042')) {
      return {
        id: 'pred-1042',
        patient_id: patientId,
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        risk_probability: 0.94,
        risk_tier: 'CRITICAL',
        risk_status: 'ELEVATED_MORTALITY_RISK',
        model_version: 'v1.0.0',
        prediction_horizon: '6H',
        previous_probability: 0.82,
        change: 0.12,
      };
    }

    if (patientId.includes('1024')) {
      return {
        id: 'pred-1024',
        patient_id: patientId,
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        risk_probability: 0.74,
        risk_tier: 'ELEVATED',
        risk_status: 'RAPID_DECOMPENSATION',
        model_version: 'v1.0.0',
        prediction_horizon: '6H',
        previous_probability: 0.58,
        change: 0.16,
      };
    }

    return {
      id: `pred-${patientId}`,
      patient_id: patientId,
      timestamp: new Date().toISOString(),
      risk_probability: 0.22,
      risk_tier: 'LOW',
      risk_status: 'STABLE',
      model_version: 'v1.0.0',
      prediction_horizon: '6H',
      previous_probability: 0.20,
      change: 0.02,
    };
  },

  async getRiskTrajectory(patientId: string, horizon: '6H' | '12H' | '24H' | '48H' = '24H') {
    if (patientId.includes('1042')) {
      let slice = TRAJECTORY_P1042;
      if (horizon === '6H') slice = TRAJECTORY_P1042.slice(-4);
      else if (horizon === '12H') slice = TRAJECTORY_P1042.slice(-5);
      return slice;
    }

    // Baseline mock trajectory
    const points = horizon === '6H' ? 4 : horizon === '12H' ? 6 : horizon === '24H' ? 8 : 12;
    return Array.from({ length: points }, (_, i) => {
      const p = i / (points - 1);
      const r = Number((0.15 + Math.sin(p * Math.PI) * 0.12).toFixed(2));
      return {
        time: `T-${(points - 1 - i) * 3}h`,
        risk: r,
        tier: calculateRiskTier(r),
      };
    });
  },

  async getRiskExplanations(predictionId: string): Promise<RiskExplanation[]> {
    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('risk_explanations')
        .select('*')
        .eq('prediction_id', predictionId)
        .order('rank', { ascending: true });

      if (!error && data && data.length > 0) return data as RiskExplanation[];
    }

    return SHAP_P1042;
  },
};
