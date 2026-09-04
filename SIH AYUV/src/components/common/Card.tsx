import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white border border-[#E8E4D9] rounded-2xl p-5 text-[#26352D] shadow-[0_4px_20px_-4px_rgba(46,125,91,0.05),0_2px_6px_-1px_rgba(0,0,0,0.02)] transition-all duration-200',
        hoverable && 'hover:border-[#7FAF91] hover:shadow-[0_8px_30px_-4px_rgba(46,125,91,0.12),0_4px_10px_-1px_rgba(0,0,0,0.03)] hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className }) => {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div>
        <h3 className="text-base font-bold text-[#26352D] tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-[#66736B] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  changeType = 'positive',
  icon,
  description,
  className,
}) => {
  const changeColors = {
    positive: 'text-[#2E7D5B] bg-[#EAF4EF] border-[#A7D7C1]',
    negative: 'text-[#B91C1C] bg-[#FDF2F2] border-[#FCA5A5]',
    neutral: 'text-[#5E6E64] bg-[#F5F1E8] border-[#E8E4D9]',
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#66736B] font-mono">{label}</span>
        {icon && (
          <div className="p-2.5 bg-[#EAF4EF] rounded-xl text-[#2E7D5B] border border-[#A7D7C1] shadow-sm">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-2xl font-extrabold tracking-tight text-[#26352D]">{value}</div>
        {change && (
          <span className={cn('text-xs px-2 py-0.5 rounded-full border font-bold', changeColors[changeType])}>
            {change}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1.5 text-xs text-[#66736B] truncate font-medium">{description}</p>
      )}
    </Card>
  );
};
