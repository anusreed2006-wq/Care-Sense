/**
 * CareSense Patient Service
 * Manages patient cohorts, ICU bed assignments, and simulation registries
 */

import { supabase, isSupabaseConfigured, isLiveMode } from '../lib/supabase';
import { Patient, SimulationPatient } from '../types';
import { ALL_DEMO_PATIENTS, CORE_SIMULATION_PATIENTS } from '../data/demoData';

const LOCAL_STORAGE_PATIENTS_KEY = 'caresense_patients_registry';

function getStoredPatients(): Patient[] {
  const saved = localStorage.getItem(LOCAL_STORAGE_PATIENTS_KEY);
  if (saved) {
    try {
      const parsed: Patient[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all primary dataset patients (P-1001 to P-1005, P-1042, etc.) exist
        const existingCodes = new Set(parsed.map(p => p.patient_code));
        const missing = ALL_DEMO_PATIENTS.filter(p => !existingCodes.has(p.patient_code));
        if (missing.length > 0) {
          const merged = [...missing, ...parsed];
          saveStoredPatients(merged);
          return merged;
        }
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  saveStoredPatients(ALL_DEMO_PATIENTS);
  return ALL_DEMO_PATIENTS;
}

function saveStoredPatients(patients: Patient[]): void {
  localStorage.setItem(LOCAL_STORAGE_PATIENTS_KEY, JSON.stringify(patients));
}

export const patientService = {
  async getPatients(): Promise<Patient[]> {
    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Patient[];
      }
    }
    return getStoredPatients();
  },

  async getPatientById(id: string): Promise<Patient | null> {
    const patients = await this.getPatients();
    return patients.find(p => p.id === id || p.patient_code === id) || null;
  },

  async createPatient(params: {
    patient_code: string;
    age: number;
    gender: 'M' | 'F' | 'Other';
    icu_bed: string;
    scenario_description?: string;
  }): Promise<Patient> {
    const newPatient: Patient = {
      id: `p-${Date.now()}-uuid`,
      patient_code: params.patient_code.toUpperCase(),
      age: params.age,
      gender: params.gender,
      icu_bed: params.icu_bed.toUpperCase(),
      admission_time: new Date().toISOString(),
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('patients')
        .insert([newPatient])
        .select()
        .single();

      if (!error && data) {
        return data as Patient;
      }
    }

    const current = getStoredPatients();
    const updated = [newPatient, ...current];
    saveStoredPatients(updated);
    return newPatient;
  },

  async deletePatient(id: string): Promise<{ success: boolean; error?: string }> {
    // Check if patient is one of the default 5 simulation patients
    const isDefault = CORE_SIMULATION_PATIENTS.some(p => p.id === id || p.patient_code === id);
    if (isDefault) {
      return {
        success: false,
        error: 'Default CareSense benchmark simulation patients (P-1042, P-1024, P-1018, P-1005, P-1033) are locked and cannot be deleted.',
      };
    }

    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
    }

    const current = getStoredPatients();
    const filtered = current.filter(p => p.id !== id && p.patient_code !== id);
    saveStoredPatients(filtered);
    return { success: true };
  },

  async resetToDefaultSimulation(): Promise<Patient[]> {
    saveStoredPatients(ALL_DEMO_PATIENTS);
    return ALL_DEMO_PATIENTS;
  },

  isDefaultSimulationPatient(id: string): boolean {
    return CORE_SIMULATION_PATIENTS.some(p => p.id === id || p.patient_code === id);
  },
};
