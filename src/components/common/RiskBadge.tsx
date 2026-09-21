import React from 'react';
import { RiskTier } from '../../types';
import { ShieldCheck, Eye, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  tier: RiskTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulse?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  tier,
  size = 'md',
  showIcon = true,
  pulse = false,
}) => {
  const configs = {
    LOW: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      dotColor: 'bg-emerald-500',
      label: 'LOW RISK',
      ariaLabel: 'Low sepsis risk tier',
    },
    WATCH: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: Eye,
      iconColor: 'text-amber-600',
      dotColor: 'bg-amber-500',
      label: 'WATCH',
      ariaLabel: 'Watch sepsis risk tier',
    },
    ELEVATED: {
      bg: 'bg-orange-50 border-orange-200 text-orange-800',
      icon: AlertTriangle,
      iconColor: 'text-orange-600',
      dotColor: 'bg-orange-500',
      label: 'ELEVATED',
      ariaLabel: 'Elevated sepsis risk tier',
    },
    CRITICAL: {
      bg: 'bg-rose-50 border-rose-300 text-rose-800',
      icon: AlertOctagon,
      iconColor: 'text-rose-600',
      dotColor: 'bg-rose-500',
      label: 'CRITICAL',
      ariaLabel: 'Critical sepsis risk tier - urgent clinical review required',
    },
  };

  const config = configs[tier] || configs.LOW;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold tracking-wider gap-1',
    md: 'px-2.5 py-1 text-xs font-bold tracking-wider gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm font-bold tracking-wider gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      id={`risk-badge-${tier.toLowerCase()}`}
      role="status"
      aria-label={config.ariaLabel}
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses[size]} select-none shadow-2xs`}
    >
      {showIcon && <IconComponent size={iconSizes[size]} className={config.iconColor} />}
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotColor} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};
