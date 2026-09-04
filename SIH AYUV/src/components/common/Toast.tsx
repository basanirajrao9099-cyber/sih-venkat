import React from 'react';
import { useToast } from '../../hooks/useToast';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-[#2E7D5B] shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />,
          info: <Info className="w-5 h-5 text-[#2E7D5B] shrink-0" />,
        };

        const borderColors = {
          success: 'border-[#A7D7C1] bg-white text-[#26352D]',
          warning: 'border-[#FDE68A] bg-white text-[#26352D]',
          error: 'border-[#FCA5A5] bg-white text-[#26352D]',
          info: 'border-[#BDE0D0] bg-white text-[#26352D]',
        };

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-up',
              borderColors[toast.type]
            )}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-[#26352D]">{toast.title}</h4>
              <p className="text-xs text-[#66736B] mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#8C9B91] hover:text-[#26352D] p-1 rounded-lg hover:bg-[#F5F1E8] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
