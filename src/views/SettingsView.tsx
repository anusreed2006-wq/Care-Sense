import React, { useState, useEffect } from 'react';
import { useCareSense } from '../hooks/useCareSense';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';
import { authService } from '../services/authService';
import {
  Settings,
  Database,
  Cpu,
  User,
  Bell,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Shield,
  Smartphone,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    appMode,
    setAppMode,
    addToast,
  } = useCareSense();

  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: 'Testing connection...',
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const checkConnection = async () => {
    setTestingConnection(true);
    const result = await testSupabaseConnection();
    setDbStatus(result);
    setTestingConnection(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleRoleChange = async (role: 'clinician' | 'admin' | 'researcher') => {
    const updated = await authService.signInAsDemo(role);
    setCurrentUser(updated);
    addToast({
      type: 'info',
      title: 'Active Clinical Role Updated',
      description: `Session switched to ${updated.role.toUpperCase()} (${updated.full_name})`,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          System Configuration & Settings
        </h1>
        <p className="text-xs text-slate-500">
          Supabase database connectivity, runtime operation modes, and clinician credentials
        </p>
      </div>

      {/* Supabase Primary Backend Connection Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Supabase Backend Platform Integration
              </h2>
              <p className="text-xs text-slate-500">
                PostgreSQL schema, Row Level Security (RLS), and Realtime Publications
              </p>
            </div>
          </div>

          <button
            onClick={checkConnection}
            disabled={testingConnection}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          >
            <RefreshCw size={13} className={testingConnection ? 'animate-spin text-sky-600' : ''} />
            <span>Test Connection</span>
          </button>
        </div>

        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600">Configuration Status:</span>
            <span className={`font-bold inline-flex items-center gap-1 ${
              isSupabaseConfigured ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {isSupabaseConfigured ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Configured via Environment Variables</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} className="text-amber-600" />
                  <span>Demo Mode Active (Fallback Simulation)</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4 pt-2 border-t border-slate-200/60">
            <span className="font-semibold text-slate-600 shrink-0">Diagnostic Response:</span>
            <span className="text-slate-700 text-right font-mono text-[11px] leading-snug">
              {dbStatus.message}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          <strong>Backend Architecture:</strong> CareSense connects directly to Supabase services using the anon public key and Row Level Security. Migrations located at <code>/supabase/migrations/20260921000000_caresense_init.sql</code>.
        </p>
      </div>

      {/* Runtime Mode Selector (Section 8: DEMO MODE vs LIVE MODEL) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Application Operating Mode</h2>
            <p className="text-xs text-slate-500">
              Toggle between synthetic ICU simulation and production model inference endpoint
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => {
              setAppMode('demo');
              addToast({ type: 'info', title: 'Mode Switched', description: 'CareSense set to Demo Mode.' });
            }}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              appMode === 'demo'
                ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-amber-900">DEMO SIMULATION MODE</span>
              {appMode === 'demo' && <CheckCircle2 size={16} className="text-amber-600" />}
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Uses the 5 benchmark ICU simulation trajectories with simulated real-time vital sign telemetry.
            </p>
          </div>

          <div
            onClick={() => {
              setAppMode('live');
              addToast({ type: 'info', title: 'Mode Switched', description: 'CareSense set to Live Model Mode.' });
            }}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              appMode === 'live'
                ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-indigo-900">LIVE MODEL STREAM</span>
              {appMode === 'live' && <CheckCircle2 size={16} className="text-indigo-600" />}
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Listens for continuous risk predictions via Supabase Realtime channels and future model APIs.
            </p>
          </div>
        </div>
      </div>

      {/* Clinician Role & Department */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Clinician Identity & Role</h2>
            <p className="text-xs text-slate-500">
              Simulate different clinical perspectives (Intensivist, Administrator, Researcher)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { role: 'clinician' as const, label: 'Attending Intensivist', desc: 'Bedside ICU doctor' },
            { role: 'admin' as const, label: 'Chief Medical Officer', desc: 'ICU administration & audit' },
            { role: 'researcher' as const, label: 'Biostatistician', desc: 'Model telemetry analyst' },
          ].map(item => (
            <button
              key={item.role}
              onClick={() => handleRoleChange(item.role)}
              className={`p-3 rounded-xl border text-left transition ${
                currentUser?.role === item.role
                  ? 'border-sky-600 bg-sky-50 text-sky-950 ring-1 ring-sky-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <strong className="block text-xs font-bold">{item.label}</strong>
              <span className="text-[10px] text-slate-500">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* PWA & Mobile Installation diagnostics */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <Smartphone size={18} className="text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">
            Progressive Web App (PWA) Capabilities
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          CareSense includes a service worker and web app manifest configured with <code>display: standalone</code>, high-resolution SVG/PNG icons, and offline caching for rapid bedside access on laptops, tablets, and phones.
        </p>
      </div>
    </div>
  );
};
