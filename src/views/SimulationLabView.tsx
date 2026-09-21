import React, { useState, useMemo } from 'react';
import { useCareSense } from '../hooks/useCareSense';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  runCareSenseInference,
  SimulationVitalsInput,
  SimulationLabsInput,
} from '../services/simulationService';
import { patientService } from '../services/patientService';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Heart,
  Droplet,
  Wind,
  Thermometer,
  BrainCircuit,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export const SimulationLabView: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    refreshPatients,
    addToast,
    selectPatientAndNavigate,
  } = useCareSense();

  // Find currently selected simulation patient
  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Simulation Vitals State
  const [vitals, setVitals] = useState<SimulationVitalsInput>({
    hr: currentPatient.patient_code === 'P-1042' ? 121 : 88,
    sbp: currentPatient.patient_code === 'P-1042' ? 82 : 118,
    dbp: currentPatient.patient_code === 'P-1042' ? 37 : 65,
    resp: currentPatient.patient_code === 'P-1042' ? 29 : 18,
    o2sat: currentPatient.patient_code === 'P-1042' ? 89 : 96,
    temp: currentPatient.patient_code === 'P-1042' ? 39.0 : 37.2,
  });

  // Simulation Labs State
  const [labs, setLabs] = useState<SimulationLabsInput>({
    lactate: currentPatient.patient_code === 'P-1042' ? 4.2 : 1.4,
    wbc: currentPatient.patient_code === 'P-1042' ? 19.4 : 8.5,
    creatinine: currentPatient.patient_code === 'P-1042' ? 2.3 : 1.0,
    platelets: currentPatient.patient_code === 'P-1042' ? 98 : 220,
    glucose: currentPatient.patient_code === 'P-1042' ? 184 : 120,
    bun: currentPatient.patient_code === 'P-1042' ? 42 : 16,
  });

  // Real ML Inference Execution
  const inference = useMemo(() => {
    return runCareSenseInference(vitals, labs, currentPatient.age, `sim-${currentPatient.id}`);
  }, [vitals, labs, currentPatient.age, currentPatient.id]);

  // Handle patient selection change
  const handleSelectPreset = (pId: string) => {
    setSelectedPatientId(pId);
    const p = patients.find(pt => pt.id === pId);
    if (!p) return;

    if (p.patient_code === 'P-1042') {
      setVitals({ hr: 121, sbp: 82, dbp: 37, resp: 29, o2sat: 89, temp: 39.0 });
      setLabs({ lactate: 4.2, wbc: 19.4, creatinine: 2.3, platelets: 98, glucose: 184, bun: 42 });
    } else if (p.patient_code === 'P-1024') {
      setVitals({ hr: 108, sbp: 96, dbp: 46, resp: 27, o2sat: 91, temp: 38.8 });
      setLabs({ lactate: 2.8, wbc: 16.2, creatinine: 1.6, platelets: 175, glucose: 156, bun: 26 });
    } else if (p.patient_code === 'P-1018') {
      setVitals({ hr: 98, sbp: 110, dbp: 47, resp: 21, o2sat: 96, temp: 38.1 });
      setLabs({ lactate: 1.8, wbc: 13.5, creatinine: 1.2, platelets: 210, glucose: 134, bun: 19 });
    } else if (p.patient_code === 'P-1005') {
      setVitals({ hr: 74, sbp: 122, dbp: 62, resp: 16, o2sat: 98, temp: 36.8 });
      setLabs({ lactate: 1.1, wbc: 7.2, creatinine: 0.9, platelets: 245, glucose: 104, bun: 14 });
    } else if (p.patient_code === 'P-1033') {
      setVitals({ hr: 92, sbp: 102, dbp: 45, resp: 22, o2sat: 95, temp: 37.8 });
      setLabs({ lactate: 2.1, wbc: 14.8, creatinine: 1.4, platelets: 190, glucose: 140, bun: 22 });
    }
  };

  // Preset intervention quick actions
  const applyIntervention = (type: 'fluid' | 'antibiotics' | 'decompensate') => {
    if (type === 'fluid') {
      // Fluid bolus increases SBP by 20, DBP by 10 (MAP rises ~13), HR decreases by 15
      setVitals(prev => ({
        ...prev,
        sbp: Math.min(160, prev.sbp + 20),
        dbp: Math.min(90, prev.dbp + 10),
        hr: Math.max(65, prev.hr - 15),
      }));
      addToast({
        type: 'info',
        title: 'Intervention Simulated',
        description: 'Administered 500 mL IV crystalloid bolus. Arterial pressure improved.',
      });
    } else if (type === 'antibiotics') {
      // Lactate clearance
      setLabs(prev => ({
        ...prev,
        lactate: Number(Math.max(1.0, prev.lactate - 1.5).toFixed(1)),
        wbc: Number(Math.max(6.0, prev.wbc - 4.0).toFixed(1)),
      }));
      setVitals(prev => ({
        ...prev,
        temp: Number(Math.max(36.8, prev.temp - 0.8).toFixed(1)),
      }));
      addToast({
        type: 'success',
        title: 'Intervention Simulated',
        description: 'Empiric broad-spectrum antibiotic response: serum lactate cleared, fever subsided.',
      });
    } else if (type === 'decompensate') {
      // Rapid septic shock progression
      setVitals(prev => ({
        ...prev,
        hr: Math.min(155, prev.hr + 25),
        sbp: Math.max(65, prev.sbp - 25),
        dbp: Math.max(32, prev.dbp - 15),
        resp: Math.min(38, prev.resp + 8),
        temp: 39.4,
      }));
      setLabs(prev => ({
        ...prev,
        lactate: Number((prev.lactate + 1.8).toFixed(1)),
        wbc: Number((prev.wbc + 5.0).toFixed(1)),
      }));
      addToast({
        type: 'critical',
        title: 'Decompensation Simulated',
        description: 'Acute septic decompensation: MAP collapsed, lactic acidemia exacerbated.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Lab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-sky-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              CareSense Interactive ML Simulation Lab
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Simulate real-time physiological perturbations. The ML inference engine dynamically recalculates temporal features, calibrated risk probabilities, and SHAP attributions without synthetic heuristics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSelectPreset(currentPatient.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            <RotateCcw size={13} />
            <span>Reset Inputs</span>
          </button>
        </div>
      </div>

      {/* Preset Simulation Patient Selector (Section 30: exactly 5 default patients) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Simulation Patient Cohort
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            5 Benchmark Trajectories
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {patients.slice(0, 5).map(p => {
            const isSelected = p.id === currentPatient.id;
            const isP1042 = p.patient_code === 'P-1042';
            const isP1024 = p.patient_code === 'P-1024';

            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/70 shadow-2xs ring-1 ring-sky-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-xs text-slate-900">{p.patient_code}</span>
                  <span className="text-[10px] font-mono text-slate-500">{p.icu_bed}</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  {isP1042 ? 'Septic Shock' : isP1024 ? 'Rapid Decompensation' : 'Monitoring'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Clinical Intervention Presets */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <span className="text-xs font-bold text-slate-600 mr-2">Quick Interventions:</span>
        <button
          onClick={() => applyIntervention('fluid')}
          className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-50 transition shadow-2xs flex items-center gap-1.5"
        >
          <Droplet size={13} className="text-sky-600" />
          <span>Simulate 500mL IV Crystalloids (MAP ↑)</span>
        </button>
        <button
          onClick={() => applyIntervention('antibiotics')}
          className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-2xs flex items-center gap-1.5"
        >
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span>Simulate Antimicrobial Lactate Clearance</span>
        </button>
        <button
          onClick={() => applyIntervention('decompensate')}
          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-50 transition shadow-2xs flex items-center gap-1.5"
        >
          <AlertTriangle size={13} className="text-rose-600" />
          <span>Simulate Acute Septic Shock Decompensation</span>
        </button>
      </div>

      {/* Main Simulation Workspace: Sliders on Left, Live ML Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column: Vitals & Labs Sliders */}
        <div className="lg:col-span-7 space-y-5">
          {/* Vitals Controls Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
              <Heart size={15} className="text-rose-600" />
              <span>Hemodynamic Telemetry Sliders</span>
            </h2>

            <div className="space-y-4">
              {/* Heart Rate */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Heart Rate (HR)</span>
                  <span className="font-mono text-rose-700">{vitals.hr} bpm</span>
                </div>
                <input
                  type="range"
                  min={45}
                  max={170}
                  value={vitals.hr}
                  onChange={e => setVitals({ ...vitals, hr: Number(e.target.value) })}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              {/* Systolic & Diastolic BP -> Computes MAP */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Systolic BP</span>
                    <span className="font-mono text-slate-900">{vitals.sbp} mmHg</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={180}
                    value={vitals.sbp}
                    onChange={e => setVitals({ ...vitals, sbp: Number(e.target.value) })}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Diastolic BP</span>
                    <span className="font-mono text-slate-900">{vitals.dbp} mmHg</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={110}
                    value={vitals.dbp}
                    onChange={e => setVitals({ ...vitals, dbp: Number(e.target.value) })}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Derived Mean Arterial Pressure (MAP):</span>
                <span className={`font-mono font-black text-sm ${inference.temporal_features.map_calculated < 65 ? 'text-rose-700' : 'text-slate-900'}`}>
                  {inference.temporal_features.map_calculated} mmHg {inference.temporal_features.map_calculated < 65 ? '(Hypotension)' : '(Normal)'}
                </span>
              </div>

              {/* Respiratory Rate & SpO2 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Respiratory Rate</span>
                    <span className="font-mono text-slate-900">{vitals.resp} bpm</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={42}
                    value={vitals.resp}
                    onChange={e => setVitals({ ...vitals, resp: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">SpO₂</span>
                    <span className="font-mono text-slate-900">{vitals.o2sat}%</span>
                  </div>
                  <input
                    type="range"
                    min={78}
                    max={100}
                    value={vitals.o2sat}
                    onChange={e => setVitals({ ...vitals, o2sat: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Temperature */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Body Temperature</span>
                  <span className="font-mono text-amber-700">{vitals.temp.toFixed(1)} °C</span>
                </div>
                <input
                  type="range"
                  min={35.0}
                  max={41.0}
                  step={0.1}
                  value={vitals.temp}
                  onChange={e => setVitals({ ...vitals, temp: Number(e.target.value) })}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Laboratory Controls Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
              <Droplet size={15} className="text-sky-600" />
              <span>Sepsis-3 Laboratory Biomarkers</span>
            </h2>

            <div className="space-y-4">
              {/* Lactate */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Serum Lactate (Ref &lt; 2.0)</span>
                  <span className={`font-mono font-bold ${labs.lactate >= 2.0 ? 'text-rose-700' : 'text-slate-900'}`}>
                    {labs.lactate.toFixed(1)} mmol/L
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={9.0}
                  step={0.1}
                  value={labs.lactate}
                  onChange={e => setLabs({ ...labs, lactate: Number(e.target.value) })}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              {/* WBC */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">White Blood Cell Count (WBC)</span>
                  <span className="font-mono text-slate-900">{labs.wbc.toFixed(1)} k/µL</span>
                </div>
                <input
                  type="range"
                  min={2.0}
                  max={32.0}
                  step={0.5}
                  value={labs.wbc}
                  onChange={e => setLabs({ ...labs, wbc: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Creatinine */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Serum Creatinine</span>
                  <span className="font-mono text-slate-900">{labs.creatinine.toFixed(1)} mg/dL</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={5.5}
                  step={0.1}
                  value={labs.creatinine}
                  onChange={e => setLabs({ ...labs, creatinine: Number(e.target.value) })}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inference Results Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Calibrated Risk Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                CareSense ML Realtime Prediction
              </span>
              <RiskBadge tier={inference.risk_tier} size="md" pulse={inference.risk_tier === 'CRITICAL'} />
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black font-mono tracking-tight text-slate-900">
                {inference.risk_probability.toFixed(3)}
              </span>
              <span className="text-base font-bold text-slate-500">
                ({(inference.risk_probability * 100).toFixed(1)}%)
              </span>
            </div>

            <p className="text-xs font-bold text-slate-700 mt-2">
              Subtype: <span className="font-mono text-sky-800">{inference.risk_status}</span>
            </p>

            {/* Feature Extraction Pipeline Breakdown */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
              <h3 className="font-bold text-slate-600">Extracted Temporal Features:</h3>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Shock Index</span>
                  <strong className={inference.temporal_features.shock_index > 0.9 ? 'text-rose-700' : 'text-slate-800'}>
                    {inference.temporal_features.shock_index}
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">SIRS Criteria</span>
                  <strong className="text-slate-800">
                    {inference.temporal_features.sirs_criteria_count} / 4
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">SOFA CV Score</span>
                  <strong className="text-slate-800">
                    {inference.temporal_features.sofa_cv_score}
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">MAP</span>
                  <strong className={inference.temporal_features.map_calculated < 65 ? 'text-rose-700' : 'text-slate-800'}>
                    {inference.temporal_features.map_calculated} mmHg
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic SHAP Explanations Bar Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
              Live SHAP Attribution Waterfall
            </h2>
            <p className="text-[11px] text-slate-500 mb-3">
              Recalculated dynamically from input gradients
            </p>

            <div className="space-y-2">
              {inference.shap_explanations.slice(0, 5).map(exp => (
                <div
                  key={exp.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="truncate">
                    <span className="font-bold text-slate-900 block truncate">{exp.feature_name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{exp.feature_value}</span>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs shrink-0 ${
                      exp.direction === 'INCREASES_RISK' ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {exp.shap_value > 0 ? `+${exp.shap_value.toFixed(3)}` : exp.shap_value.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
