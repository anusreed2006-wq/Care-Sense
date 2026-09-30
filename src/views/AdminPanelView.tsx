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
} from 'lucide-react';

export const AdminPanelView: React.FC = () => {
  const {
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin,
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
  } = useCareSense();

  // Login Form State
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin Active Tab
  const [adminTab, setAdminTab] = useState<'toggles' | 'patients' | 'clinical-data'>('toggles');

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
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition shadow-2xs"
          >
            <span>Main App</span>
            <ArrowRight size={13} />
          </button>

          <button
            onClick={resetFeatureToggles}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition shadow-2xs"
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
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
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

            {/* Section 3: Navigation Menu Modules */}
            <div className="space-y-4 mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                3. Sidebar Navigation Module Toggles
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
