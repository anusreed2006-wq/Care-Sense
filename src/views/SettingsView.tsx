import React, { useState, useEffect } from 'react';
import { useCareSense } from '../hooks/useCareSense';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';
import { authService } from '../services/authService';
import { caresenseApi } from '../services/caresenseApi';
import { BackendConnectionTestResult } from '../types';
import {
  Server,
  Database,
  Cpu,
  User,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  Zap,
  Info,
  Smartphone,
  Globe,
  Link2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    appMode,
    setAppMode,
    addToast,
    backendApiUrl,
    updateBackendApiUrl,
    resetBackendApiUrl,
    backendApiStatus,
    backendHealth,
    refreshBackendHealth,
  } = useCareSense();

  // Supabase test connection state
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: 'Testing connection...',
  });
  const [testingSupabase, setTestingSupabase] = useState(false);

  // Backend Endpoint URL state
  const [inputUrl, setInputUrl] = useState<string>(backendApiUrl || caresenseApi.getApiUrl());
  const [isSavingUrl, setIsSavingUrl] = useState<boolean>(false);
  const [isTestingUrl, setIsTestingUrl] = useState<boolean>(false);
  const [connectionResult, setConnectionResult] = useState<BackendConnectionTestResult | null>(null);

  // Sync inputUrl if backendApiUrl changes externally
  useEffect(() => {
    if (backendApiUrl) {
      setInputUrl(backendApiUrl);
    }
  }, [backendApiUrl]);

  const checkSupabaseConnection = async () => {
    setTestingSupabase(true);
    const result = await testSupabaseConnection();
    setDbStatus(result);
    setTestingSupabase(false);
  };

  useEffect(() => {
    checkSupabaseConnection();
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

  /**
   * Save & Connect to entered URL
   */
  const handleSaveAndConnect = async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      addToast({
        type: 'critical',
        title: 'Empty URL',
        description: 'Please specify a backend endpoint URL before saving.',
      });
      return;
    }

    setIsSavingUrl(true);
    setConnectionResult(null);

    try {
      const result = await updateBackendApiUrl(trimmed);
      setConnectionResult(result);

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Connected to Backend',
          description: `Active model version: ${result.health?.model_version || 'Ready'} (${result.latencyMs}ms)`,
        });
      } else {
        addToast({
          type: 'critical',
          title: result.errorTitle || 'Backend Connection Failed',
          description: result.errorDescription || 'Could not reach endpoint. Check diagnostic details below.',
        });
      }
    } catch (err: any) {
      setConnectionResult({
        success: false,
        url: trimmed,
        latencyMs: 0,
        testedAt: new Date().toISOString(),
        errorTitle: 'Unexpected Client Error',
        errorDescription: err.message || 'An unexpected error occurred while connecting to the backend.',
        troubleshootingTips: ['Check browser console for details', 'Verify URL format is valid'],
      });
    } finally {
      setIsSavingUrl(false);
    }
  };

  /**
   * Test Connection without necessarily saving
   */
  const handleTestOnly = async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return;

    setIsTestingUrl(true);
    setConnectionResult(null);

    try {
      const result = await caresenseApi.testConnection(trimmed);
      setConnectionResult(result);

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Endpoint Responded Ready',
          description: `Backend health OK: ${result.latencyMs}ms latency. Click Save to activate.`,
        });
      } else {
        addToast({
          type: 'warning',
          title: result.errorTitle || 'Connection Test Failed',
          description: result.errorDescription || 'Endpoint did not respond as expected.',
        });
      }
    } finally {
      setIsTestingUrl(false);
    }
  };

  /**
   * Reset to Verified Production Default
   */
  const handleResetToDefault = async () => {
    const defaultUrl = caresenseApi.getDefaultApiUrl();
    setInputUrl(defaultUrl);
    setIsSavingUrl(true);
    setConnectionResult(null);

    try {
      await resetBackendApiUrl();
      const res = await caresenseApi.testConnection(defaultUrl);
      setConnectionResult(res);
      addToast({
        type: 'info',
        title: 'Reset to Production Default',
        description: `Connected to verified Render backend: ${defaultUrl}`,
      });
    } finally {
      setIsSavingUrl(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          System Configuration & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          CareSense FastAPI backend endpoint, inference runtime modes, Supabase database, and clinician credentials
        </p>
      </div>

      {/* SECTION 1: CARESENSE BACKEND ENDPOINT URL CONFIGURATION BOX */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700 shrink-0">
              <Server size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  CareSense FastAPI Backend Endpoint
                </h2>
                {backendApiStatus === 'ready' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Connected
                  </span>
                )}
                {backendApiStatus === 'connecting' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200">
                    <RefreshCw size={11} className="animate-spin" />
                    Connecting...
                  </span>
                )}
                {backendApiStatus === 'error' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                    <XCircle size={11} />
                    Connection Error
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure and test the remote REST API URL for real-time model inference and SHAP explainability
              </p>
            </div>
          </div>

          <button
            onClick={handleResetToDefault}
            disabled={isSavingUrl || isTestingUrl}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs self-start sm:self-center"
            title="Reset to verified production backend"
          >
            <RotateCcw size={13} />
            <span>Reset Default</span>
          </button>
        </div>

        {/* Input Box for Endpoint URL */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Backend Endpoint URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Globe size={16} />
              </div>
              <input
                type="url"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                placeholder="https://caresense-vyt1.onrender.com"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-9 pr-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 transition"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestOnly}
                disabled={isSavingUrl || isTestingUrl || !inputUrl.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition shadow-2xs"
              >
                <Zap size={14} className={isTestingUrl ? 'animate-bounce text-amber-500' : 'text-slate-500'} />
                <span>{isTestingUrl ? 'Testing...' : 'Test'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndConnect}
                disabled={isSavingUrl || isTestingUrl || !inputUrl.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 transition shadow-xs"
              >
                {isSavingUrl ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Connecting & Saving...</span>
                  </>
                ) : (
                  <>
                    <Link2 size={14} />
                    <span>Save & Connect</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Backend must expose <code>GET /health</code>, <code>POST /patients</code>, <code>POST /vitals</code>, and <code>POST /patients/{'{id}'}/predict</code>.
          </p>
        </div>

        {/* Quick URL Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-semibold text-slate-500 text-[11px]">Quick Presets:</span>
          <button
            type="button"
            onClick={() => setInputUrl('https://caresense-vyt1.onrender.com')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-800 transition"
          >
            Verified Render (Production)
          </button>
          <button
            type="button"
            onClick={() => setInputUrl('http://localhost:8000')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-800 transition"
          >
            Localhost (8000)
          </button>
          <button
            type="button"
            onClick={() => setInputUrl('http://127.0.0.1:8000')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-800 transition"
          >
            127.0.0.1:8000
          </button>
        </div>

        {/* CONNECTION RESULT: DETAILED SUCCESS OR ERROR DIAGNOSTICS */}
        {connectionResult && !connectionResult.success && (
          <div className="rounded-xl border border-rose-300 bg-rose-50/80 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-rose-200 p-1.5 text-rose-800 shrink-0 mt-0.5">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-xs font-bold text-rose-900">
                    {connectionResult.errorTitle || 'Failed to Connect to Backend URL'}
                  </h3>
                  {connectionResult.httpStatus && (
                    <span className="rounded-md bg-rose-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-800">
                      HTTP {connectionResult.httpStatus}
                    </span>
                  )}
                </div>

                <p className="text-xs text-rose-800 leading-relaxed font-medium">
                  {connectionResult.errorDescription}
                </p>

                <div className="pt-1 text-[11px] font-mono text-rose-700/80 flex items-center gap-3">
                  <span>Target: {connectionResult.url || 'None'}</span>
                  <span>•</span>
                  <span>Tested: {new Date(connectionResult.testedAt).toLocaleTimeString()}</span>
                  {connectionResult.latencyMs > 0 && (
                    <>
                      <span>•</span>
                      <span>Latency: {connectionResult.latencyMs}ms</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Troubleshooting Tips Box */}
            {connectionResult.troubleshootingTips && connectionResult.troubleshootingTips.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-white/90 p-3 text-xs space-y-1.5 mt-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info size={13} className="text-rose-600" />
                  <span>Why is it not connecting? Troubleshooting Checklist:</span>
                </span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px] leading-relaxed">
                  {connectionResult.troubleshootingTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* CONNECTION RESULT: SUCCESS DETAILS */}
        {connectionResult && connectionResult.success && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-200 p-1.5 text-emerald-800 shrink-0 mt-0.5">
                <CheckCircle2 size={18} />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-xs font-bold text-emerald-950">
                    Successfully Connected to CareSense Backend
                  </h3>
                  <span className="rounded-md bg-emerald-200 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-900">
                    HTTP 200 OK • {connectionResult.latencyMs}ms
                  </span>
                </div>
                <p className="text-xs text-emerald-800">
                  Backend endpoint is live and verified ready for model predictions.
                </p>
              </div>
            </div>

            {connectionResult.health && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/70 text-xs">
                <div className="rounded-lg bg-white/80 p-2 border border-emerald-200/60">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Model Version</span>
                  <span className="font-mono font-bold text-emerald-900 text-[11px] truncate block">
                    {connectionResult.health.model_version || 'Ready'}
                  </span>
                </div>
                <div className="rounded-lg bg-white/80 p-2 border border-emerald-200/60">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Feature Schema</span>
                  <span className="font-mono font-bold text-emerald-900 text-[11px] truncate block">
                    {connectionResult.health.feature_version || 'Hourly Causal'}
                  </span>
                </div>
                <div className="rounded-lg bg-white/80 p-2 border border-emerald-200/60">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Predictor Source</span>
                  <span className="font-mono font-bold text-emerald-900 text-[11px] truncate block">
                    {connectionResult.health.predictor_source || 'Verified Bundle'}
                  </span>
                </div>
                <div className="rounded-lg bg-white/80 p-2 border border-emerald-200/60">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Status</span>
                  <span className="font-mono font-bold text-emerald-900 text-[11px] truncate block capitalize">
                    {connectionResult.health.status || 'Ready'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Active Backend Summary (when no fresh test has been triggered yet) */}
        {!connectionResult && backendHealth && (
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Active Backend URL:</span>
              <span className="font-mono text-slate-800 text-[11px]">{backendApiUrl}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
              <span className="font-semibold text-slate-600">Active Model Artifact:</span>
              <span className="font-mono text-sky-800 text-[11px]">{backendHealth.model_version}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
              <span className="font-semibold text-slate-600">Validation Status:</span>
              <span className="text-amber-800 font-medium text-[11px]">Research Prototype (Investigational Use)</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: RUNTIME OPERATING MODE SELECTOR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Application Operating Mode</h2>
            <p className="text-xs text-slate-500">
              Toggle between benchmark ICU trajectory replay and live verified backend model inference
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
              <span className="font-bold text-xs text-indigo-900">LIVE PRODUCTION BACKEND</span>
              {appMode === 'live' && <CheckCircle2 size={16} className="text-indigo-600" />}
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Queries the real CareSense FastAPI backend at {backendApiUrl} for causal predictions and SHAP explainability.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: SUPABASE BACKEND PLATFORM */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Supabase Database & Realtime Integration
              </h2>
              <p className="text-xs text-slate-500">
                PostgreSQL schema, Row Level Security (RLS), and Realtime Publications
              </p>
            </div>
          </div>

          <button
            onClick={checkSupabaseConnection}
            disabled={testingSupabase}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          >
            <RefreshCw size={13} className={testingSupabase ? 'animate-spin text-sky-600' : ''} />
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
      </div>

      {/* SECTION 4: CLINICIAN ROLE & IDENTITY */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Clinician Identity & Role</h2>
            <p className="text-xs text-slate-500">
              Simulate different clinical perspectives (Attending Intensivist, Administrator, Researcher)
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

      {/* SECTION 5: PWA & MOBILE INSTALLATION */}
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
