import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed as PWA standalone, no button needed
  if (isInstalled) {
    return null;
  }

  // Chromium / Desktop / Android flow
  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={install}
        className={`inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 font-medium text-white hover:bg-sky-700 active:bg-sky-800 transition-colors shadow-xs ${
          compact ? 'p-2 text-xs' : 'px-3 py-1.5 text-xs'
        }`}
        title="Install CareSense as a desktop/mobile Progressive Web App"
      >
        <Download size={14} className="stroke-[2.5]" />
        {!compact && <span>Install App</span>}
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSModal(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs ${
            compact ? 'p-2 text-xs' : 'px-3 py-1.5 text-xs'
          }`}
          title="Install CareSense on iPhone or iPad"
        >
          <Share2 size={14} className="text-sky-600" />
          {!compact && <span>Install CareSense</span>}
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <PlusSquare size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Install CareSense</h3>
                  <p className="text-xs text-slate-500">Add to your iOS Home Screen</p>
                </div>
              </div>

              <ol className="space-y-3 text-xs text-slate-600 leading-relaxed my-4 border-y border-slate-100 py-3">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> icon in the bottom Safari toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                    3
                  </span>
                  <span>
                    Confirm by tapping <strong>Add</strong> in the top-right corner.
                  </span>
                </li>
              </ol>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback triggerable install guide
  return (
    <button
      id="btn-pwa-install-ambient"
      onClick={() => {
        alert(
          'To install CareSense:\n• Chrome/Edge: Click the install icon in the address bar.\n• Safari (iOS): Tap Share -> Add to Home Screen.\n• Android: Tap Menu (⋮) -> Install App.'
        );
      }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs ${
        compact ? 'p-1.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
      title="Install CareSense PWA"
    >
      <Download size={13} className="text-slate-500" />
      {!compact && <span>Install PWA</span>}
    </button>
  );
};
