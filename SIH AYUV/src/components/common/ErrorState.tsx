import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load trial data',
  message = 'An unexpected error occurred while communicating with the AYU-TRIAL FABRIC API services.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-[#FCA5A5] bg-[#FDF2F2] text-[#B91C1C] shadow-xs',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#B91C1C] mb-3 border border-[#FCA5A5] shadow-xs">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-[#B91C1C]">{title}</h3>
      <p className="text-xs text-[#991B1B] max-w-sm mt-1 mb-4 leading-relaxed font-medium">{message}</p>
      {onRetry && (
        <Button size="sm" variant="danger" onClick={onRetry} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Request
        </Button>
      )}
    </div>
  );
};
