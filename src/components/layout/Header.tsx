import React, { useState, useRef } from 'react';
import { useCareSense } from '../../hooks/useCareSense';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { OfflineIndicator } from '../common/OfflineIndicator';
import {
  Search,
  Bell,
  Activity,
  User,
  LogOut,
  ChevronDown,
  Building2,
  Cpu,
  Radio,
  Menu,
  Shield,
  Lock,
} from 'lucide-react';
import { authService } from '../../services/authService';

interface HeaderProps {
  onToggleSidebarMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebarMobile }) => {
  const {
    currentUser,
    setCurrentUser,
    appMode,
    setAppMode,
    searchQuery,
    setSearchQuery,
    alerts,
    stats,
    setActiveTab,
    isAdminUnlocked,
    unlockAdminPanel,
    addToast,
  } = useCareSense();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');

  // Secret 5-click easter egg on the profile dropdown header component
  // "when i click this component 5 times it want to open admin pannel other wise admin pannel want to be hiden and from all shortcuts"
  const [componentClickCount, setComponentClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSecretComponentClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    const next = componentClickCount + 1;

    if (next >= 5) {
      setComponentClickCount(0);
      unlockAdminPanel();
      setActiveTab('admin');
      setShowUserMenu(false);
      addToast({
        type: 'success',
        title: 'Admin Access Authorized',
        description: '5-click security handshake verified. Admin Command Center opened.',
      });
      return;
    }

    setComponentClickCount(next);

    // Give visual hint if getting closer
    if (next >= 2) {
      addToast({
        type: 'info',
        title: 'Admin Authorization Sequence',
        description: `${5 - next} more click${5 - next === 1 ? '' : 's'} to open Admin Panel...`,
      });
    }

    // Reset after 3 seconds of inactivity
    clickTimerRef.current = setTimeout(() => {
      setComponentClickCount(0);
    }, 3000);
  };

  // Also support tapping the profile button 5 times rapidly when menu is closed
  const profileButtonClicksRef = useRef(0);
  const profileButtonTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleProfileButtonClick = () => {
    profileButtonClicksRef.current += 1;
    if (profileButtonTimerRef.current) {
      clearTimeout(profileButtonTimerRef.current);
    }

    if (profileButtonClicksRef.current >= 5) {
      profileButtonClicksRef.current = 0;
      unlockAdminPanel();
      setActiveTab('admin');
      setShowUserMenu(false);
      addToast({
        type: 'success',
        title: 'Admin Access Authorized',
        description: '5-click authorization verified. Admin Command Center opened.',
      });
      return;
    }

    profileButtonTimerRef.current = setTimeout(() => {
      profileButtonClicksRef.current = 0;
    }, 2500);

    setShowUserMenu(prev => !prev);
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left section: Mobile menu toggle + System Status + Mode pill */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebarMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open clinical navigation"
        >
          <Menu size={18} />
        </button>

        {/* System Operational Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span>System Operational</span>
        </div>

        {/* Mode Pill: DEMO MODE vs LIVE MODEL */}
        <button
          onClick={() => setAppMode(appMode === 'demo' ? 'live' : 'demo')}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide transition-all border ${
            appMode === 'demo'
              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              : 'bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100'
          }`}
          title="Click to toggle between Demo Simulation and Live Model mode"
        >
          <Cpu size={12} className={appMode === 'demo' ? 'text-amber-600' : 'text-indigo-600'} />
          <span>{appMode === 'demo' ? 'DEMO MODE' : 'LIVE MODEL'}</span>
        </button>

        {/* Prototype Hardware Quick Link */}
        <button
          onClick={() => setActiveTab('prototype')}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
          title="Open Hardware Prototype Stream & Calculations"
        >
          <Radio size={12} className="text-indigo-600 animate-pulse" />
          <span>Prototype Stream</span>
        </button>

        {/* Network status */}
        <OfflineIndicator variant="badge" />
      </div>

      {/* Middle: Clinical Search Bar */}
      <div className="hidden md:flex max-w-xs flex-1 mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search patient, bed (e.g. ICU-02), or risk..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Right: Hospital context + PWA Install + Alerts + Clinician profile */}
      <div className="flex items-center gap-2.5">
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-medium border-r border-slate-200 pr-3">
          <Building2 size={14} className="text-slate-400" />
          <span>Metro Central ICU • Unit A</span>
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Urgent Alerts Bell */}
        <button
          onClick={() => setActiveTab('alerts')}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          aria-label="View Active Alerts"
        >
          <Bell size={16} />
          {activeAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-2xs">
              {activeAlerts.length}
            </span>
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={handleProfileButtonClick}
            className="flex items-center gap-2 rounded-xl border border-slate-200 p-1.5 hover:bg-slate-50 transition-colors cursor-pointer select-none"
            title="Clinician Account (Tap 5 times to access Admin Panel)"
          >
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800 text-xs font-bold">
                {currentUser?.full_name.charAt(0) || 'D'}
              </div>
            )}
            <div className="hidden lg:block text-left pr-1">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.full_name || 'Dr. Sarah Lin'}
              </p>
              <p className="text-[10px] font-semibold text-sky-700 capitalize leading-tight">
                {currentUser?.role || 'Clinician'}
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in">
              {/* Target component: clicking 5 times opens Admin Panel ("when i click this component 5 times it want to open admin pannel") */}
              <div
                onClick={handleSecretComponentClick}
                className="border-b border-slate-100 px-3 py-2 cursor-pointer select-none transition hover:bg-slate-50 active:bg-slate-100 rounded-lg group"
                title="Clinician Profile Details (Tap 5 times to open Admin Panel)"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-950 transition-colors">
                      {currentUser?.full_name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {currentUser?.hospital_id}
                    </p>
                  </div>
                  {componentClickCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] animate-pulse">
                      {componentClickCount}/5
                    </span>
                  )}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  <User size={14} className="text-slate-400" />
                  <span>Profile & Department</span>
                </button>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
