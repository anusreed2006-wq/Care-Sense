/**
 * CareSense Laboratory Monitoring Service
 * Manages clinical lab measurements with high priority for Sepsis-3 biomarkers (Lactate, WBC, Creatinine)
 */

import { supabase, isSupabaseConfigured, isLiveMode } from '../lib/supabase';
import { LabResult } from '../types';
import { LABS_P1042, PREV_LABS_P1042 } from '../data/demoData';

export const labService = {
  async getLatestLabs(patientId: string): Promise<LabResult> {
    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('patient_labs')
        .select('*')
        .eq('patient_id', patientId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) return data as LabResult;
    }

    if (patientId.includes('1042')) {
      return LABS_P1042;
    }

    return {
      id: `lab-${patientId}-latest`,
      patient_id: patientId,
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      lactate: 1.4,
      wbc: 8.5,
      creatinine: 1.0,
      platelets: 230,
      glucose: 120,
      hgb: 13.0,
      bun: 16,
      base_excess: -0.5,
      hco3: 23.0,
      fio2: 0.21,
      ph: 7.39,
      paco2: 40,
      sao2: 97,
      ast: 28,
      alkalinephos: 75,
      calcium: 9.2,
      chloride: 101,
      bilirubin_direct: 0.2,
      bilirubin_total: 0.8,
      magnesium: 2.1,
      phosphate: 3.5,
      potassium: 4.2,
      troponini: 0.012,
      hct: 39.0,
      ptt: 30.5,
      fibrinogen: 280,
    };
  },

  async getPreviousLabs(patientId: string): Promise<LabResult | null> {
    if (patientId.includes('1042')) {
      return PREV_LABS_P1042;
    }
    return null;
  },

  async recordLabs(labs: Omit<LabResult, 'id' | 'created_at'>): Promise<LabResult> {
    const record: LabResult = {
      ...labs,
      id: `lab-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('patient_labs').insert([record]).select().single();
      if (!error && data) return data as LabResult;
    }

    return record;
  },
};
