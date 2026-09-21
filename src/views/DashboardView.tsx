import React, { useState } from 'react';
import { useCareSense } from '../hooks/useCareSense';
import { MetricCard } from '../components/common/MetricCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { RiskTier, Patient } from '../types';
import {
  Users,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  TrendingUp,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Activity,
  Heart,
  Droplet,
  Wind,
  Thermometer,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

// Clinical risk calculation helper for patient census table & filtering
const getPatientRiskData = (patient: { patient_code: string }) => {
  const isP1042 = patient.patient_code === 'P-1042';
  const isP1024 = patient.patient_code === 'P-1024';
  const isP1018 = patient.patient_code === 'P-1018';
  const isP1005 = patient.patient_code === 'P-1005';
  const isP1033 = patient.patient_code === 'P-1033';

  if (isP1042) {
    return {
      risk: 0.94,
      tier: 'CRITICAL' as RiskTier,
      change: '+0.12',
      vitalsStr: 'HR 121 • MAP 52 • SpO₂ 89% • 39.0°C',
      labsStr: '4.2 mmol/L • 19.4 k/µL',
    };
  }
  if (isP1024) {
    return {
      risk: 0.74,
      tier: 'ELEVATED' as RiskTier,
      change: '+0.16',
      vitalsStr: 'HR 108 • MAP 63 • SpO₂ 91% • 38.8°C',
      labsStr: '2.8 mmol/L • 16.2 k/µL',
    };
  }
  if (isP1018) {
    return {
      risk: 0.46,
      tier: 'WATCH' as RiskTier,
      change: '+0.04',
      vitalsStr: 'HR 98 • MAP 68 • SpO₂ 96% • 38.1°C',
      labsStr: '1.8 mmol/L • 13.5 k/µL',
    };
  }
  if (isP1033) {
    return {
      risk: 0.52,
      tier: 'WATCH' as RiskTier,
      change: '+0.03',
      vitalsStr: 'HR 92 • MAP 64 • SpO₂ 95% • 37.8°C',
      labsStr: '2.1 mmol/L • 14.8 k/µL',
    };
  }
  if (isP1005) {
    return {
      risk: 0.12,
      tier: 'LOW' as RiskTier,
      change: '-0.06',
      vitalsStr: 'HR 74 • MAP 82 • SpO₂ 98% • 36.8°C',
      labsStr: '1.1 mmol/L • 7.2 k/µL',
    };
  }

  const num = parseInt(patient.patient_code.replace(/\D/g, '') || '0', 10);
  if (num % 5 === 0) {
    return {
      risk: 0.88,
      tier: 'CRITICAL' as RiskTier,
      change: '+0.10',
      vitalsStr: 'HR 118 • MAP 55 • SpO₂ 90% • 38.9°C',
      labsStr: '3.8 mmol/L • 18.2 k/µL',
    };
  }
  if (num % 3 === 0) {
    return {
      risk: 0.68,
      tier: 'ELEVATED' as RiskTier,
      change: '+0.08',
      vitalsStr: 'HR 104 • MAP 62 • SpO₂ 92% • 38.4°C',
      labsStr: '2.4 mmol/L • 15.0 k/µL',
    };
  }
  if (num % 2 === 0) {
    return {
      risk: 0.42,
      tier: 'WATCH' as RiskTier,
      change: '+0.02',
      vitalsStr: 'HR 90 • MAP 70 • SpO₂ 96% • 37.6°C',
      labsStr: '1.6 mmol/L • 11.8 k/µL',
    };
  }
  return {
    risk: 0.18,
    tier: 'LOW' as RiskTier,
    change: '-0.02',
    vitalsStr: 'HR 76 • MAP 80 • SpO₂ 98% • 36.9°C',
    labsStr: '1.2 mmol/L • 7.8 k/µL',
  };
};

export const DashboardView: React.FC = () => {
  const {
    visiblePatients,
    alerts,
    stats,
    searchQuery,
    setSearchQuery,
    selectPatientAndNavigate,
    setActiveTab,
    featureToggles,
  } = useCareSense();

  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Smooth scroll helper to redirect the user to a specific section on the page
  const scrollToSection = (elementId: string, ringColorClass = 'ring-amber-500') => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Temporary highlight pulse ring
      el.classList.add('ring-4', ringColorClass, 'ring-offset-4', 'transition-all', 'duration-300');
      setTimeout(() => {
        el.classList.remove('ring-4', ringColorClass, 'ring-offset-4');
      }, 2000);
    }
  };

  // Filter patients based on search and risk tier filter
  const filteredPatients = visiblePatients.filter(patient => {
    // Search match
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      patient.patient_code.toLowerCase().includes(q) ||
      patient.icu_bed.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (tierFilter === 'ALL') return true;

    const data = getPatientRiskData(patient);
    return data.tier === tierFilter;
  });

  // Aggregate ward risk distribution data for visual chart
  const wardRiskDistribution = [
    { tier: 'Low (<0.30)', count: 15, fill: '#10b981' },
    { tier: 'Watch (0.30-0.59)', count: 4, fill: '#f59e0b' },
    { tier: 'Elevated (0.60-0.79)', count: 3, fill: '#f97316' },
    { tier: 'Critical (≥0.80)', count: 2, fill: '#ef4444' },
  ];

  // 12-hour ward overall average risk trajectory
  const wardTrajectoryData = [
    { time: '00:00', avgRisk: 0.22, criticals: 1 },
    { time: '02:00', avgRisk: 0.24, criticals: 1 },
    { time: '04:00', avgRisk: 0.23, criticals: 1 },
    { time: '06:00', avgRisk: 0.27, criticals: 2 },
    { time: '08:00', avgRisk: 0.31, criticals: 2 },
    { time: '10:00', avgRisk: 0.34, criticals: 2 },
    { time: '12:00', avgRisk: 0.32, criticals: 2 },
  ];

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Banner: Clinical ICU Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Metro Central ICU • Ward Telemetry Live
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            ICU Sepsis Early-Warning Command Dashboard
          </h1>
          <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
            Realtime multi-patient AI surveillance tracking hemodynamic decompensation, lactate acceleration, and Sepsis-3 risk trajectories.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="btn-quick-simulation"
            onClick={() => setActiveTab('simulation')}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
          >
            <SlidersHorizontal size={14} />
            <span>Open Simulation Lab</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards (Prompt Section 15) - With Direct Section Redirection */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          id="kpi-monitored"
          title="Patients Monitored"
          value={stats.totalMonitored}
          subtitle="All active ICU beds covered"
          icon={Users}
          trend={{ label: '100% coverage', direction: 'neutral' }}
          onClick={() => {
            setTierFilter('ALL');
            scrollToSection('patient-census-table', 'ring-sky-500');
          }}
          isActive={tierFilter === 'ALL'}
          actionLabel="Redirect to All Patients ↓"
          actionIcon="down"
        />
        <MetricCard
          id="kpi-high-risk"
          title="High Sepsis Risk"
          value={stats.highRiskCount}
          subtitle="Risk probability ≥ 0.60"
          variant="elevated"
          icon={AlertTriangle}
          badgeText="High Risk"
          trend={{ label: '+1 last 4h', direction: 'up', positiveIsGood: false }}
          onClick={() => {
            setTierFilter('ELEVATED');
            scrollToSection('patient-census-table', 'ring-amber-500');
          }}
          isActive={tierFilter === 'ELEVATED'}
          actionLabel="Redirect to High Risk Cohort ↓"
          actionIcon="down"
          className="border-amber-300 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/15"
        />
        <MetricCard
          id="kpi-critical"
          title="Critical Patients"
          value={stats.criticalCount}
          subtitle="Imminent septic shock"
          variant="critical"
          icon={AlertOctagon}
          badgeText="Critical"
          trend={{ label: 'ICU-02, ICU-05', direction: 'up', positiveIsGood: false }}
          onClick={() => {
            setTierFilter('CRITICAL');
            scrollToSection('patient-census-table', 'ring-rose-500');
          }}
          isActive={tierFilter === 'CRITICAL'}
          actionLabel="Redirect to Critical Patients ↓"
          actionIcon="down"
          className="hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/15"
        />
        <MetricCard
          id="kpi-active-alerts"
          title="Active Alerts"
          value={stats.activeAlertsCount}
          subtitle="Requiring clinical bundle action"
          variant="critical"
          icon={Activity}
          badgeText="Immediate"
          trend={{ label: '2 unacknowledged', direction: 'up', positiveIsGood: false }}
          onClick={() => {
            const urgentTicker = document.getElementById('urgent-alert-ticker');
            if (urgentTicker && featureToggles.showCriticalAlertBanner && activeAlerts.length > 0) {
              scrollToSection('urgent-alert-ticker', 'ring-rose-500');
            } else {
              setActiveTab('alerts');
            }
          }}
          actionLabel={
            featureToggles.showCriticalAlertBanner && activeAlerts.length > 0
              ? 'Redirect to Alert Ticker ↓'
              : 'Redirect to Alerts View →'
          }
          actionIcon={
            featureToggles.showCriticalAlertBanner && activeAlerts.length > 0
              ? 'down'
              : 'right'
          }
        />
        <MetricCard
          id="kpi-coverage"
          title="Model Coverage"
          value={stats.monitoringCoverage}
          subtitle="Telemetry & ML active"
          variant="success"
          icon={ShieldCheck}
          badgeText="ML Online"
          trend={{ label: '42ms inference latency', direction: 'neutral' }}
          onClick={() => {
            setActiveTab('model-insights');
          }}
          actionLabel="Redirect to Model Architecture →"
          actionIcon="right"
        />
      </div>

      {/* Urgent Alert Banner Ticker (if any active alerts) */}
      {featureToggles.showCriticalAlertBanner && activeAlerts.length > 0 && (
        <div
          id="urgent-alert-ticker"
          className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-xs scroll-mt-24 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-rose-900">
                Immediate Clinical Attention Required ({activeAlerts.length} Active Alerts)
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('alerts')}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
            >
              <span>View All Alerts</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeAlerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => selectPatientAndNavigate(alert.patient_id)}
                className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-white p-3 cursor-pointer hover:border-rose-300 hover:shadow-xs transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{alert.patient_code}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{alert.icu_bed}</span>
                    <RiskBadge tier={alert.severity} size="sm" showIcon={false} />
                  </div>
                  <p className="mt-1 text-xs text-slate-700 leading-snug line-clamp-2">
                    {alert.message}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secondary Dashboard Row: Ward Trends & Risk Distribution */}
      {featureToggles.showWardOverviewCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward Average Trajectory Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                ICU Ward Aggregate Risk Trajectory (12-Hour)
              </h2>
              <p className="text-xs text-slate-500">
                Mean predicted sepsis probability across all 24 monitored beds
              </p>
            </div>
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
              Model Horizon: 6 Hours
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wardTrajectoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wardRiskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[0, 0.6]}
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
                  formatter={(value: any) => [`${(Number(value) * 100).toFixed(1)}%`, 'Ward Avg Risk']}
                />
                <Area
                  type="monotone"
                  dataKey="avgRisk"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#wardRiskGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ward Distribution Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Risk Tier Stratification</h2>
            <p className="text-xs text-slate-500 mb-4">Current distribution of 24 ICU patients</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wardRiskDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="tier" type="category" tick={{ fontSize: 11, fill: '#475569' }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [`${val} patients`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500">Quick Filter & Redirect:</span>
              <button
                onClick={() => {
                  setTierFilter('CRITICAL');
                  scrollToSection('patient-census-table', 'ring-rose-500');
                }}
                className="rounded-md bg-rose-50 hover:bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 transition"
              >
                Critical (2) ↓
              </button>
              <button
                onClick={() => {
                  setTierFilter('ELEVATED');
                  scrollToSection('patient-census-table', 'ring-amber-500');
                }}
                className="rounded-md bg-amber-50 hover:bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200 transition"
              >
                Elevated (4) ↓
              </button>
              <button
                onClick={() => {
                  setTierFilter('WATCH');
                  scrollToSection('patient-census-table', 'ring-amber-500');
                }}
                className="rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 transition"
              >
                Watch (6) ↓
              </button>
            </div>
            <button
              onClick={() => setActiveTab('analytics')}
              className="font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 text-xs"
            >
              <span>Full Analytics</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Main Patient Census Table (Priority ICU View) - Section Anchor */}
      <div
        id="patient-census-table"
        className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden scroll-mt-24 transition-all duration-300"
      >
        {/* Table Header & Quick Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 p-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">
                ICU Ward Patient Risk Monitoring Table
              </h2>
              {tierFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
                  <span>Filtered: <strong>{tierFilter}</strong> ({filteredPatients.length} beds)</span>
                  <button
                    onClick={() => setTierFilter('ALL')}
                    title="Clear filter and show all"
                    className="ml-0.5 rounded-full hover:bg-amber-200 text-amber-900 px-1 text-[11px] font-black"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Realtime telemetry vitals, Sepsis-3 biomarker scores, and predicted probability
            </p>
          </div>

          {/* Risk Tier Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
            {['ALL', 'CRITICAL', 'ELEVATED', 'WATCH', 'LOW'].map(tier => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  tierFilter === tier
                    ? 'bg-white text-slate-900 shadow-2xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 pl-5 pr-3">Patient / Bed</th>
                <th className="px-3 py-3.5">Age / Sex</th>
                <th className="px-3 py-3.5">Risk Probability</th>
                <th className="px-3 py-3.5">Sepsis Tier</th>
                <th className="px-3 py-3.5">Key Vitals (HR / MAP / SpO₂ / Temp)</th>
                <th className="px-3 py-3.5">Lactate / WBC</th>
                <th className="px-3 py-3.5">Trajectory</th>
                <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      No ICU patients match filter &ldquo;{tierFilter}&rdquo;
                    </p>
                    <button
                      onClick={() => setTierFilter('ALL')}
                      className="mt-3 rounded-xl bg-sky-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-600 transition"
                    >
                      Show All Monitored Patients
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPatients.map(patient => {
                  const { risk, tier, change, vitalsStr, labsStr } = getPatientRiskData(patient);

                return (
                  <tr
                    key={patient.id}
                    id={`patient-row-${patient.patient_code.toLowerCase()}`}
                    onClick={() => selectPatientAndNavigate(patient.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Patient Code & Bed */}
                    <td className="py-3.5 pl-5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ${
                            tier === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
                              : tier === 'ELEVATED'
                              ? 'bg-amber-100 text-amber-800'
                              : tier === 'WATCH'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {patient.icu_bed.replace('ICU-', '')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-sky-600 transition">
                            {patient.patient_code}
                          </p>
                          <p className="text-[11px] font-medium text-slate-500">{patient.icu_bed}</p>
                        </div>
                      </div>
                    </td>

                    {/* Age / Sex */}
                    <td className="px-3 py-3.5 font-medium text-slate-600">
                      {patient.age}y • {patient.gender}
                    </td>

                    {/* Risk Probability Number & Bar */}
                    <td className="px-3 py-3.5">
                      <div className="w-28">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-mono font-extrabold text-sm text-slate-900">
                            {(risk * 100).toFixed(0)}%
                          </span>
                          <span className="text-[10px] text-slate-400">p={risk.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              tier === 'CRITICAL'
                                ? 'bg-rose-600'
                                : tier === 'ELEVATED'
                                ? 'bg-orange-500'
                                : tier === 'WATCH'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, risk * 100))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Sepsis Tier Badge */}
                    <td className="px-3 py-3.5">
                      <RiskBadge tier={tier} size="sm" pulse={tier === 'CRITICAL'} />
                    </td>

                    {/* Key Vitals */}
                    <td className="px-3 py-3.5 font-mono text-[11px] text-slate-600">
                      {vitalsStr}
                    </td>

                    {/* Labs (Lactate / WBC) */}
                    <td className="px-3 py-3.5 font-mono text-[11px] text-slate-600">
                      <span className={Number(labsStr.split(' ')[0]) >= 2.0 ? 'font-bold text-rose-700' : ''}>
                        {labsStr}
                      </span>
                    </td>

                    {/* Trajectory */}
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center text-xs font-semibold ${
                          change.startsWith('+') ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {change.startsWith('+') ? '↑' : '↓'} {change}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 pl-3 pr-5 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          selectPatientAndNavigate(patient.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-sky-600 hover:border-sky-300 transition shadow-2xs"
                      >
                        <span>Clinical Detail</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
