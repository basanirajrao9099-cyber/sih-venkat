import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className,
  dot = false,
}) => {
  const variantStyles = {
    default: 'bg-[#F5F1E8] text-[#5E6E64] border border-[#E8E4D9]',
    success: 'bg-[#EAF4EF] text-[#2E7D5B] border border-[#A7D7C1]',
    warning: 'bg-[#FEF9C3] text-[#92400E] border border-[#FDE68A]',
    danger: 'bg-[#FDF2F2] text-[#B91C1C] border border-[#FCA5A5]',
    info: 'bg-[#EBF5F0] text-[#2E7D5B] border border-[#BDE0D0]',
    purple: 'bg-[#F3E8FF] text-[#7E22CE] border border-[#DDD6FE]',
    amber: 'bg-[#FBF6E5] text-[#8D6F12] border border-[#EEDCA2]',
  };

  const dotStyles = {
    default: 'bg-[#8C9B91]',
    success: 'bg-[#2E7D5B]',
    warning: 'bg-[#D97706]',
    danger: 'bg-[#DC2626]',
    info: 'bg-[#2E7D5B]',
    purple: 'bg-[#9333EA]',
    amber: 'bg-[#C9A227]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-0.5 font-bold',
    lg: 'text-sm px-3.5 py-1 font-bold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-sans tracking-wide shadow-xs',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotStyles[variant])} />}
      {children}
    </span>
  );
};
