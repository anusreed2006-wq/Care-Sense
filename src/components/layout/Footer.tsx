import React from 'react';
import { ShieldAlert, Database, Cpu, Lock } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Clinical Disclaimer */}
        <div className="flex items-start gap-2 max-w-3xl">
          <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px] text-slate-600">
            <strong>Clinical Prototype Disclaimer:</strong> CareSense provides AI-assisted early-warning risk predictions to augment clinical observation. All predictions, risk tiers, and feature attributions must be evaluated in conjunction with full patient examination and standard hospital Sepsis-3 protocols. Not for standalone diagnostic decision-making.
          </p>
        </div>

        {/* Backend & Security tags */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 shrink-0 font-medium">
          <span className="flex items-center gap-1">
            <Database size={13} className={isSupabaseConfigured ? 'text-emerald-600' : 'text-slate-400'} />
            <span>Supabase PostgreSQL {isSupabaseConfigured ? 'Connected' : 'Ready'}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Cpu size={13} className="text-indigo-500" />
            <span>CareSense Model v1.0.0</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Lock size={13} className="text-slate-400" />
            <span>HIPAA-Compliant Architecture</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
