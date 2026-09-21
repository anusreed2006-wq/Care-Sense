/**
 * CareSense Realtime Event Subscription & Telemetry Streamer
 * Connects to Supabase Realtime channels when in Live Model Mode,
 * and runs a background telemetry emulator in Demo Mode.
 */

import { supabase, isSupabaseConfigured, isLiveMode } from '../lib/supabase';
import { Alert, RiskPrediction, VitalSigns } from '../types';

export type RealtimeCallback<T> = (payload: T) => void;

class RealtimeManager {
  private alertListeners: Set<RealtimeCallback<Alert>> = new Set();
  private predictionListeners: Set<RealtimeCallback<RiskPrediction>> = new Set();
  private vitalsListeners: Set<RealtimeCallback<VitalSigns>> = new Set();
  private tickerInterval: any = null;
  private isEmulationRunning = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (isLiveMode && isSupabaseConfigured && supabase) {
      this.setupSupabaseChannels();
    } else {
      this.startDemoEmulation();
    }
  }

  private setupSupabaseChannels() {
    if (!supabase) return;

    try {
      // Channel for risk predictions
      supabase
        .channel('public:risk_predictions')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'risk_predictions' },
          payload => {
            const pred = payload.new as RiskPrediction;
            this.predictionListeners.forEach(cb => cb(pred));
          }
        )
        .subscribe();

      // Channel for alerts
      supabase
        .channel('public:alerts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'alerts' },
          payload => {
            const alert = payload.new as Alert;
            this.alertListeners.forEach(cb => cb(alert));
          }
        )
        .subscribe();

      // Channel for vitals
      supabase
        .channel('public:patient_vitals')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'patient_vitals' },
          payload => {
            const vitals = payload.new as VitalSigns;
            this.vitalsListeners.forEach(cb => cb(vitals));
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[CareSense Realtime] Error establishing Supabase realtime subscription:', err);
    }
  }

  public startDemoEmulation() {
    if (this.tickerInterval) return;
    this.isEmulationRunning = true;

    // Periodic subtle heartbeat update every 12 seconds in demo mode
    this.tickerInterval = setInterval(() => {
      if (!this.isEmulationRunning) return;
      const now = new Date().toISOString();

      // Subtle fluctuation for ICU-02 (P-1042)
      const fluctuatingVital: VitalSigns = {
        id: `vit-live-${Date.now()}`,
        patient_id: 'p-1042-uuid',
        timestamp: now,
        hr: Math.round(119 + Math.random() * 4),
        o2sat: Math.round(89 + (Math.random() > 0.5 ? 1 : 0)),
        temp: 39.0,
        sbp: 82,
        map: Math.round(51 + Math.random() * 2),
        dbp: 37,
        resp: Math.round(28 + (Math.random() > 0.5 ? 1 : 0)),
        etco2: 24,
      };

      this.vitalsListeners.forEach(cb => cb(fluctuatingVital));
    }, 12000);
  }

  public stopDemoEmulation() {
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
    this.isEmulationRunning = false;
  }

  public onAlert(cb: RealtimeCallback<Alert>): () => void {
    this.alertListeners.add(cb);
    return () => this.alertListeners.delete(cb);
  }

  public onPrediction(cb: RealtimeCallback<RiskPrediction>): () => void {
    this.predictionListeners.add(cb);
    return () => this.predictionListeners.delete(cb);
  }

  public onVitals(cb: RealtimeCallback<VitalSigns>): () => void {
    this.vitalsListeners.add(cb);
    return () => this.vitalsListeners.delete(cb);
  }

  public triggerManualEvent(type: 'alert' | 'prediction' | 'vitals', data: any) {
    if (type === 'alert') this.alertListeners.forEach(cb => cb(data));
    if (type === 'prediction') this.predictionListeners.forEach(cb => cb(data));
    if (type === 'vitals') this.vitalsListeners.forEach(cb => cb(data));
  }
}

export const realtimeService = new RealtimeManager();
