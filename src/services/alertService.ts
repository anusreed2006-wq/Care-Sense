/**
 * CareSense Clinical Alert Service
 * Manages sepsis risk notifications, acknowledgments, and escalations
 */

import { supabase, isSupabaseConfigured, isLiveMode } from '../lib/supabase';
import { Alert, AlertStatus, AlertSeverity } from '../types';
import { INITIAL_ALERTS } from '../data/demoData';

const ALERTS_STORAGE_KEY = 'caresense_active_alerts';

function getStoredAlerts(): Alert[] {
  const saved = localStorage.getItem(ALERTS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return INITIAL_ALERTS;
}

function saveStoredAlerts(alerts: Alert[]): void {
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}

export const alertService = {
  async getAlerts(filter?: { status?: AlertStatus; severity?: AlertSeverity }): Promise<Alert[]> {
    if (isLiveMode && isSupabaseConfigured && supabase) {
      let query = supabase.from('alerts').select('*').order('created_at', { ascending: false });
      if (filter?.status) query = query.eq('status', filter.status);
      if (filter?.severity) query = query.eq('severity', filter.severity);
      const { data, error } = await query;
      if (!error && data) return data as Alert[];
    }

    let list = getStoredAlerts();
    if (filter?.status) {
      list = list.filter(a => a.status === filter.status);
    }
    if (filter?.severity) {
      list = list.filter(a => a.severity === filter.severity);
    }
    return list;
  },

  async acknowledgeAlert(alertId: string): Promise<Alert | null> {
    const now = new Date().toISOString();
    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('alerts')
        .update({ status: 'ACKNOWLEDGED', acknowledged_at: now })
        .eq('id', alertId)
        .select()
        .single();

      if (!error && data) return data as Alert;
    }

    const alerts = getStoredAlerts();
    const idx = alerts.findIndex(a => a.id === alertId);
    if (idx !== -1) {
      alerts[idx] = {
        ...alerts[idx],
        status: 'ACKNOWLEDGED',
        acknowledged_at: now,
      };
      saveStoredAlerts(alerts);
      return alerts[idx];
    }
    return null;
  },

  async resolveAlert(alertId: string): Promise<Alert | null> {
    const now = new Date().toISOString();
    if (isLiveMode && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('alerts')
        .update({ status: 'RESOLVED', resolved_at: now })
        .eq('id', alertId)
        .select()
        .single();

      if (!error && data) return data as Alert;
    }

    const alerts = getStoredAlerts();
    const idx = alerts.findIndex(a => a.id === alertId);
    if (idx !== -1) {
      alerts[idx] = {
        ...alerts[idx],
        status: 'RESOLVED',
        resolved_at: now,
      };
      saveStoredAlerts(alerts);
      return alerts[idx];
    }
    return null;
  },

  async triggerSimulationAlert(alert: Omit<Alert, 'id' | 'created_at'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: `alt-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const alerts = getStoredAlerts();
    const updated = [newAlert, ...alerts];
    saveStoredAlerts(updated);
    return newAlert;
  },
};
