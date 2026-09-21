import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface OfflineIndicatorProps {
  variant?: 'badge' | 'banner';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ variant = 'badge' }) => {
  const { status, isOnline, isSyncing } = useOnlineStatus();

  if (variant === 'banner') {
    if (isOnline && !isSyncing) return null;

    return (
      <div
        id="offline-banner"
        role="alert"
        className={`fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-xl border backdrop-blur-md transition-all ${
          isSyncing
            ? 'bg-sky-900/90 text-sky-100 border-sky-700'
            : 'bg-rose-950/90 text-rose-100 border-rose-800'
        }`}
      >
        {isSyncing ? (
          <>
            <RefreshCw size={14} className="animate-spin text-sky-400" />
            <span>Syncing telemetry stream with Supabase...</span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="text-rose-400 animate-pulse" />
            <span>
              Offline Mode — Using local cache. Live ICU telemetry paused until reconnection.
            </span>
          </>
        )}
      </div>
    );
  }

  // Header inline status badge
  return (
    <div
      id="connection-status-badge"
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border select-none transition-colors"
      style={{
        backgroundColor: isSyncing ? '#eff6ff' : isOnline ? '#f0fdf4' : '#fef2f2',
        borderColor: isSyncing ? '#bfdbfe' : isOnline ? '#bbf7d0' : '#fecaca',
        color: isSyncing ? '#1d4ed8' : isOnline ? '#15803d' : '#b91c1c',
      }}
      title={
        isSyncing
          ? 'Syncing updates with CareSense backend'
          : isOnline
          ? 'Network connected to CareSense services'
          : 'Offline: live telemetry paused'
      }
    >
      {isSyncing ? (
        <RefreshCw size={11} className="animate-spin" />
      ) : isOnline ? (
        <Wifi size={11} className="text-emerald-600" />
      ) : (
        <WifiOff size={11} className="text-rose-600" />
      )}
      <span>{status}</span>
    </div>
  );
};
