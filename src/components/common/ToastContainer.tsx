import React from 'react';
import { useCareSense } from '../../hooks/useCareSense';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useCareSense();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const icons = {
          info: <Info size={18} className="text-sky-600 shrink-0" />,
          success: <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />,
          warning: <AlertTriangle size={18} className="text-amber-600 shrink-0" />,
          critical: <AlertCircle size={18} className="text-rose-600 shrink-0 animate-bounce" />,
        };

        const borderStyles = {
          info: 'border-sky-200 bg-sky-50/95 text-sky-950',
          success: 'border-emerald-200 bg-emerald-50/95 text-emerald-950',
          warning: 'border-amber-200 bg-amber-50/95 text-amber-950',
          critical: 'border-rose-300 bg-rose-50/95 text-rose-950 shadow-lg ring-1 ring-rose-300',
        };

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-xl border p-3.5 shadow-md backdrop-blur-sm transition-all animate-in fade-in slide-in-from-top-2 ${
              borderStyles[toast.type]
            }`}
          >
            <div className="flex items-start gap-2.5">
              {icons[toast.type]}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold leading-tight">{toast.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{toast.timestamp}</span>
                </div>
                {toast.description && (
                  <p className="mt-1 text-xs opacity-85 leading-snug">{toast.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
              aria-label="Dismiss alert notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
