import React from 'react';
import { useCareSense } from '../../hooks/useCareSense';
import { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  Users,
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Sliders,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Radio,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { activeTab, setActiveTab, stats, alerts, featureToggles, isAdminAuthenticated } = useCareSense();

  const activeAlertCount = alerts.filter(a => a.status === 'ACTIVE').length;

  const rawNavigationItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: number | string;
    badgeColor?: string;
    enabled?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users, badge: stats.totalMonitored },
    { id: 'risk-monitoring', label: 'Risk Monitoring', icon: Activity },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: AlertTriangle,
      badge: activeAlertCount > 0 ? activeAlertCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, enabled: featureToggles.enableAnalyticsTab },
    { id: 'model-insights', label: 'Model Insights', icon: BrainCircuit },
    { id: 'simulation', label: 'Simulation Lab', icon: Sliders, enabled: featureToggles.enableSimulationLab },
    { id: 'reports', label: 'Reports', icon: FileText, enabled: featureToggles.enableReportsTab },
    { id: 'settings', label: 'Settings', icon: Settings },
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: Shield,
      badge: isAdminAuthenticated ? 'Unlocked' : '123456',
      badgeColor: isAdminAuthenticated
        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
  ];

  const navigationItems = rawNavigationItems.filter(item => item.enabled !== false);

  const handleSelect = (tab: NavigationTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-[#0b1329] text-slate-300 transition-all duration-300 ease-in-out lg:static ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
          <div
            onClick={() => handleSelect('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            {/* Custom CareSense Brand Logo */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-sky-400 text-white shadow-md shadow-sky-500/20">
              <Activity size={20} className="stroke-[2.5]" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-200" />
              </span>
            </div>

            {!isCollapsed && (
              <div>
                <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1">
                  CARESENSE
                </span>
                <span className="text-[10px] font-semibold text-sky-400 block tracking-wider uppercase -mt-0.5">
                  Early Risk Intelligence
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button (Desktop/Laptop) */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-3 pb-2">
            {!isCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                ICU Command Menu
              </span>
            )}
          </div>

          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelect(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`group relative flex w-full items-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 shadow-inner'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && <span className="tracking-wide">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-sky-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Telemetry Stream Status in Sidebar Footer */}
        {!isCollapsed && (
          <div className="p-3.5 m-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
              <Radio size={13} className="text-sky-400 animate-pulse" />
              <span>Telemetry Stream</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-snug">
              Temporal ICU features active (HR, MAP, Lactate, SpO₂).
            </p>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar (Section 11) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md lg:hidden shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'dashboard' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'patients' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users size={18} />
          <span>Patients</span>
        </button>

        <button
          onClick={() => setActiveTab('risk-monitoring')}
          className={`relative flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'risk-monitoring' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Activity size={18} />
          <span>Risk Detail</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`relative flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'alerts' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <AlertTriangle size={18} />
          <span>Alerts</span>
          {activeAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
              {activeAlertCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'simulation' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sliders size={18} />
          <span>Sim Lab</span>
        </button>
      </nav>
    </>
  );
};
