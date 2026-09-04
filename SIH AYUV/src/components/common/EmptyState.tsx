import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-10 text-center rounded-2xl border-2 border-dashed border-[#E8E4D9] bg-white shadow-2xs',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F5F1E8] flex items-center justify-center text-[#2E7D5B] mb-3 border border-[#E8E4D9]">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-bold text-[#26352D]">{title}</h3>
      <p className="text-xs text-[#66736B] max-w-sm mt-1 mb-4 leading-relaxed font-medium">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
