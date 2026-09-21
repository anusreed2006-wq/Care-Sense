/**
 * CareSense Clinical Timeline Service
 * Tracks temporal progression of sepsis warning events, interventions, and doctor reviews
 */

import { supabase, isSupabaseConfigured, isLiveMode } from '../lib/supabase';
import { TimelineEvent } from '../types';
import { TIMELINE_P1042 } from '../data/demoData';

export const timelineService = {
  async getTimeline(patientId: string): Promise<TimelineEvent[]> {
    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('patient_timeline')
        .select('*')
        .eq('patient_id', patientId)
        .order('timestamp', { ascending: false });

      if (!error && data && data.length > 0) return data as TimelineEvent[];
    }

    if (patientId.includes('1042')) {
      return TIMELINE_P1042;
    }

    return [
      {
        id: `evt-base-1`,
        patient_id: patientId,
        timestamp: '08:00 AM',
        event_type: 'ADMISSION',
        title: 'Patient admitted to ICU Bed',
        description: 'Baseline vital signs and admission labs recorded.',
        severity: 'LOW',
      },
      {
        id: `evt-base-2`,
        patient_id: patientId,
        timestamp: '10:30 AM',
        event_type: 'VITAL_CHANGE',
        title: 'Continuous telemetry online',
        description: 'CareSense ML monitoring stream established.',
        severity: 'LOW',
      },
    ];
  },

  async addEvent(event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> {
    const record: TimelineEvent = {
      ...event,
      id: `evt-${Date.now()}`,
    };

    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('patient_timeline').insert([record]).select().single();
      if (!error && data) return data as TimelineEvent;
    }

    return record;
  },
};
