import React, { useState } from 'react';
import { useCareSense } from '../hooks/useCareSense';
import { Patient, VitalSigns, LabResult } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Sliders,
  Users,
  Database,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  RotateCcw,
  LogOut,
  Save,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  LayoutGrid,
  Heart,
  Droplet,
  Search,
  Cpu,
  Key,
  RefreshCw,
  Zap,
} from 'lucide-react';

export const AdminPanelView: React.FC = () => {
  const {
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin,
    isAdminUnlocked,
    lockAdminPanel,
    featureToggles,
    setFeatureToggle,
    resetFeatureToggles,
    togglePatientVisibility,
    patients,
    updatePatient,
    updatePatientClinicalData,
    refreshPatients,
    addToast,
    setActiveTab,
    selectPatientAndNavigate,
    ensembleConfig,
    updateEnsembleConfig,
    toggleEnsemble,
    setEnsembleWeights,
    testEnsembleKey,
  } = useCareSense();

  // Login Form State
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin Active Tab
  const [adminTab, setAdminTab] = useState<'toggles' | 'engine-integration' | 'patients' | 'clinical-data'>('toggles');

  // CareSense Cognitive Engine Integration State
  const [apiKeyInput, setApiKeyInput] = useState<string>(ensembleConfig?.apiKey || '');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [keyTestFeedback, setKeyTestFeedback] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    latencyMs?: number;
    sampleProb?: number;
  }>({
    status: ensembleConfig?.lastTestStatus || 'idle',
    message: ensembleConfig?.lastTestMessage || '',
    latencyMs: ensembleConfig?.lastTestLatencyMs,
  });
  const [apiWeightInput, setApiWeightInput] = useState<number>(ensembleConfig?.apiWeight ?? 70);

  // Live calculation test sandbox in Admin Panel
  const [testSimCognitiveProb, setTestSimCognitiveProb] = useState<number>(78);
  const [testSimBaseProb, setTestSimBaseProb] = useState<number>(62);

  // Edit Patient State
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientForm, setPatientForm] = useState<Partial<Patient>>({});

  // Edit Clinical Vitals / Labs State
  const [selectedClinicalPatientId, setSelectedClinicalPatientId] = useState<string>(patients[0]?.id || '');
  const [vitalsEdit, setVitalsEdit] = useState<{
    hr: number;
    sbp: number;
    dbp: number;
    map: number;
    o2sat: number;
    temp: number;
    resp: number;
    etco2: number;
  }>({
    hr: 121,
    sbp: 82,
    dbp: 37,
    map: 52,
    o2sat: 89,
    temp: 39.0,
    resp: 29,
    etco2: 24,
  });

  const [labsEdit, setLabsEdit] = useState<{
    lactate: number;
    wbc: number;
    creatinine: number;
    platelets: number;
    glucose: number;
  }>({
    lactate: 4.2,
    wbc: 19.4,
    creatinine: 2.3,
    platelets: 98,
    glucose: 184,
  });

  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = loginAdmin(usernameInput, passwordInput);
    if (success) {
      addToast({
        type: 'success',
        title: 'Admin Session Activated',
        description: 'Welcome Administrator. Full cohort and layout governance unlocked.',
      });
    } else {
      setLoginError('Invalid administrative credentials. Use admin / 123456');
      addToast({
        type: 'critical',
        title: 'Authentication Denied',
        description: 'Incorrect username or password.',
      });
    }
  };

  // Open Edit Patient
  const handleOpenEditPatient = (p: Patient) => {
    setEditingPatient(p);
    setPatientForm({
      patient_code: p.patient_code,
      icu_bed: p.icu_bed,
      age: p.age,
      gender: p.gender,
      status: p.status,
    });
  };

  // Save Edit Patient
  const handleSaveEditPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    const updated: Patient = {
      ...editingPatient,
      ...patientForm,
      age: Number(patientForm.age || editingPatient.age),
      updated_at: new Date().toISOString(),
    } as Patient;

    updatePatient(updated);
    setEditingPatient(null);
    addToast({
      type: 'success',
      title: 'Patient Record Updated',
      description: `Patient ${updated.patient_code} metadata saved successfully.`,
    });
  };

  // Save Clinical Data Edit
  const handleSaveClinicalData = () => {
    const calculatedMap = Math.round(vitalsEdit.dbp + (vitalsEdit.sbp - vitalsEdit.dbp) / 3);
    const updatedVitals = {
      ...vitalsEdit,
      map: calculatedMap,
    };

    updatePatientClinicalData(selectedClinicalPatientId, updatedVitals, labsEdit);
    addToast({
      type: 'success',
      title: 'Clinical Telemetry Dispatched',
      description: `Real-time vitals & laboratory biomarkers updated for patient.`,
    });
  };

  // -------------------------------------------------------------
  // 1. LOGIN GATE IF NOT AUTHENTICATED
  // -------------------------------------------------------------
  if (!isAdminAuthenticated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md mb-4">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              CareSense Admin Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Secure administrative access to clinical cohort data, real-time parameters, and main application layout controls.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {loginError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
                <AlertOctagon size={16} className="text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-indigo-600 focus:outline-hidden pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Hint Box */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-[11px] text-indigo-900 flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">Authorized Credentials:</p>
                <p className="font-mono mt-0.5">Username: <strong>admin</strong> • Password: <strong>123456</strong></p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUsernameInput('admin');
                  setPasswordInput('123456');
                }}
                className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 transition shrink-0"
              >
                Auto-fill
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm flex items-center justify-center gap-2"
            >
              <Lock size={14} />
              <span>Sign In to Admin Panel</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATED ADMIN PANEL DASHBOARD
  // -------------------------------------------------------------
  const filteredPatients = patients.filter(p => {
    const q = adminSearchQuery.toLowerCase();
    return (
      !q ||
      p.patient_code.toLowerCase().includes(q) ||
      p.icu_bed.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-sm font-black">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                CareSense Admin Command Center
              </h1>
              <span className="rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Authenticated Admin
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Control clinical data, manage patient cohort, and configure what appears in the main application.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition shadow-2xs cursor-pointer"
          >
            <span>Main App</span>
            <ArrowRight size={13} />
          </button>

          <button
            onClick={() => {
              lockAdminPanel();
              addToast({
                type: 'info',
                title: 'Admin Panel Locked & Hidden',
                description: 'Admin shortcuts are now completely hidden. Tap clinician profile 5 times to reveal again.',
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition shadow-2xs cursor-pointer"
            title="Lock and hide Admin Panel from all shortcuts and menus"
          >
            <Lock size={13} />
            <span>Lock & Hide Panel</span>
          </button>

          <button
            onClick={resetFeatureToggles}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition shadow-2xs cursor-pointer"
            title="Reset all display toggles to factory default"
          >
            <RotateCcw size={13} />
            <span>Reset Toggles</span>
          </button>

          <button
            onClick={() => {
              logoutAdmin();
              addToast({ type: 'info', title: 'Admin Logged Out', description: 'Administrative session terminated.' });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/90 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-2xs"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Admin Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setAdminTab('toggles')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            adminTab === 'toggles'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders size={14} />
          <span>App Display & Visibility Toggles</span>
        </button>

        <button
          onClick={() => setAdminTab('engine-integration')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            adminTab === 'engine-integration'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Cpu size={14} />
          <span>Cognitive Engine & Dual-Pipeline Governance</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
            ensembleConfig?.enabled && ensembleConfig?.apiKey
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            {ensembleConfig?.enabled && ensembleConfig?.apiKey ? `ON (${ensembleConfig.apiWeight}/${ensembleConfig.backendWeight})` : 'OFF'}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('patients')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            adminTab === 'patients'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={14} />
          <span>Patient Cohort & Metadata Management</span>
        </button>

        <button
          onClick={() => setAdminTab('clinical-data')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            adminTab === 'clinical-data'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Heart size={14} />
          <span>Live Clinical Data & Biomarkers Control</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: APP DISPLAY & FEATURE TOGGLES ("so i can decide what want to appear in main app") */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'toggles' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Main Application UI Visibility & Component Toggles
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Use these toggle switches to customize exactly what sections, cards, and modules appear to clinicians in the main app. Changes take effect immediately.
                </p>
              </div>
            </div>

            {/* Master Featured Card: CareSense Cognitive Engine Dual-Pipeline Integration */}
            <div className="mb-6 p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
                    <Cpu size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-black text-slate-900">
                        CareSense Cognitive Deep Inference Pipeline
                      </strong>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ensembleConfig?.enabled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {ensembleConfig?.enabled ? 'Active Integration' : 'Disabled (Base XGBoost Only)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {ensembleConfig?.enabled
                        ? `Consensus model active: ${ensembleConfig.apiWeight}% Cognitive Pipeline + ${ensembleConfig.backendWeight}% CareSense Base XGBoost.`
                        : 'Currently disabled. System runs 100% on the CareSense Base XGBoost model.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      const next = toggleEnsemble();
                      addToast({
                        type: next ? 'success' : 'info',
                        title: next ? 'Cognitive Integration Activated' : 'Cognitive Integration Deactivated',
                        description: next
                          ? `Consensus blending active (${ensembleConfig.apiWeight}% / ${ensembleConfig.backendWeight}%).`
                          : 'System reverted to 100% CareSense Base XGBoost.',
                      });
                    }}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition cursor-pointer ${
                      ensembleConfig?.enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                    title="Toggle Cognitive Pipeline Integration ON/OFF"
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminTab('engine-integration')}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Configure Key & Weights</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Section 1: Main Clinical View Panels */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                1. Clinical Risk Monitoring View Components
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Toggle: Sepsis Risk Score Card */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Predicted Sepsis Risk Probability Score Card
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Shows giant risk number (e.g. 0.94), progress bar, and clinical subtype
                    </span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('showRiskScoreCard', !featureToggles.showRiskScoreCard)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.showRiskScoreCard ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: 24-Hour Risk Progression Trajectory */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      24-Hour Sepsis Risk Progression Trajectory Chart
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Recharts Area graph with 0.30, 0.60, 0.80 reference thresholds
                    </span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('showRiskTrajectory', !featureToggles.showRiskTrajectory)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.showRiskTrajectory ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: Explainable AI SHAP Attribution Panel */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Explainable AI (SHAP Feature Waterfall & Narrative)
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Feature attribution rankings explaining model predictions
                    </span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('showExplainableAI', !featureToggles.showExplainableAI)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.showExplainableAI ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: Bedside Telemetry Vitals Panel */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Bedside Telemetry Vital Signs Panel
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Heart rate, MAP, SBP/DBP, SpO2, Resp, Temperature cards
                    </span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('showVitalsTelemetry', !featureToggles.showVitalsTelemetry)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.showVitalsTelemetry ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: ICU Laboratory Biomarkers Panel */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      ICU Laboratory Biomarkers Panel
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Serum Lactate, WBC, Creatinine, Platelets, Glucose cards
                    </span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('showLabBiomarkers', !featureToggles.showLabBiomarkers)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.showLabBiomarkers ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: Sepsis-3 1-Hour Bundle Checklist */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Sepsis-3 1-Hour Resuscitation Bundle Checklist
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Interactive clinical actions (Cultures, Antibiotics, Bolus, Lactate)
                    </span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('showSepsisBundle', !featureToggles.showSepsisBundle)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.showSepsisBundle ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: Event Timeline */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Chronological Shift Event Timeline
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Recent logged clinical events and attending notes
                    </span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('showEventTimeline', !featureToggles.showEventTimeline)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.showEventTimeline ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: Critical Alert Banners */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Critical Alert Escalation Banner
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Red pulsing banner atop patient monitor when acute sepsis alert triggers
                    </span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('showCriticalAlertBanner', !featureToggles.showCriticalAlertBanner)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.showCriticalAlertBanner ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Specific Vital Telemetry Indicators & Micro Windows */}
            <div className="space-y-4 mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                2. Advanced Indicators & Micro Window Historical Inspection
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Toggle: Click-to-inspect Micro Window */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
                  <div>
                    <strong className="text-xs font-bold text-indigo-950 block flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>Click-to-Inspect Micro Window (History Modal)</span>
                    </strong>
                    <span className="text-[11px] text-indigo-900">
                      When clicked, any vital/lab card pops up a micro window showing 24H history trajectory
                    </span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('enableMicroWindows', !featureToggles.enableMicroWindows)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.enableMicroWindows ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: Shock Index */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Derived Shock Index Card (HR / SBP)
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Occult shock ratio in Bedside Vitals panel
                    </span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('showShockIndex', !featureToggles.showShockIndex)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.showShockIndex ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: EtCO2 */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      End-Tidal CO₂ (EtCO₂) Card
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Capnography hypocapnia indicator
                    </span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('showEtCO2', !featureToggles.showEtCO2)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.showEtCO2 ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: Arterial Base Excess */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Arterial Base Excess Card
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Metabolic acidemia biomarker in laboratory panel
                    </span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('showBaseExcess', !featureToggles.showBaseExcess)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.showBaseExcess ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Dashboard & Ward Surveillance Overview Components */}
            <div className="space-y-4 mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    3. Dashboard & Ward Surveillance Overview Components
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Toggle individual clinical cards, trajectory charts, and redirect controls on the main dashboard.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Toggle: Quick Filter & Redirect Bar (Targeted by CSS Selector) */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/60 transition">
                  <div>
                    <strong className="text-xs font-bold text-indigo-950 block flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>Risk Tier Stratification Quick Filter Bar</span>
                    </strong>
                    <span className="text-[11px] text-indigo-900/80">
                      Bottom bar with Critical (2), Elevated (4), Watch (6) quick filter buttons and Full Analytics link
                    </span>
                  </div>
                  <button
                    id="btn-toggle-ward-quick-filter"
                    onClick={() => setFeatureToggle('showWardQuickFilter', featureToggles.showWardQuickFilter === false ? true : false)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition cursor-pointer ${
                      featureToggles.showWardQuickFilter !== false ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                    title="Toggle Risk Tier Stratification Quick Filter Bar"
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: Risk Tier Stratification Card */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Risk Tier Stratification Card
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Distribution breakdown of 24 ICU patients across Low, Watch, Elevated, and Critical
                    </span>
                  </div>
                  <button
                    id="btn-toggle-ward-distribution"
                    onClick={() => setFeatureToggle('showWardDistribution', featureToggles.showWardDistribution === false ? true : false)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition cursor-pointer ${
                      featureToggles.showWardDistribution !== false ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                    title="Toggle Risk Tier Stratification Card"
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: Ward Aggregate Risk Trajectory Chart */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      ICU Ward Aggregate Risk Trajectory Chart (12-Hour)
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Mean predicted sepsis risk area chart across all monitored ward beds
                    </span>
                  </div>
                  <button
                    id="btn-toggle-ward-trajectory"
                    onClick={() => setFeatureToggle('showWardTrajectoryChart', featureToggles.showWardTrajectoryChart === false ? true : false)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition cursor-pointer ${
                      featureToggles.showWardTrajectoryChart !== false ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                    title="Toggle Ward Trajectory Chart"
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: Ward Overview Charts Row */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Ward Overview & Trends Secondary Row
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Entire secondary grid container (Trajectory Chart + Stratification Breakdown)
                    </span>
                  </div>
                  <button
                    id="btn-toggle-ward-overview"
                    onClick={() => setFeatureToggle('showWardOverviewCharts', !featureToggles.showWardOverviewCharts)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition cursor-pointer ${
                      featureToggles.showWardOverviewCharts ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                    title="Toggle Ward Overview Charts Row"
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Toggle: 5 KPI Metric Cards */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition md:col-span-2">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Ward Clinical KPI Metric Cards (Top 5 Cards / Button Mode)
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Patients Monitored, High Risk, Critical, Active Alerts, and Coverage cards with interactive button toggle
                    </span>
                  </div>
                  <button
                    id="btn-toggle-kpi-cards"
                    onClick={() => setFeatureToggle('showKpiMetricCards', featureToggles.showKpiMetricCards === false ? true : false)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition cursor-pointer ${
                      featureToggles.showKpiMetricCards !== false ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                    title="Toggle Ward Clinical KPI Cards"
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>
            </div>

            {/* Section 4: Navigation Menu Modules */}
            <div className="space-y-4 mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                4. Sidebar Navigation Module Toggles
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Prototype Stream in Nav */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">Live Prototype Stream</strong>
                    <span className="text-[11px] text-slate-500">Hardware & Serial Link</span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('enablePrototypeTab', featureToggles.enablePrototypeTab === false ? true : false)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.enablePrototypeTab !== false ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Simulation Lab in Nav */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">Simulation Lab</strong>
                    <span className="text-[11px] text-slate-500">Navigation link</span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('enableSimulationLab', !featureToggles.enableSimulationLab)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.enableSimulationLab ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Analytics in Nav */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">Clinical Analytics</strong>
                    <span className="text-[11px] text-slate-500">Navigation link</span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('enableAnalyticsTab', !featureToggles.enableAnalyticsTab)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.enableAnalyticsTab ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Reports in Nav */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">Shift Reports</strong>
                    <span className="text-[11px] text-slate-500">Navigation link</span>
                  </div>
                  <button
                    onClick={() => setFeatureToggle('enableReportsTab', !featureToggles.enableReportsTab)}
                    className={`flex items-center gap-1 rounded-full p-1 w-12 transition ${
                      featureToggles.enableReportsTab ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: CARESENSE COGNITIVE ENGINE & DUAL-PIPELINE GOVERNANCE    */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'engine-integration' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs">
            {/* Header with Title and Master Pipeline Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shrink-0">
                  <Cpu size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                      CareSense Cognitive Engine & Dual-Pipeline Governance
                    </h2>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      ensembleConfig.enabled && ensembleConfig.apiKey
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {ensembleConfig.enabled && ensembleConfig.apiKey ? 'Ensemble Active' : 'Base XGBoost Only'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure the CareSense deep cognitive reasoning pipeline and govern consensus probability blending with the CareSense base XGBoost model.
                  </p>
                </div>
              </div>

              {/* Master ON / OFF Switch */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                    Pipeline Switch
                  </span>
                  <span className={`text-xs font-black ${ensembleConfig.enabled ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {ensembleConfig.enabled ? 'INTEGRATION ON' : 'INTEGRATION OFF'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = toggleEnsemble();
                    addToast({
                      type: next ? 'success' : 'info',
                      title: next ? 'CareSense Cognitive Integration Activated' : 'CareSense Cognitive Integration Deactivated',
                      description: next
                        ? `Consensus model active (${ensembleConfig.apiWeight}% Cognitive Pipeline / ${ensembleConfig.backendWeight}% Base XGBoost).`
                        : 'System operates exclusively on CareSense Base XGBoost.',
                    });
                  }}
                  className={`flex items-center gap-1 rounded-full p-1 w-14 h-7 transition-all duration-300 cursor-pointer shadow-inner ${
                    ensembleConfig.enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                  title="Turn Integration ON or OFF"
                >
                  <div className="h-5 w-5 rounded-full bg-white shadow-md transform transition" />
                </button>
              </div>
            </div>

            {/* Status Information Box */}
            <div className={`mt-4 rounded-xl p-3.5 text-xs flex items-start gap-3 border ${
              ensembleConfig.enabled
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <CheckCircle2 size={18} className={`shrink-0 mt-0.5 ${ensembleConfig.enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <p className="font-bold">
                  {ensembleConfig.enabled
                    ? 'Dual-Engine Consensus Integration is Active'
                    : 'Integration is Turned Off (Native CareSense Backend Active)'}
                </p>
                <p className="text-[11px] mt-0.5 text-slate-600 leading-relaxed">
                  {ensembleConfig.enabled
                    ? `Patient telemetry (8 vitals & 26 laboratories) is dispatched to the cognitive inference engine and blended with CareSense Base XGBoost backend results at a ratio of ${ensembleConfig.apiWeight}% to ${ensembleConfig.backendWeight}%.`
                    : 'The dashboard runs 100% on the authentic CareSense FastAPI XGBoost backend without any secondary engine calculations.'}
                </p>
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* 1. API KEY CONFIGURATION */}
            {/* -------------------------------------------------------- */}
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Key size={14} className="text-indigo-600" />
                    <span>CareSense Cognitive Pipeline API Key</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    API key is entered only in this Admin Panel. It is securely persisted and never exposed to general application users.
                  </p>
                </div>
                {ensembleConfig.apiKey && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={11} />
                    <span>Key Configured</span>
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder="Enter CareSense Cognitive Engine API Key..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-indigo-600 focus:outline-hidden pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showApiKey ? 'Hide Key' : 'Show Key'}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateEnsembleConfig({ apiKey: apiKeyInput.trim() });
                      addToast({
                        type: 'success',
                        title: 'API Key Saved',
                        description: 'CareSense Cognitive Engine Key persisted securely.',
                      });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs shrink-0 cursor-pointer"
                  >
                    <Save size={13} />
                    <span>Save Key</span>
                  </button>

                  <button
                    type="button"
                    disabled={isTestingKey}
                    onClick={async () => {
                      setIsTestingKey(true);
                      setKeyTestFeedback({ status: 'idle', message: 'Testing engine connectivity...' });
                      try {
                        const res = await testEnsembleKey(apiKeyInput.trim());
                        setKeyTestFeedback({
                          status: res.success ? 'success' : 'error',
                          message: res.message,
                          latencyMs: res.latencyMs,
                          sampleProb: res.sampleProbability,
                        });
                        addToast({
                          type: res.success ? 'success' : 'critical',
                          title: res.success ? 'Engine Handshake Verified' : 'Engine Connection Failed',
                          description: res.message,
                        });
                      } catch (err: any) {
                        setKeyTestFeedback({
                          status: 'error',
                          message: err?.message || 'Handshake failed',
                        });
                      } finally {
                        setIsTestingKey(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw size={13} className={isTestingKey ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
                    <span>{isTestingKey ? 'Verifying...' : 'Test Connection'}</span>
                  </button>

                  {apiKeyInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setApiKeyInput('');
                        updateEnsembleConfig({ apiKey: '' });
                        setKeyTestFeedback({ status: 'idle', message: '' });
                        addToast({
                          type: 'info',
                          title: 'API Key Cleared',
                          description: 'CareSense Cognitive Engine key removed.',
                        });
                      }}
                      className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 hover:bg-rose-100 transition shrink-0 cursor-pointer"
                      title="Clear API Key"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Handshake Diagnostic Feedback */}
              {keyTestFeedback.message && (
                <div className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                  keyTestFeedback.status === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : keyTestFeedback.status === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {keyTestFeedback.status === 'success' ? (
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold">{keyTestFeedback.message}</span>
                  </div>
                  {keyTestFeedback.latencyMs !== undefined && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/80 border border-slate-200 font-bold shrink-0">
                      {keyTestFeedback.latencyMs}ms
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* -------------------------------------------------------- */}
            {/* 2. PROBABILITY COMBINATION WEIGHT EDITOR (70% / 30%) */}
            {/* -------------------------------------------------------- */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Sliders size={14} className="text-indigo-600" />
                    <span>Consensus Probability Weight Combination Editor</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure the exact combination percentages for the final sepsis prediction. Changes take effect across the entire application immediately.
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1">
                    {apiWeightInput}% Cognitive Engine
                  </span>
                  <span className="text-slate-400 font-bold">+</span>
                  <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
                    {100 - apiWeightInput}% Base XGBoost
                  </span>
                </div>
              </div>

              {/* Slider Control Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-indigo-900 flex items-center gap-1">
                    <Sparkles size={13} className="text-indigo-600" />
                    <span>Cognitive Engine Result Weight: {apiWeightInput}%</span>
                  </span>
                  <span className="text-slate-700 flex items-center gap-1">
                    <Cpu size={13} className="text-slate-500" />
                    <span>CareSense Base XGBoost Weight: {100 - apiWeightInput}%</span>
                  </span>
                </div>

                {/* Range Input */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={apiWeightInput}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setApiWeightInput(val);
                    setEnsembleWeights(val);
                  }}
                  className="w-full accent-indigo-600 cursor-pointer h-2"
                />

                {/* Visual Ratio Progress Bar */}
                <div className="space-y-1">
                  <div className="h-3.5 w-full rounded-full bg-slate-200 overflow-hidden flex">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-150 flex items-center justify-center text-[9px] text-white font-mono font-bold"
                      style={{ width: `${apiWeightInput}%` }}
                      title={`Cognitive Engine: ${apiWeightInput}%`}
                    >
                      {apiWeightInput >= 15 ? `${apiWeightInput}%` : ''}
                    </div>
                    <div
                      className="h-full bg-slate-700 transition-all duration-150 flex items-center justify-center text-[9px] text-white font-mono font-bold"
                      style={{ width: `${100 - apiWeightInput}%` }}
                      title={`CareSense Base XGBoost: ${100 - apiWeightInput}%`}
                    >
                      {100 - apiWeightInput >= 15 ? `${100 - apiWeightInput}%` : ''}
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>0% Cognitive</span>
                    <span className="font-bold text-indigo-700">Default: 70% Cognitive / 30% Base</span>
                    <span>100% Cognitive</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">Ensemble Presets:</span>

                  <button
                    type="button"
                    onClick={() => {
                      setApiWeightInput(70);
                      setEnsembleWeights(70);
                      addToast({ type: 'success', title: 'Weights Updated', description: 'Set to 70% Cognitive / 30% Base XGBoost.' });
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition border cursor-pointer ${
                      apiWeightInput === 70
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    70% / 30% (Standard Specification)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setApiWeightInput(50);
                      setEnsembleWeights(50);
                      addToast({ type: 'success', title: 'Weights Updated', description: 'Set to 50% Cognitive / 50% Base XGBoost.' });
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition border cursor-pointer ${
                      apiWeightInput === 50
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    50% / 50% (Balanced Dual-Engine)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setApiWeightInput(80);
                      setEnsembleWeights(80);
                      addToast({ type: 'success', title: 'Weights Updated', description: 'Set to 80% Cognitive / 20% Base XGBoost.' });
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition border cursor-pointer ${
                      apiWeightInput === 80
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    80% / 20% (High Cognitive Weight)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setApiWeightInput(30);
                      setEnsembleWeights(30);
                      addToast({ type: 'success', title: 'Weights Updated', description: 'Set to 30% Cognitive / 70% Base XGBoost.' });
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition border cursor-pointer ${
                      apiWeightInput === 30
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    30% / 70% (Base XGBoost Prioritized)
                  </button>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* 3. MATHEMATICAL CALCULATION SANDBOX / LIVE VERIFICATION */}
            {/* -------------------------------------------------------- */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-500" />
                <span>Live Blended Consensus Sandbox & Mathematical Verification</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Interactive simulator demonstrating exactly how probabilities are blended in real time across the CareSense platform.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50">
                {/* Input A: Cognitive Probability */}
                <div className="p-3 rounded-lg bg-white border border-indigo-100 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-950">
                    <span>Cognitive Engine Input</span>
                    <span className="font-mono text-indigo-600">{testSimCognitiveProb}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={testSimCognitiveProb}
                    onChange={e => setTestSimCognitiveProb(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="text-[11px] font-mono text-slate-500">
                    Weighted: {(testSimCognitiveProb * (apiWeightInput / 100)).toFixed(1)}% (× {apiWeightInput / 100})
                  </div>
                </div>

                {/* Input B: CareSense Base XGBoost */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                    <span>CareSense Base Backend Input</span>
                    <span className="font-mono text-slate-700">{testSimBaseProb}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={testSimBaseProb}
                    onChange={e => setTestSimBaseProb(Number(e.target.value))}
                    className="w-full accent-slate-700 cursor-pointer"
                  />
                  <div className="text-[11px] font-mono text-slate-500">
                    Weighted: {(testSimBaseProb * ((100 - apiWeightInput) / 100)).toFixed(1)}% (× {(100 - apiWeightInput) / 100})
                  </div>
                </div>

                {/* Output: Blended Probability */}
                {(() => {
                  const blendedVal = (testSimCognitiveProb * (apiWeightInput / 100)) + (testSimBaseProb * ((100 - apiWeightInput) / 100));
                  const tier = blendedVal >= 80 ? 'CRITICAL' : blendedVal >= 60 ? 'ELEVATED' : blendedVal >= 30 ? 'WATCH' : 'LOW';
                  return (
                    <div className="p-3 rounded-lg bg-white border border-indigo-200 space-y-1.5 flex flex-col justify-between shadow-2xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-extrabold uppercase text-slate-400">Blended Consensus</span>
                        <RiskBadge tier={tier} size="sm" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black font-mono text-slate-900">
                          {blendedVal.toFixed(1)}%
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ({(blendedVal / 100).toFixed(3)})
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500">
                        = ({apiWeightInput}% × {testSimCognitiveProb}%) + ({100 - apiWeightInput}% × {testSimBaseProb}%)
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* 4. CLINICAL BRANDING ASSURANCE */}
            {/* -------------------------------------------------------- */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-700">
                  Unified CareSense Branding Assurance:
                </span>
                <span>
                  All frontend views, cards, and reports strictly display CareSense branding. No external keys or names are exposed.
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                CareSense Ensemble v2.0
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PATIENT COHORT MANAGEMENT ("in admin pannel i want control all data and patient information") */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'patients' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Patient Cohort Governance & Visibility Controls
                </h2>
                <p className="text-xs text-slate-500">
                  Edit patient identifiers, demographics, and toggle whether each patient appears on the clinical dashboard census.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={adminSearchQuery}
                  onChange={e => setAdminSearchQuery(e.target.value)}
                  placeholder="Search code or bed..."
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Patients Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Patient Code</th>
                    <th className="py-3 px-3">ICU Bed</th>
                    <th className="py-3 px-3">Age / Sex</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">App Visibility</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPatients.map(p => {
                    const isHidden = featureToggles.hiddenPatientIds.includes(p.id);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {p.patient_code}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                          {p.icu_bed}
                        </td>
                        <td className="py-3 px-3">
                          {p.age}y • {p.gender}
                        </td>
                        <td className="py-3 px-3">
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => togglePatientVisibility(p.id)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                              isHidden
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isHidden ? 'Hidden from App' : 'Visible in App'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditPatient(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Edit size={12} />
                            <span>Edit Metadata</span>
                          </button>

                          <button
                            onClick={() => selectPatientAndNavigate(p.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition"
                          >
                            <span>Monitor</span>
                            <ArrowRight size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: LIVE CLINICAL DATA CONTROL ("in admin pannel i want control all data") */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'clinical-data' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Control Live Clinical Telemetry & Laboratory Data
                </h2>
                <p className="text-xs text-slate-500">
                  Directly override vital signs and biomarker values for any monitored patient to observe instant ML recalculations.
                </p>
              </div>

              {/* Patient Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Target Patient:</span>
                <select
                  value={selectedClinicalPatientId}
                  onChange={e => setSelectedClinicalPatientId(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-hidden"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.patient_code} ({p.icu_bed})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vitals & Labs Override Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vitals Form */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase">
                  <Heart size={16} className="text-rose-600" />
                  <span>Bedside Vital Signs Controls</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={vitalsEdit.hr}
                      onChange={e => setVitalsEdit({ ...vitalsEdit, hr: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Systolic BP (mmHg)</label>
                    <input
                      type="number"
                      value={vitalsEdit.sbp}
                      onChange={e => setVitalsEdit({ ...vitalsEdit, sbp: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Diastolic BP (mmHg)</label>
                    <input
                      type="number"
                      value={vitalsEdit.dbp}
                      onChange={e => setVitalsEdit({ ...vitalsEdit, dbp: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">SpO₂ (%)</label>
                    <input
                      type="number"
                      value={vitalsEdit.o2sat}
                      onChange={e => setVitalsEdit({ ...vitalsEdit, o2sat: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Temperature (°C)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={vitalsEdit.temp}
                      onChange={e => setVitalsEdit({ ...vitalsEdit, temp: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Resp Rate (bpm)</label>
                    <input
                      type="number"
                      value={vitalsEdit.resp}
                      onChange={e => setVitalsEdit({ ...vitalsEdit, resp: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Labs Form */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase">
                  <Droplet size={16} className="text-sky-600" />
                  <span>Laboratory Biomarkers Controls</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Serum Lactate (mmol/L)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={labsEdit.lactate}
                      onChange={e => setLabsEdit({ ...labsEdit, lactate: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">WBC (k/µL)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={labsEdit.wbc}
                      onChange={e => setLabsEdit({ ...labsEdit, wbc: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Creatinine (mg/dL)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={labsEdit.creatinine}
                      onChange={e => setLabsEdit({ ...labsEdit, creatinine: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Platelets (k/µL)</label>
                    <input
                      type="number"
                      value={labsEdit.platelets}
                      onChange={e => setLabsEdit({ ...labsEdit, platelets: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">Serum Glucose (mg/dL)</label>
                    <input
                      type="number"
                      value={labsEdit.glucose}
                      onChange={e => setLabsEdit({ ...labsEdit, glucose: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveClinicalData}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm"
              >
                <Save size={14} />
                <span>Publish Clinical Data Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal Dialog */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Edit Patient Metadata
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update administrative record for {editingPatient.patient_code}
            </p>

            <form onSubmit={handleSaveEditPatient} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Identifier Code</label>
                <input
                  type="text"
                  required
                  value={patientForm.patient_code || ''}
                  onChange={e => setPatientForm({ ...patientForm, patient_code: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ICU Bed</label>
                  <input
                    type="text"
                    required
                    value={patientForm.icu_bed || ''}
                    onChange={e => setPatientForm({ ...patientForm, icu_bed: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-xs focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={patientForm.age || ''}
                    onChange={e => setPatientForm({ ...patientForm, age: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={patientForm.gender || 'M'}
                    onChange={e => setPatientForm({ ...patientForm, gender: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={patientForm.status || 'ACTIVE'}
                    onChange={e => setPatientForm({ ...patientForm, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DISCHARGED">DISCHARGED</option>
                    <option value="TRANSFERRED">TRANSFERRED</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
                >
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
