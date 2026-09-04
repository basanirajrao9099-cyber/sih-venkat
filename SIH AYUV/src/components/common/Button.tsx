import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, icon, children, disabled, ...props }, ref) => {
    const variantStyles = {
      primary: 'bg-[#2E7D5B] hover:bg-[#24654A] text-white shadow-sm shadow-[#2E7D5B]/25 active:bg-[#1B4D38] border border-transparent font-semibold',
      secondary: 'bg-[#F5F1E8] hover:bg-[#EAE6DC] text-[#2E7D5B] border border-[#E8E4D9] active:bg-[#E2DDD0] font-semibold',
      outline: 'bg-white hover:bg-[#F5F1E8] text-[#26352D] border border-[#E8E4D9] hover:border-[#7FAF91] font-semibold shadow-xs',
      danger: 'bg-[#B91C1C] hover:bg-[#991B1B] text-white shadow-sm shadow-red-900/20 active:bg-[#7F1D1D] font-semibold',
      ghost: 'bg-transparent hover:bg-[#F5F1E8] text-[#5E6E64] hover:text-[#26352D] font-semibold',
    };

    const sizeStyles = {
      xs: 'text-[11px] px-2.5 py-1 rounded-lg gap-1.5',
      sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5',
      md: 'text-xs px-4 py-2 rounded-xl gap-2',
      lg: 'text-sm px-5 py-2.5 rounded-xl gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:ring-offset-1 focus:ring-offset-[#FAF9F4] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          icon && <span className="inline-flex shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
