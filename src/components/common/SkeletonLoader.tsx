import React from 'react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* KPI Skeletons */}
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-8 w-14" />
          <SkeletonBox className="h-3 w-28" />
        </div>
      ))}
    </div>

    {/* Big Chart Skeleton */}
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div className="flex justify-between">
        <SkeletonBox className="h-5 w-48" />
        <SkeletonBox className="h-8 w-32" />
      </div>
      <SkeletonBox className="h-64 w-full" />
    </div>

    {/* Table Skeleton */}
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <SkeletonBox className="h-5 w-36" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  </div>
);

export const VitalsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 animate-pulse">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
        <SkeletonBox className="h-3 w-16" />
        <SkeletonBox className="h-6 w-20" />
        <SkeletonBox className="h-3 w-12" />
      </div>
    ))}
  </div>
);
