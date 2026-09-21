import React from 'react';
import { LucideIcon, ArrowRight, ArrowDown } from 'lucide-react';

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    label: string;
    direction: 'up' | 'down' | 'neutral';
    positiveIsGood?: boolean;
  };
  icon?: LucideIcon;
  variant?: 'default' | 'critical' | 'elevated' | 'success';
  onClick?: () => void;
  isActive?: boolean;
  actionLabel?: string;
  actionIcon?: 'down' | 'right';
  badgeText?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'default',
  onClick,
  isActive = false,
  actionLabel,
  actionIcon = 'down',
  badgeText,
  className = '',
}) => {
  const variantStyles = {
    default: {
      border: 'border-slate-200/90 hover:border-slate-400 bg-white',
      activeStyle: 'ring-2 ring-sky-500 ring-offset-2 border-sky-400 bg-sky-50/20 shadow-md',
      iconBg: 'bg-slate-100 text-slate-700',
      valColor: 'text-slate-900',
      actionText: 'text-slate-600 group-hover:text-slate-900',
    },
    critical: {
      border: 'border-rose-200 bg-rose-50/25 hover:border-rose-400 hover:shadow-rose-500/10',
      activeStyle: 'ring-2 ring-rose-500 ring-offset-2 border-rose-400 bg-rose-50/50 shadow-md',
      iconBg: 'bg-rose-100 text-rose-700',
      valColor: 'text-rose-700',
      actionText: 'text-rose-700 group-hover:text-rose-900',
    },
    elevated: {
      border: 'border-amber-300/90 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/25 hover:border-amber-400 hover:shadow-amber-500/15',
      activeStyle: 'ring-2 ring-amber-500 ring-offset-2 border-amber-400 bg-amber-50/60 shadow-md',
      iconBg: 'bg-amber-100 text-amber-800',
      valColor: 'text-amber-900',
      actionText: 'text-amber-800 group-hover:text-amber-950',
    },
    success: {
      border: 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-400 hover:shadow-emerald-500/10',
      activeStyle: 'ring-2 ring-emerald-500 ring-offset-2 border-emerald-400 bg-emerald-50/40 shadow-md',
      iconBg: 'bg-emerald-100 text-emerald-700',
      valColor: 'text-emerald-700',
      actionText: 'text-emerald-700 group-hover:text-emerald-900',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      id={id}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative rounded-2xl border p-4.5 shadow-xs transition-all duration-200 flex flex-col justify-between select-none ${
        isActive ? style.activeStyle : style.border
      } ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-bold tracking-wide text-slate-600 uppercase">
            {title}
          </span>
          <div className="flex items-center gap-1.5">
            {badgeText && (
              <span className="rounded-md bg-amber-100/80 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-800 uppercase tracking-wider border border-amber-200/60">
                {badgeText}
              </span>
            )}
            {Icon && (
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${style.iconBg}`}>
                <Icon size={16} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className={`text-2xl font-black tracking-tight sm:text-3xl ${style.valColor}`}>
            {value}
          </span>
          {trend && (
            <span
              className={`inline-flex items-center text-[11px] font-bold ${
                trend.direction === 'neutral'
                  ? 'text-slate-500'
                  : (trend.direction === 'up' && trend.positiveIsGood) ||
                    (trend.direction === 'down' && !trend.positiveIsGood)
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '—'} {trend.label}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 font-medium truncate">
            {subtitle}
          </p>
        )}
      </div>

      {actionLabel && (
        <div className={`mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold transition-colors ${style.actionText}`}>
          <span className="truncate">{actionLabel}</span>
          {actionIcon === 'down' ? (
            <ArrowDown size={13} className="shrink-0 transition-transform group-hover:translate-y-0.5" />
          ) : (
            <ArrowRight size={13} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
          )}
        </div>
      )}
    </div>
  );
};
