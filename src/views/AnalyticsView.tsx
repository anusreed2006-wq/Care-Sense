import React from 'react';
import { MetricCard } from '../components/common/MetricCard';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShieldCheck,
  AlertOctagon,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  // Model performance metrics
  const rocCurveData = [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.05, tpr: 0.45 },
    { fpr: 0.10, tpr: 0.68 },
    { fpr: 0.15, tpr: 0.81 },
    { fpr: 0.20, tpr: 0.86 },
    { fpr: 0.30, tpr: 0.92 },
    { fpr: 0.50, tpr: 0.97 },
    { fpr: 1.0, tpr: 1.0 },
  ];

  const weeklyIncidenceData = [
    { day: 'Mon', admissions: 14, sepsisScreened: 14, highRisk: 3 },
    { day: 'Tue', admissions: 18, sepsisScreened: 18, highRisk: 4 },
    { day: 'Wed', admissions: 12, sepsisScreened: 12, highRisk: 2 },
    { day: 'Thu', admissions: 15, sepsisScreened: 15, highRisk: 5 },
    { day: 'Fri', admissions: 19, sepsisScreened: 19, highRisk: 4 },
    { day: 'Sat', admissions: 11, sepsisScreened: 11, highRisk: 2 },
    { day: 'Sun', admissions: 16, sepsisScreened: 16, highRisk: 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          ICU Sepsis Surveillance & Clinical Analytics
        </h1>
        <p className="text-xs text-slate-500">
          Cohort outcomes, early-warning lead times, model discrimination, and resuscitation bundle compliance
        </p>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          id="stat-auroc"
          title="Model AUROC"
          value="0.884"
          subtitle="Area Under ROC Curve"
          variant="success"
          icon={Award}
          trend={{ label: 'High discrimination', direction: 'neutral' }}
        />
        <MetricCard
          id="stat-mtta"
          title="Early Warning Lead Time"
          value="4.6 Hours"
          subtitle="Mean lead time prior to shock onset"
          variant="default"
          icon={Clock}
          trend={{ label: '+45 min vs SIRS', direction: 'up', positiveIsGood: true }}
        />
        <MetricCard
          id="stat-bundle-adherence"
          title="1-Hour Bundle Adherence"
          value="91.4%"
          subtitle="Sepsis-3 resuscitation compliance"
          variant="default"
          icon={CheckCircle2}
          trend={{ label: '+3.2% this month', direction: 'up', positiveIsGood: true }}
        />
        <MetricCard
          id="stat-mortality-reduction"
          title="Mortality Impact"
          value="-18.2%"
          subtitle="ICU sepsis cohort mortality delta"
          variant="success"
          icon={ShieldCheck}
          trend={{ label: 'Statistically significant', direction: 'down', positiveIsGood: true }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Sepsis Surveillance Incidence */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Weekly ICU Sepsis Screenings & High-Risk Identifications
              </h2>
              <p className="text-xs text-slate-500">Admissions vs patients flagged ≥0.60 risk</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyIncidenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="admissions" fill="#94a3b8" name="Admissions Screened" radius={[4, 4, 0, 0]} />
                <Bar dataKey="highRisk" fill="#ef4444" name="Flagged High Risk" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AUROC Performance Curve */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                CareSense Model Receiver Operating Characteristic (ROC)
              </h2>
              <p className="text-xs text-slate-500">Sensitivity vs 1 - Specificity (AUROC = 0.884)</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              AUROC 0.884
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocCurveData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="fpr"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                />
                <YAxis
                  dataKey="tpr"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'True Positive Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="tpr"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ fill: '#0284c7', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
