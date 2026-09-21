import { useEffect, useState } from 'react';

export type NetworkConnectionState = 'ONLINE' | 'OFFLINE' | 'SYNCING';

export function useOnlineStatus() {
  const [status, setStatus] = useState<NetworkConnectionState>(
    typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'ONLINE'
  );

  useEffect(() => {
    const handleOnline = () => {
      setStatus('SYNCING');
      const timer = setTimeout(() => {
        setStatus('ONLINE');
      }, 1200);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => setStatus('OFFLINE');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    status,
    isOnline: status !== 'OFFLINE',
    isSyncing: status === 'SYNCING',
  };
}
