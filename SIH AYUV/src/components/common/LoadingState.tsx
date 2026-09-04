import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-[#F5F1E8]',
        className
      )}
    />
  );
};

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading trial data...',
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#E8E4D9] border-t-[#2E7D5B] animate-spin" />
        <div className="absolute w-6 h-6 rounded-full border-4 border-[#E8E4D9] border-b-[#7FAF91] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
      </div>
      <p className="mt-4 text-sm font-bold text-[#26352D]">{message}</p>
      <p className="mt-1 text-xs text-[#66736B]">Retrieving records from AYU-TRIAL FABRIC clinical core</p>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="w-full rounded-2xl border border-[#E8E4D9] bg-white p-5 space-y-4 shadow-xs">
      <div className="flex justify-between items-center pb-3 border-b border-[#E8E4D9]">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, cIdx) => (
              <Skeleton key={cIdx} className="h-5 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
