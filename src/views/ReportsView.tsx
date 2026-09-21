import React from 'react';
import { useCareSense } from '../hooks/useCareSense';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  User,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { patients, currentUser } = useCareSense();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Clinical Documentation & Shift Sepsis Reports
          </h1>
          <p className="text-xs text-slate-500">
            Surviving Sepsis Campaign (SSC) 1-hour resuscitation compliance audit and handover summaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-slate-900 tracking-tight">CARESENSE</span>
              <span className="text-[11px] font-bold text-sky-700 uppercase bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                Official Clinical Audit
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Metro Central Hospital • Intensive Care Unit (ICU)</p>
          </div>

          <div className="text-right text-xs text-slate-500 space-y-0.5 font-mono">
            <p>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            <p>Attending: {currentUser?.full_name || 'Dr. Sarah Lin, MD'}</p>
            <p>Protocol: Sepsis-3 SSC-2026</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">Shift Sepsis Executive Summary</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            During this 12-hour observation window, <strong>24 ICU beds</strong> were under continuous telemetry model surveillance. Two patients (P-1042 in ICU-02 and P-1024 in ICU-05) exhibited accelerated septic decompensation triggers. Empiric broad-spectrum antibiotic administration bundle compliance achieved <strong>100%</strong> adherence within protocol window.
          </p>
        </div>

        {/* High Risk Cohort Audit Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Critical & Elevated Sepsis Patient Audit
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Bed</th>
                  <th className="p-3">Patient Code</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3">Blood Cultures</th>
                  <th className="p-3">Empiric IV ABX</th>
                  <th className="p-3">Lactate Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3 font-mono font-bold">ICU-02</td>
                  <td className="p-3 font-bold">P-1042</td>
                  <td className="p-3 font-mono font-bold text-rose-700">0.94 (CRITICAL)</td>
                  <td className="p-3 text-emerald-700 font-bold">COMPLETED</td>
                  <td className="p-3 text-emerald-700 font-bold">COMPLETED (Pip-Tazo)</td>
                  <td className="p-3 text-amber-700 font-bold">ORDERED (Q2H)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold">ICU-05</td>
                  <td className="p-3 font-bold">P-1024</td>
                  <td className="p-3 font-mono font-bold text-orange-700">0.74 (ELEVATED)</td>
                  <td className="p-3 text-emerald-700 font-bold">COMPLETED</td>
                  <td className="p-3 text-emerald-700 font-bold">COMPLETED (Cefepime)</td>
                  <td className="p-3 text-emerald-700 font-bold">COMPLETED (2.8 mmol/L)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Attending Sign-off Section */}
        <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">Intensivist / Physician Signature:</p>
            <div className="h-10 border-b border-slate-300 w-64 mt-2" />
            <p className="mt-1 text-[11px]">{currentUser?.full_name || 'Dr. Sarah Lin, MD, FCCM'} • Staff Intensivist</p>
          </div>
          <div className="text-right text-[11px] text-slate-400">
            CareSense Electronic Audit Trail ID: CS-AUDIT-2026-9214
          </div>
        </div>
      </div>
    </div>
  );
};
