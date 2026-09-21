import React, { useState } from 'react';
import { useCareSense } from '../hooks/useCareSense';
import { RiskBadge } from '../components/common/RiskBadge';
import { AlertSeverity, AlertStatus } from '../types';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  ArrowRight,
  ShieldAlert,
  BellRing,
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const {
    alerts,
    acknowledgeAlert,
    resolveAlert,
    selectPatientAndNavigate,
  } = useCareSense();

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Alert Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BellRing size={20} className="text-rose-600 animate-pulse" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Clinical Alert Management Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active early-warning triggers requiring clinical evaluation and sepsis protocol adherence
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs">
            <span className="font-bold text-rose-900">{criticalCount} Critical</span>
            <span className="text-rose-600"> • {activeCount} Active</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        {/* Severity Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1">Severity:</span>
          {['ALL', 'CRITICAL', 'ELEVATED', 'WATCH'].map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                severityFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
          {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <CheckCircle2 size={40} className="text-emerald-500 mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Alerts Matching Filters</h3>
            <p className="text-xs text-slate-500 mt-1">All sepsis early-warning criteria currently within stable parameters.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isCritical = alert.severity === 'CRITICAL';
            const isActive = alert.status === 'ACTIVE';
            const isAck = alert.status === 'ACKNOWLEDGED';

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`rounded-2xl border bg-white p-5 shadow-xs transition-all ${
                  isCritical && isActive
                    ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                        isCritical
                          ? 'bg-rose-100 text-rose-700'
                          : alert.severity === 'ELEVATED'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isCritical ? <AlertOctagon size={20} /> : <AlertTriangle size={20} />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          Patient {alert.patient_code}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 font-mono">
                          {alert.icu_bed}
                        </span>
                        <RiskBadge tier={alert.severity} size="sm" pulse={isCritical && isActive} />

                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isActive
                              ? 'bg-rose-100 text-rose-800'
                              : isAck
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {alert.status}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs font-semibold text-slate-800">
                        {alert.message}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>Triggered: {new Date(alert.created_at).toLocaleString()}</span>
                        {alert.acknowledged_at && (
                          <span>• Acknowledged: {new Date(alert.acknowledged_at).toLocaleTimeString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {isActive && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                      >
                        Acknowledge
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs flex items-center gap-1"
                      >
                        <Check size={13} />
                        <span>Resolve</span>
                      </button>
                    )}

                    <button
                      onClick={() => selectPatientAndNavigate(alert.patient_id)}
                      className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition shadow-2xs flex items-center gap-1"
                    >
                      <span>Bedside Review</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
