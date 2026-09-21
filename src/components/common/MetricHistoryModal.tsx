import React, { useState, useEffect } from 'react';
import { MetricHistoryModalData } from '../../types';
import {
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  Maximize2,
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

interface MetricHistoryModalProps {
  data: MetricHistoryModalData | null;
  isOpen?: boolean;
  onClose: () => void;
  patientCode?: string;
  icuBed?: string;
}

export const MetricHistoryModal: React.FC<MetricHistoryModalProps> = ({
  data,
  isOpen,
  onClose,
  patientCode,
  icuBed,
}) => {
  const [horizon, setHorizon] = useState<'6H' | '12H' | '24H'>('24H');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!data || isOpen === false) return null;

  // Filter history based on horizon
  const count = horizon === '6H' ? 7 : horizon === '12H' ? 13 : data.history.length;
  const filteredHistory = data.history.slice(-count);

  const values = filteredHistory.map(h => h.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const avgVal = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
  const rawStart = filteredHistory[0]?.value ?? data.currentValue;
  const startVal = typeof rawStart === 'number' ? rawStart : Number(rawStart) || 0;
  const currNum = typeof data.currentValue === 'number' ? data.currentValue : Number(data.currentValue) || 0;
  const delta = Number((currNum - startVal).toFixed(1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="metric-history-micro-window"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Micro Window Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold shadow-xs"
              style={{ backgroundColor: data.color }}
            >
              <Activity size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {data.title}
                </h3>
                {patientCode && (
                  <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700 font-mono">
                    {patientCode} • {icuBed || 'ICU'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Bedside Telemetry Historical Micro Window • Continuous Surveillance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close micro window"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Current Value */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Current Telemetry
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {data.currentValue}
                </span>
                <span className="text-xs font-semibold text-slate-500">{data.unit}</span>
              </div>
            </div>

            {/* Peak (Max) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {horizon} Peak (Max)
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-rose-700">
                  {maxVal}
                </span>
                <span className="text-xs font-semibold text-slate-500">{data.unit}</span>
              </div>
            </div>

            {/* Nadir (Min) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {horizon} Nadir (Min)
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-slate-700">
                  {minVal}
                </span>
                <span className="text-xs font-semibold text-slate-500">{data.unit}</span>
              </div>
            </div>

            {/* Trajectory Delta */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {horizon} Trajectory
              </span>
              <div className="mt-1 flex items-center gap-1">
                {delta > 0 ? (
                  <span className="text-2xl font-black font-mono text-rose-600 flex items-center">
                    <TrendingUp size={18} className="mr-0.5" />+{delta}
                  </span>
                ) : delta < 0 ? (
                  <span className="text-2xl font-black font-mono text-sky-600 flex items-center">
                    <TrendingDown size={18} className="mr-0.5" />{delta}
                  </span>
                ) : (
                  <span className="text-2xl font-black font-mono text-slate-600">0.0</span>
                )}
                <span className="text-xs font-semibold text-slate-500">{data.unit}</span>
              </div>
            </div>
          </div>

          {/* Time Series Recharts Graph */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Temporal Progression
                </span>
                <span className="text-[11px] text-slate-400">
                  Ref Range: <strong>{data.normalRange}</strong>
                </span>
              </div>

              {/* Time Horizon Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg self-start sm:self-center">
                {(['6H', '12H', '24H'] as const).map(h => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`rounded-md px-2 py-0.5 text-xs font-bold transition ${
                      horizon === h
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${data.metricKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={data.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={data.color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`${val} ${data.unit}`, data.title]}
                  />
                  {data.referenceLineHigh !== undefined && (
                    <ReferenceLine
                      y={data.referenceLineHigh}
                      stroke="#f43f5e"
                      strokeDasharray="3 3"
                      label={{ value: `Upper (${data.referenceLineHigh})`, fill: '#f43f5e', fontSize: 9, position: 'insideTopRight' }}
                    />
                  )}
                  {data.referenceLineLow !== undefined && (
                    <ReferenceLine
                      y={data.referenceLineLow}
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      label={{ value: `Lower (${data.referenceLineLow})`, fill: '#f59e0b', fontSize: 9, position: 'insideBottomRight' }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={data.color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#grad-${data.metricKey})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Physiological Interpretation & Clinical Notes */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info size={14} className="text-sky-600 shrink-0" />
              <span>Diagnostic Rationale & Thresholds</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {data.description}
            </p>
            {data.criticalThreshold && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-200 flex items-center gap-2">
                <span className="font-bold text-rose-700">Critical Alarm Threshold:</span>
                <span className="font-mono text-slate-700">{data.criticalThreshold}</span>
              </div>
            )}
          </div>

          {/* Chronological Recent Readings Log */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Recent Logged Measurements ({filteredHistory.length} readings)
            </span>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Value</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {[...filteredHistory].reverse().slice(0, 8).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500">{item.timeLabel}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {item.value} {data.unit}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            item.status === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : item.status === 'WARNING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {item.status || 'NORMAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            CareSense Micro Window • Click outside or Esc to dismiss
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
