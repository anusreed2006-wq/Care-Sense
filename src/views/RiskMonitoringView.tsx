import React, { useState } from 'react';
import { useCareSense } from '../hooks/useCareSense';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  Activity,
  AlertOctagon,
  TrendingUp,
  Clock,
  Heart,
  Droplet,
  Wind,
  Thermometer,
  FileCheck2,
  BrainCircuit,
  Calendar,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  HelpCircle,
  Stethoscope,
  Info,
  Sliders,
  Maximize2,
  Cpu,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

/**
 * Diagnostic action guidelines for key clinical drivers
 */
const getClinicalActionGuideline = (featureName: string): string => {
  const lower = featureName.toLowerCase();
  if (lower.includes('lactate')) {
    return 'Re-measure serum lactate every 2–4 hours; target >20% clearance per 2 hours to confirm adequate tissue reperfusion.';
  }
  if (lower.includes('pressure') || lower.includes('map') || lower.includes('sbp') || lower.includes('bp')) {
    return 'Maintain MAP ≥ 65 mmHg. Confirm fluid responsiveness; titrate norepinephrine if hypotension persists after initial fluid challenge.';
  }
  if (lower.includes('resp') || lower.includes('spo2') || lower.includes('rr') || lower.includes('o2')) {
    return 'Perform arterial blood gas (ABG); evaluate work of breathing, calculate PaO2/FiO2 ratio, and escalate supplemental oxygen or non-invasive ventilation.';
  }
  if (lower.includes('wbc') || lower.includes('band') || lower.includes('temp') || lower.includes('crp') || lower.includes('procalcitonin')) {
    return 'Obtain 2 sets of blood cultures prior to broad-spectrum antimicrobial administration within the first 60 minutes; identify septic source.';
  }
  if (lower.includes('creatinine') || lower.includes('bun') || lower.includes('renal') || lower.includes('kidney') || lower.includes('urine')) {
    return 'Strict hourly urine output monitoring (>0.5 mL/kg/h); avoid nephrotoxic medications and adjust antimicrobial dosing for renal clearance.';
  }
  if (lower.includes('platelet') || lower.includes('coag') || lower.includes('inr')) {
    return 'Monitor for disseminated intravascular coagulation (DIC); assess for microvascular thrombosis or bleeding signs.';
  }
  return 'Review dynamic bedside trends, correlate with clinical exam, and maintain targeted organ-support protocols.';
};

export const RiskMonitoringView: React.FC = () => {
  const {
    activePatientData,
    patients,
    setSelectedPatientId,
    setActiveTab,
    acknowledgeAlert,
    resolveAlert,
    addToast,
    openMetricHistory,
    featureToggles,
    isLiveInferring,
    triggerLivePrediction,
    backendApiStatus,
  } = useCareSense();

  const [timeHorizon, setTimeHorizon] = useState<'6H' | '12H' | '24H' | '48H'>('24H');
  const [activeChecklist, setActiveChecklist] = useState<Record<string, boolean>>({
    cultures: true,
    antibiotics: true,
    crystalloids: false,
    vasopressors: false,
    lactateRepeat: false,
  });

  if (!activePatientData) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold text-slate-500">Loading patient telemetry...</p>
      </div>
    );
  }

  const { patient, latestVitals, latestLabs, currentPrediction, riskHistory, explanations, activeAlerts, recentTimeline } = activePatientData;

  const toggleChecklist = (key: string, label: string) => {
    const nextVal = !activeChecklist[key];
    setActiveChecklist(prev => ({ ...prev, [key]: nextVal }));
    if (nextVal) {
      addToast({
        type: 'success',
        title: 'Sepsis Bundle Step Completed',
        description: `Verified: ${label}`,
      });
    }
  };

  const isCritical = currentPrediction.risk_tier === 'CRITICAL';

  // Smooth scroll redirect helper to target specific clinical section
  const scrollToSection = (elementId: string, ringColorClass = 'ring-sky-500') => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-4', ringColorClass, 'ring-offset-4', 'transition-all', 'duration-300');
      setTimeout(() => {
        el.classList.remove('ring-4', ringColorClass, 'ring-offset-4');
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Patient Clinical Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white font-extrabold text-lg shadow-sm">
            {patient.icu_bed.replace('ICU-', '')}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Patient {patient.patient_code}
              </h1>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                {patient.icu_bed}
              </span>
              <RiskBadge tier={currentPrediction.risk_tier} pulse={isCritical} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
              <span>Age: <strong>{patient.age}y</strong></span>
              <span>•</span>
              <span>Sex: <strong>{patient.gender === 'M' ? 'Male' : 'Female'}</strong></span>
              <span>•</span>
              <span>Admission: <strong>{new Date(patient.admission_time).toLocaleDateString()}</strong></span>
              <span>•</span>
              <span>Status: <strong className="text-emerald-700 uppercase">Active Telemetry</strong></span>
            </div>
          </div>
        </div>

        {/* Patient Switcher Dropdown & Simulation Link */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label="Select ICU Patient to monitor"
            value={patient.id}
            onChange={e => setSelectedPatientId(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:border-sky-500 focus:outline-hidden"
          >
            {patients.slice(0, 10).map(p => (
              <option key={p.id} value={p.id}>
                {p.patient_code} ({p.icu_bed}) - Age {p.age}
              </option>
            ))}
          </select>

          <button
            onClick={() => setActiveTab('simulation')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 transition shadow-2xs"
          >
            <Sliders size={13} />
            <span>Simulate Vitals</span>
          </button>
        </div>
      </div>

      {/* Quick Section Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1.5 flex items-center gap-1">
          <span>Redirect To Section:</span>
        </span>
        <button
          onClick={() => scrollToSection('section-risk-trajectory', 'ring-rose-500')}
          className="rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 px-3 py-1 text-xs font-bold text-slate-700 transition"
        >
          Sepsis Trajectory ↓
        </button>
        <button
          onClick={() => scrollToSection('section-shap-explanation', 'ring-sky-500')}
          className="rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 px-3 py-1 text-xs font-bold text-slate-700 transition"
        >
          AI Feature Drivers ↓
        </button>
        <button
          onClick={() => scrollToSection('section-telemetry-vitals', 'ring-rose-500')}
          className="rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 px-3 py-1 text-xs font-bold text-slate-700 transition"
        >
          Bedside Vitals ↓
        </button>
        <button
          onClick={() => scrollToSection('section-lab-biomarkers', 'ring-amber-500')}
          className="rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 px-3 py-1 text-xs font-bold text-slate-700 transition"
        >
          Lab Biomarkers ↓
        </button>
        <button
          onClick={() => scrollToSection('section-sepsis-bundle', 'ring-emerald-500')}
          className="rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-3 py-1 text-xs font-bold text-slate-700 transition"
        >
          1-Hour Bundle ↓
        </button>
        <button
          onClick={() => scrollToSection('section-clinical-timeline', 'ring-indigo-500')}
          className="rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-3 py-1 text-xs font-bold text-slate-700 transition"
        >
          Event Timeline ↓
        </button>
      </div>

      {/* Critical Alert Escalation Banner if patient has active alerts */}
      {featureToggles.showCriticalAlertBanner && activeAlerts.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/90 p-4.5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertOctagon size={24} className="text-rose-600 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-900">
                    CRITICAL SEPSIS EARLY-WARNING ALERT
                  </span>
                  <span className="text-[11px] font-mono text-rose-700">
                    {new Date(activeAlerts[0].created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs font-semibold text-rose-950 mt-0.5">
                  {activeAlerts[0].message}
                </p>
                <p className="text-[11px] text-rose-800 mt-1">
                  Recommendation: Initiate Sepsis-3 resuscitation bundle within 60 minutes. Order STAT blood cultures & broad-spectrum antimicrobials.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => acknowledgeAlert(activeAlerts[0].id)}
                className="rounded-xl border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100 transition shadow-2xs"
              >
                Acknowledge Alert
              </button>
              <button
                onClick={() => resolveAlert(activeAlerts[0].id)}
                className="rounded-xl bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-800 transition shadow-xs"
              >
                Resolve & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Row: Massive Risk Score Card & 24-Hour Trajectory Graph */}
      {(featureToggles.showRiskScoreCard || featureToggles.showRiskTrajectory) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Massive Sepsis Risk Score Card (Section 17) */}
          {featureToggles.showRiskScoreCard && (
            <div className={`rounded-2xl border bg-white p-6 shadow-xs flex flex-col justify-between ${
              isCritical ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
            } ${!featureToggles.showRiskTrajectory ? 'lg:col-span-3' : ''}`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Predicted Sepsis Risk
                  </span>
                  <RiskBadge tier={currentPrediction.risk_tier} size="md" pulse={isCritical} />
                </div>

                {/* Giant Probability Number */}
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 font-mono">
                    {currentPrediction.risk_probability.toFixed(2)}
                  </span>
                  <div>
                    <span className="text-lg font-bold text-slate-500 block">
                      ({(currentPrediction.risk_probability * 100).toFixed(0)}%)
                    </span>
                    <span className="text-xs font-bold text-rose-600 inline-flex items-center gap-0.5">
                      <TrendingUp size={12} />
                      +{((currentPrediction.change || 0.12) * 100).toFixed(0)}% in 4h
                    </span>
                  </div>
                </div>

                {/* Risk Tier Progress Bar */}
                <div className="mt-4">
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical
                          ? 'bg-gradient-to-r from-orange-500 to-rose-600'
                          : 'bg-gradient-to-r from-emerald-500 to-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, currentPrediction.risk_probability * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                    <span>0.00 Low</span>
                    <span>0.30 Watch</span>
                    <span>0.60 Elevated</span>
                    <span>0.80 Critical</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Prediction Horizon:</span>
                  <strong className="text-slate-900">{currentPrediction.prediction_horizon || 'Next 6 Hours'}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Model Version:</span>
                  <strong className="font-mono text-sky-700">{currentPrediction.model_version || 'caresense-0.1.0-676972cccc'}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Validation Status:</span>
                  <strong className={currentPrediction.clinically_validated ? "text-emerald-700" : "text-amber-700"}>
                    {currentPrediction.clinically_validated ? 'Clinically Validated' : 'Research Prototype'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* 24-Hour Risk Progression Trajectory Chart (Section 18) */}
          {featureToggles.showRiskTrajectory && (
            <div
              id="section-risk-trajectory"
              className={`${featureToggles.showRiskScoreCard ? 'lg:col-span-2' : 'lg:col-span-3'} rounded-2xl border border-slate-200 bg-white p-6 shadow-xs scroll-mt-24 transition-all duration-300`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Temporal Sepsis Risk Progression Trajectory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Continuous risk evolution plotted against Sepsis-3 clinical thresholds
                  </p>
                </div>

                {/* Horizon Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {(['6H', '12H', '24H', '48H'] as const).map(h => (
                    <button
                      key={h}
                      onClick={() => setTimeHorizon(h)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        timeHorizon === h
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskHistory} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="riskProgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      domain={[0, 1.0]}
                      ticks={[0, 0.3, 0.6, 0.8, 1.0]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={val => `${Math.round(val * 100)}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${(Number(val) * 100).toFixed(0)}% (p=${Number(val).toFixed(2)})`, 'Risk']}
                    />
                    {/* Clinical reference lines */}
                    <ReferenceLine y={0.80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'CRITICAL (0.80)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
                    <ReferenceLine y={0.60} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'ELEVATED (0.60)', fill: '#f97316', fontSize: 10, position: 'insideTopRight' }} />
                    <ReferenceLine y={0.30} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'WATCH (0.30)', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
                    <Area
                      type="monotone"
                      dataKey="risk"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#riskProgGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Quality Flags from Causal Hourly Pipeline */}
      {currentPrediction.data_quality_flags && currentPrediction.data_quality_flags.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info size={17} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-900">
                Data Quality & Preprocessing Notes
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {currentPrediction.data_quality_flags.map((flag: string) => (
                  <span
                    key={flag}
                    className="rounded-md bg-amber-100 border border-amber-300/80 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-950"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="text-[11px] text-amber-800 font-medium shrink-0">
            CareSense Causal Hourly Pipeline
          </span>
        </div>
      )}

      {/* Row: Explainable AI SHAP Feature Importance (Section 19) */}
      {featureToggles.showExplainableAI && (
        <div
          id="section-shap-explanation"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs scroll-mt-24 transition-all duration-300"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <BrainCircuit size={18} className="text-sky-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Explainable AI: Key Clinical Drivers (SHAP Attributions)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quantified diagnostic attributions explaining the model's predicted sepsis risk ({Math.round(currentPrediction.risk_probability * 100)}%)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={triggerLivePrediction}
                disabled={isLiveInferring}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-bold text-sky-800 hover:bg-sky-100 transition-colors disabled:opacity-50"
                title="Sync prediction with live CareSense Render backend"
              >
                <RefreshCw size={12} className={isLiveInferring ? 'animate-spin' : ''} />
                <span>{isLiveInferring ? 'Predicting...' : `Model: ${currentPrediction.model_version || 'caresense-0.1.0-676972cccc'}`}</span>
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
                {explanations.length} Primary Drivers
              </span>
            </div>
          </div>

          {/* Key Clinical Takeaways Summary Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                Primary Clinical Trigger
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                {explanations[0]?.feature_name || 'Serum Lactate'}
              </div>
              <div className="text-xs font-semibold text-rose-700 font-mono mt-0.5">
                {explanations[0]?.feature_value || 'Elevated'}
              </div>
              <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                {explanations[0]?.clinical_context || 'Severe hypoperfusion requiring prompt hemodynamic correction.'}
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Dominant Pathophysiology
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                Distributive Shock & Vasoplegia
              </div>
              <div className="text-xs text-amber-900 font-medium mt-0.5">
                Systemic vasodilation & microvascular leak
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Autoregulatory perfusion threshold compromised with acute metabolic compensation.
              </p>
            </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                Immediate Clinical Focus
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                Sepsis-3 1-Hour Bundle
              </div>
              <div className="text-xs text-sky-900 font-medium mt-0.5">
                Cultures • Antibiotics • Volume • Vasopressors
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Target MAP ≥ 65 mmHg and demonstrate ≥20% lactate clearance over 2 hours.
              </p>
            </div>
          </div>

          {/* Structured List of Important Clinical Points */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Important Clinical Points (Ranked by Attribution Weight)
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                Structured clinical breakdown
              </span>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
              {explanations.map((exp, index) => {
                const isPositive = exp.direction === 'INCREASES_RISK' || exp.shap_value > 0;
                const impactPercentage = Math.abs(exp.shap_value * 100).toFixed(1);
                const isHighImpact = Math.abs(exp.shap_value) >= 0.2;
                const isModerateImpact = Math.abs(exp.shap_value) >= 0.1;

                return (
                  <div
                    key={exp.id || index}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Numeric Rank Badge */}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white font-mono text-xs font-bold shadow-2xs">
                        #{exp.rank || index + 1}
                      </span>

                      <div className="space-y-1.5">
                        {/* Driver Title and Value */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {exp.feature_name}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 border border-slate-200">
                            Observed: {exp.feature_value}
                          </span>
                        </div>

                        {/* Important Point 1: Clinical Context & Rationale */}
                        <div className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="font-bold text-slate-900 shrink-0">• Clinical Rationale:</span>
                          <span>{exp.clinical_context}</span>
                        </div>

                        {/* Important Point 2: Actionable Care Guideline */}
                        <div className="text-xs text-slate-600 flex items-start gap-2">
                          <span className="font-bold text-indigo-900 shrink-0">• Bedside Action:</span>
                          <span className="text-slate-600">{getClinicalActionGuideline(exp.feature_name)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Attribution & Impact Badges */}
                    <div className="sm:text-right shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 pl-10 sm:pl-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold font-mono ${
                          isPositive
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isPositive ? `+${exp.shap_value.toFixed(3)}` : exp.shap_value.toFixed(3)}
                        <span className="text-[10px] font-sans font-medium text-slate-500">
                          ({isPositive ? '+' : '-'}{impactPercentage}%)
                        </span>
                      </span>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isHighImpact
                            ? 'bg-rose-100 text-rose-800'
                            : isModerateImpact
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isHighImpact ? 'High Impact' : isModerateImpact ? 'Moderate Impact' : 'Standard'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Research Prototype Disclaimer Notice */}
          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-500 italic flex items-center gap-2">
            <ShieldAlert size={14} className="text-amber-600 shrink-0" />
            <span>
              {currentPrediction.notice || 'Research prototype: model-estimated risk supports clinical judgment and does not diagnose sepsis. Prototype risk tiers are not clinically validated.'}
            </span>
          </div>
        </div>
      )}

      {/* Row: Telemetry Vital Signs & Laboratory Panels (Section 20) */}
      {(featureToggles.showVitalsTelemetry || featureToggles.showLabBiomarkers) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vital Signs Card */}
          {featureToggles.showVitalsTelemetry && (
            <div
              id="section-telemetry-vitals"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs scroll-mt-24 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-rose-600" />
                  <h2 className="text-sm font-bold text-slate-900">Bedside Telemetry Vitals</h2>
                </div>
                <div className="flex items-center gap-2">
                  {featureToggles.enableMicroWindows && (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60 flex items-center gap-1">
                      <Maximize2 size={10} />
                      Click card for 24h history
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-400">
                    Synced: {new Date(latestVitals.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* HR */}
                <div
                  onClick={() => openMetricHistory('hr', latestVitals.hr, latestVitals.hr > 100)}
                  className={`rounded-xl border border-slate-100 bg-slate-50 p-3 transition group relative ${
                    featureToggles.enableMicroWindows ? 'cursor-pointer hover:border-rose-300 hover:bg-rose-50/20 hover:shadow-xs' : ''
                  }`}
                  title="Click to view 24-hour Heart Rate trajectory in micro window"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Heart Rate (HR)</span>
                    {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-slate-300 group-hover:text-rose-600 transition" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-xl font-black font-mono ${latestVitals.hr > 100 ? 'text-rose-700' : 'text-slate-900'}`}>
                      {latestVitals.hr}
                    </span>
                    <span className="text-[10px] text-slate-400">bpm</span>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-600">↑ Tachycardia</span>
                </div>

                {/* MAP */}
                <div
                  onClick={() => openMetricHistory('map', latestVitals.map, latestVitals.map < 65)}
                  className={`rounded-xl border border-rose-200 bg-rose-50/40 p-3 ring-1 ring-rose-300 transition group relative ${
                    featureToggles.enableMicroWindows ? 'cursor-pointer hover:ring-rose-500 hover:shadow-xs' : ''
                  }`}
                  title="Click to view 24-hour Mean Arterial Pressure trajectory in micro window"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-rose-800">Mean Arterial (MAP)</span>
                    {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-rose-400 group-hover:text-rose-700 transition" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black font-mono text-rose-700">
                      {latestVitals.map}
                    </span>
                    <span className="text-[10px] text-rose-600">mmHg</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700">Refractory &lt; 65</span>
                </div>

                {/* SpO2 */}
                <div
                  onClick={() => openMetricHistory('o2sat', latestVitals.o2sat, latestVitals.o2sat < 92)}
                  className={`rounded-xl border border-slate-100 bg-slate-50 p-3 transition group relative ${
                    featureToggles.enableMicroWindows ? 'cursor-pointer hover:border-sky-300 hover:bg-sky-50/20 hover:shadow-xs' : ''
                  }`}
                  title="Click to view 24-hour SpO2 trajectory in micro window"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">SpO₂</span>
                    {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-slate-300 group-hover:text-sky-600 transition" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-xl font-black font-mono ${latestVitals.o2sat < 92 ? 'text-rose-700' : 'text-slate-900'}`}>
                      {latestVitals.o2sat}%
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-600">Hypoxemia</span>
                </div>

                {/* Temp */}
                <div
                  onClick={() => openMetricHistory('temp', latestVitals.temp, latestVitals.temp > 38.3)}
                  className={`rounded-xl border border-slate-100 bg-slate-50 p-3 transition group relative ${
                    featureToggles.enableMicroWindows ? 'cursor-pointer hover:border-amber-300 hover:bg-amber-50/20 hover:shadow-xs' : ''
                  }`}
                  title="Click to view 24-hour Core Temperature trajectory in micro window"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Temperature</span>
                    {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-slate-300 group-hover:text-amber-600 transition" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black font-mono text-rose-700">
                      {latestVitals.temp}°C
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-600">High Fever</span>
                </div>

                {/* SBP / DBP */}
                <div
                  onClick={() => openMetricHistory('sbp', latestVitals.sbp, latestVitals.sbp < 90)}
                  className={`rounded-xl border border-slate-100 bg-slate-50 p-3 transition group relative ${
                    featureToggles.enableMicroWindows ? 'cursor-pointer hover:border-rose-300 hover:bg-rose-50/20 hover:shadow-xs' : ''
                  }`}
                  title="Click to view 24-hour Systolic BP trajectory in micro window"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">BP (Systolic/Dia)</span>
                    {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-slate-300 group-hover:text-rose-600 transition" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-black font-mono text-slate-900">
                      {latestVitals.sbp}/{latestVitals.dbp}
                    </span>
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">Shock state</span>
                </div>

                {/* Resp */}
                <div
                  onClick={() => openMetricHistory('resp', latestVitals.resp, latestVitals.resp >= 22)}
                  className={`rounded-xl border border-slate-100 bg-slate-50 p-3 transition group relative ${
                    featureToggles.enableMicroWindows ? 'cursor-pointer hover:border-rose-300 hover:bg-rose-50/20 hover:shadow-xs' : ''
                  }`}
                  title="Click to view 24-hour Respiratory Rate trajectory in micro window"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Resp Rate</span>
                    {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-slate-300 group-hover:text-rose-600 transition" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black font-mono text-rose-700">
                      {latestVitals.resp}
                    </span>
                    <span className="text-[10px] text-slate-400">bpm</span>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-600">Tachypneic</span>
                </div>

                {/* EtCO2 */}
                {featureToggles.showEtCO2 && (
                  <div
                    onClick={() => openMetricHistory('etco2', latestVitals.etco2 || 24, (latestVitals.etco2 || 24) < 25)}
                    className={`rounded-xl border border-slate-100 bg-slate-50 p-3 transition group relative ${
                      featureToggles.enableMicroWindows ? 'cursor-pointer hover:border-sky-300 hover:bg-sky-50/20 hover:shadow-xs' : ''
                    }`}
                    title="Click to view 24-hour EtCO2 capnography in micro window"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">EtCO₂</span>
                      {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-slate-300 group-hover:text-sky-600 transition" />}
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-black font-mono text-slate-900">
                        {latestVitals.etco2 || 24}
                      </span>
                      <span className="text-[10px] text-slate-400">mmHg</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">Hypocapnia</span>
                  </div>
                )}

                {/* Shock Index */}
                {featureToggles.showShockIndex && (
                  <div
                    onClick={() => openMetricHistory('shock_index', Number((latestVitals.hr / latestVitals.sbp).toFixed(2)), (latestVitals.hr / latestVitals.sbp) >= 0.9)}
                    className={`rounded-xl border border-slate-100 bg-slate-50 p-3 transition group relative ${
                      featureToggles.enableMicroWindows ? 'cursor-pointer hover:border-rose-300 hover:bg-rose-50/20 hover:shadow-xs' : ''
                    }`}
                    title="Click to view 24-hour Shock Index in micro window"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Shock Index</span>
                      {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-slate-300 group-hover:text-rose-600 transition" />}
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-black font-mono text-rose-700">
                        {(latestVitals.hr / latestVitals.sbp).toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600">Normal &lt; 0.70</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Laboratory Sepsis Biomarkers Card */}
          {featureToggles.showLabBiomarkers && (
            <div
              id="section-lab-biomarkers"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs scroll-mt-24 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Droplet size={16} className="text-sky-600" />
                  <h2 className="text-sm font-bold text-slate-900">ICU Laboratory Biomarkers</h2>
                </div>
                <div className="flex items-center gap-2">
                  {featureToggles.enableMicroWindows && (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60 flex items-center gap-1">
                      <Maximize2 size={10} />
                      Click card for 24h history
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-400">
                    Drawn 45m ago
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Lactate - Highlighted */}
                <div
                  onClick={() => openMetricHistory('lactate', latestLabs.lactate, latestLabs.lactate >= 2.0)}
                  className={`rounded-xl border border-rose-200 bg-rose-50/50 p-3 ring-1 ring-rose-300 sm:col-span-1 transition group relative ${
                    featureToggles.enableMicroWindows ? 'cursor-pointer hover:ring-rose-500 hover:shadow-xs' : ''
                  }`}
                  title="Click to view 24-hour Serum Lactate clearance in micro window"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-800">Serum Lactate</span>
                    {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-rose-400 group-hover:text-rose-700 transition" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black font-mono text-rose-700">
                      {latestLabs.lactate.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-rose-600">mmol/L</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700">Critical (Ref &lt; 2.0)</span>
                </div>

                {/* WBC */}
                <div
                  onClick={() => openMetricHistory('wbc', latestLabs.wbc, latestLabs.wbc > 12.0 || latestLabs.wbc < 4.0)}
                  className={`rounded-xl border border-rose-100 bg-rose-50/30 p-3 transition group relative ${
                    featureToggles.enableMicroWindows ? 'cursor-pointer hover:border-rose-300 hover:bg-rose-50/20 hover:shadow-xs' : ''
                  }`}
                  title="Click to view 24-hour White Blood Cell count in micro window"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-rose-800">WBC Count</span>
                    {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-slate-300 group-hover:text-rose-600 transition" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black font-mono text-rose-700">
                      {latestLabs.wbc.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-400">k/µL</span>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-600">Leukocytosis</span>
                </div>

                {/* Creatinine */}
                <div
                  onClick={() => openMetricHistory('creatinine', latestLabs.creatinine, latestLabs.creatinine >= 2.0)}
                  className={`rounded-xl border border-slate-100 bg-slate-50 p-3 transition group relative ${
                    featureToggles.enableMicroWindows ? 'cursor-pointer hover:border-amber-300 hover:bg-amber-50/20 hover:shadow-xs' : ''
                  }`}
                  title="Click to view 24-hour Creatinine trajectory in micro window"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Creatinine</span>
                    {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-slate-300 group-hover:text-amber-600 transition" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black font-mono text-slate-900">
                      {latestLabs.creatinine.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-400">mg/dL</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-600">AKI Stage 2</span>
                </div>

                {/* Platelets */}
                <div
                  onClick={() => openMetricHistory('platelets', latestLabs.platelets, latestLabs.platelets < 100)}
                  className={`rounded-xl border border-slate-100 bg-slate-50 p-3 transition group relative ${
                    featureToggles.enableMicroWindows ? 'cursor-pointer hover:border-amber-300 hover:bg-amber-50/20 hover:shadow-xs' : ''
                  }`}
                  title="Click to view 24-hour Platelet count in micro window"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Platelets</span>
                    {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-slate-300 group-hover:text-amber-600 transition" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black font-mono text-slate-900">
                      {latestLabs.platelets}
                    </span>
                    <span className="text-[10px] text-slate-400">k/µL</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">Consuming</span>
                </div>

                {/* Glucose */}
                <div
                  onClick={() => openMetricHistory('glucose', latestLabs.glucose, latestLabs.glucose > 180)}
                  className={`rounded-xl border border-slate-100 bg-slate-50 p-3 transition group relative ${
                    featureToggles.enableMicroWindows ? 'cursor-pointer hover:border-sky-300 hover:bg-sky-50/20 hover:shadow-xs' : ''
                  }`}
                  title="Click to view 24-hour Blood Glucose in micro window"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Serum Glucose</span>
                    {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-slate-300 group-hover:text-sky-600 transition" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black font-mono text-slate-900">
                      {latestLabs.glucose}
                    </span>
                    <span className="text-[10px] text-slate-400">mg/dL</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">Stress elevated</span>
                </div>

                {/* Base Excess */}
                {featureToggles.showBaseExcess && (
                  <div
                    onClick={() => openMetricHistory('base_excess', latestLabs.base_excess || -6.4, (latestLabs.base_excess || -6.4) < -4.0)}
                    className={`rounded-xl border border-slate-100 bg-slate-50 p-3 transition group relative ${
                      featureToggles.enableMicroWindows ? 'cursor-pointer hover:border-rose-300 hover:bg-rose-50/20 hover:shadow-xs' : ''
                    }`}
                    title="Click to view 24-hour Arterial Base Excess in micro window"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Base Excess</span>
                      {featureToggles.enableMicroWindows && <Maximize2 size={11} className="text-slate-300 group-hover:text-rose-600 transition" />}
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-black font-mono text-rose-700">
                        {latestLabs.base_excess || -6.4}
                      </span>
                      <span className="text-[10px] text-slate-400">mEq/L</span>
                    </div>
                    <span className="text-[10px] font-semibold text-rose-600">Metabolic acidemia</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row: Sepsis-3 Clinical Decision Support Action Bundle & Timeline (Section 21) */}
      {(featureToggles.showSepsisBundle || featureToggles.showEventTimeline) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Surviving Sepsis Campaign (SSC) 1-Hour Bundle Checklist */}
          {featureToggles.showSepsisBundle && (
            <div
              id="section-sepsis-bundle"
              className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs scroll-mt-24 transition-all duration-300 ${!featureToggles.showEventTimeline ? 'lg:col-span-2' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileCheck2 size={16} className="text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Sepsis-3 1-Hour Resuscitation Bundle
                  </h2>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Protocol S-01
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'cultures',
                    label: 'Blood cultures drawn prior to antimicrobial initiation',
                    desc: 'Two sets of peripheral & line cultures collected.',
                  },
                  {
                    id: 'antibiotics',
                    label: 'Administer broad-spectrum empiric IV antimicrobials',
                    desc: 'Piperacillin-tazobactam 4.5g IV piggyback commenced.',
                  },
                  {
                    id: 'crystalloids',
                    label: 'Rapid administration of 30 mL/kg crystalloid for MAP < 65',
                    desc: 'Targeting resuscitation endpoint MAP ≥ 65 mmHg.',
                  },
                  {
                    id: 'vasopressors',
                    label: 'Apply vasopressors (Norepinephrine first-line) if refractory',
                    desc: 'Central venous line infusion if fluid bolus fails.',
                  },
                  {
                    id: 'lactateRepeat',
                    label: 'Remeasure serum lactate within 2 to 4 hours',
                    desc: 'Assess lactate clearance as resuscitation surrogate.',
                  },
                ].map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(item.id, item.label)}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                      activeChecklist[item.id]
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        activeChecklist[item.id]
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {activeChecklist[item.id] && <CheckCircle2 size={14} />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${activeChecklist[item.id] ? 'text-emerald-950 line-through' : 'text-slate-900'}`}>
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Timeline & Attending Reviews */}
          {featureToggles.showEventTimeline && (
            <div
              id="section-clinical-timeline"
              className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs scroll-mt-24 transition-all duration-300 ${!featureToggles.showSepsisBundle ? 'lg:col-span-2' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-sky-600" />
                  <h2 className="text-sm font-bold text-slate-900">Chronological Event Timeline</h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Shift Log
                </span>
              </div>

              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 pl-2">
                {recentTimeline.map((evt, idx) => (
                  <div key={evt.id} className="relative flex items-start gap-3 text-xs">
                    <div
                      className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        evt.severity === 'CRITICAL'
                          ? 'border-rose-300 bg-rose-100 text-rose-700'
                          : evt.severity === 'ELEVATED'
                          ? 'border-amber-300 bg-amber-100 text-amber-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{evt.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">{evt.timestamp}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
