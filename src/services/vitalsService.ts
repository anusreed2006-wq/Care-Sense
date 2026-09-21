/**
 * CareSense Temporal Vitals Service
 * Handles continuous ICU telemetry, hourly time-series, and trend calculations
 */

import { supabase, isSupabaseConfigured, isLiveMode } from '../lib/supabase';
import { VitalSigns } from '../types';
import { VITALS_P1042, PREV_VITALS_P1042 } from '../data/demoData';

export const vitalsService = {
  async getLatestVitals(patientId: string): Promise<VitalSigns> {
    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('patient_id', patientId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) return data as VitalSigns;
    }

    if (patientId.includes('1042')) {
      return VITALS_P1042;
    }

    // Default synthetic vital reading
    return {
      id: `vit-${patientId}-now`,
      patient_id: patientId,
      timestamp: new Date().toISOString(),
      hr: 88,
      o2sat: 96,
      temp: 37.2,
      sbp: 118,
      map: 76,
      dbp: 58,
      resp: 18,
      etco2: 35,
    };
  },

  async getHistoricalVitals(patientId: string, hours = 24): Promise<VitalSigns[]> {
    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('patient_id', patientId)
        .order('timestamp', { ascending: true });

      if (!error && data && data.length > 0) return data as VitalSigns[];
    }

    // Generate temporal trajectory for the requested hours
    const count = Math.min(hours, 24);
    const result: VitalSigns[] = [];
    const isP1042 = patientId.includes('1042');

    for (let i = count; i >= 0; i--) {
      const progress = 1 - (i / count);
      const time = new Date(Date.now() - i * 3600 * 1000).toISOString();
      
      if (isP1042) {
        // Decompensating septic trajectory
        result.push({
          id: `vit-hist-${i}`,
          patient_id: patientId,
          timestamp: time,
          hr: Math.round(82 + progress * 39),      // 82 -> 121
          o2sat: Math.round(97 - progress * 8),    // 97 -> 89
          temp: Number((37.2 + progress * 1.8).toFixed(1)), // 37.2 -> 39.0
          sbp: Math.round(118 - progress * 36),    // 118 -> 82
          map: Math.round(78 - progress * 26),     // 78 -> 52
          dbp: Math.round(58 - progress * 21),     // 58 -> 37
          resp: Math.round(16 + progress * 13),    // 16 -> 29
          etco2: Math.round(38 - progress * 14),   // 38 -> 24
        });
      } else {
        // Normalizing or steady baseline
        result.push({
          id: `vit-hist-${i}`,
          patient_id: patientId,
          timestamp: time,
          hr: Math.round(75 + Math.sin(i) * 6),
          o2sat: Math.round(97 + Math.sin(i) * 1),
          temp: Number((36.8 + Math.cos(i) * 0.3).toFixed(1)),
          sbp: Math.round(120 + Math.sin(i) * 5),
          map: Math.round(80 + Math.sin(i) * 4),
          dbp: Math.round(60 + Math.sin(i) * 3),
          resp: Math.round(16 + Math.cos(i) * 2),
          etco2: Math.round(36 + Math.sin(i) * 2),
        });
      }
    }

    return result;
  },

  async recordVitals(vitals: Omit<VitalSigns, 'id' | 'created_at'>): Promise<VitalSigns> {
    const record: VitalSigns = {
      ...vitals,
      id: `vit-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('patient_vitals').insert([record]).select().single();
      if (!error && data) return data as VitalSigns;
    }

    return record;
  },
};
