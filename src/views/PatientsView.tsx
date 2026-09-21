import React, { useState } from 'react';
import { useCareSense } from '../hooks/useCareSense';
import { RiskBadge } from '../components/common/RiskBadge';
import { patientService } from '../services/patientService';
import { Patient, RiskTier } from '../types';
import {
  Users,
  UserPlus,
  Trash2,
  Lock,
  Search,
  ChevronRight,
  Filter,
  Activity,
  RotateCcw,
  CheckCircle2,
  X,
} from 'lucide-react';

export const PatientsView: React.FC = () => {
  const {
    patients,
    visiblePatients,
    refreshPatients,
    selectPatientAndNavigate,
    addToast,
    searchQuery,
    setSearchQuery,
  } = useCareSense();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPatientCode, setNewPatientCode] = useState('P-1065');
  const [newBed, setNewBed] = useState('ICU-15');
  const [newAge, setNewAge] = useState<number>(68);
  const [newGender, setNewGender] = useState<'M' | 'F' | 'Other'>('M');
  const [newScenario, setNewScenario] = useState('Post-op septic shock evaluation');

  const filtered = visiblePatients.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      p.patient_code.toLowerCase().includes(q) ||
      p.icu_bed.toLowerCase().includes(q)
    );
  });

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await patientService.createPatient({
        patient_code: newPatientCode,
        icu_bed: newBed,
        age: Number(newAge),
        gender: newGender,
        scenario_description: newScenario,
      });

      await refreshPatients();
      setIsAddModalOpen(false);
      addToast({
        type: 'success',
        title: 'Simulation Patient Added',
        description: `Patient ${created.patient_code} registered in ${created.icu_bed}.`,
      });
      selectPatientAndNavigate(created.id);
    } catch (err: any) {
      addToast({
        type: 'critical',
        title: 'Registration Error',
        description: err.message,
      });
    }
  };

  const handleDeletePatient = async (patient: Patient) => {
    const res = await patientService.deletePatient(patient.id);
    if (!res.success) {
      addToast({
        type: 'warning',
        title: 'Protected Benchmark Patient',
        description: res.error || 'Default simulation patients cannot be deleted.',
      });
      return;
    }

    await refreshPatients();
    addToast({
      type: 'info',
      title: 'Patient Record Removed',
      description: `Patient ${patient.patient_code} removed from census.`,
    });
  };

  const handleResetToDefaults = async () => {
    await patientService.resetToDefaultSimulation();
    await refreshPatients();
    addToast({
      type: 'info',
      title: 'Simulation Cohort Reset',
      description: 'Default 5 CareSense simulation benchmark patients restored.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Census Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            ICU Patient Cohort Census
          </h1>
          <p className="text-xs text-slate-500">
            Active monitored beds ({patients.length} total) • Clinical simulation registry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            title="Reset to default benchmark simulation patients"
          >
            <RotateCcw size={13} />
            <span>Reset Cohort</span>
          </button>

          <button
            id="btn-add-patient"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-700 transition shadow-xs"
          >
            <UserPlus size={14} />
            <span>Add Simulation Patient</span>
          </button>
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => {
          const isDefault = patientService.isDefaultSimulationPatient(p.id);
          const isP1042 = p.patient_code === 'P-1042';
          const isP1024 = p.patient_code === 'P-1024';
          const isP1018 = p.patient_code === 'P-1018';
          const isP1033 = p.patient_code === 'P-1033';

          let tier: RiskTier = 'LOW';
          let risk = 0.22;
          if (isP1042) {
            tier = 'CRITICAL';
            risk = 0.94;
          } else if (isP1024) {
            tier = 'ELEVATED';
            risk = 0.74;
          } else if (isP1018 || isP1033) {
            tier = 'WATCH';
            risk = isP1018 ? 0.46 : 0.52;
          }

          return (
            <div
              key={p.id}
              onClick={() => selectPatientAndNavigate(p.id)}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-sky-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-xs text-slate-800 group-hover:bg-sky-100 group-hover:text-sky-800 transition">
                      {p.icu_bed.replace('ICU-', '')}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-sky-600 transition">
                        {p.patient_code}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-500">
                        {p.icu_bed} • {p.age}y {p.gender}
                      </p>
                    </div>
                  </div>

                  <RiskBadge tier={tier} size="sm" pulse={tier === 'CRITICAL'} />
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Sepsis Probability:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {(risk * 100).toFixed(0)}% (p={risk.toFixed(2)})
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  {isDefault ? (
                    <>
                      <Lock size={11} className="text-slate-400" />
                      <span>Benchmark Locked</span>
                    </>
                  ) : (
                    <span>Custom Simulation</span>
                  )}
                </span>

                <div className="flex items-center gap-1">
                  {!isDefault && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeletePatient(p);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete User-created Simulation Patient"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <span className="text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                    View
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Simulation Patient Modal (Section 30) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Simulation Patient</h3>
                <p className="text-xs text-slate-500">Register new patient for sepsis model testing</p>
              </div>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Identifier Code</label>
                <input
                  type="text"
                  required
                  value={newPatientCode}
                  onChange={e => setNewPatientCode(e.target.value)}
                  placeholder="e.g. P-1065"
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-xs focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ICU Bed</label>
                  <input
                    type="text"
                    required
                    value={newBed}
                    onChange={e => setNewBed(e.target.value)}
                    placeholder="e.g. ICU-15"
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-xs focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    required
                    min={18}
                    max={105}
                    value={newAge}
                    onChange={e => setNewAge(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={newGender}
                  onChange={e => setNewGender(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-sky-500 focus:outline-hidden"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Scenario Description</label>
                <input
                  type="text"
                  value={newScenario}
                  onChange={e => setNewScenario(e.target.value)}
                  placeholder="e.g. Rapid bacteremia decompensation"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 shadow-sm"
                >
                  Create & Monitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
