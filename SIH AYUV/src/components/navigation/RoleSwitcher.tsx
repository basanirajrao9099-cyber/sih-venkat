import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { RoleName } from '../../types/user';
import { ShieldCheck, ChevronDown, Check, UserCheck, Stethoscope, ClipboardList, ShieldAlert, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

export const RoleSwitcher: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const { currentUser, roles, switchRole } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRole = async (role: RoleName) => {
    setIsOpen(false);
    if (role === currentUser.role) return;
    await switchRole(role);
    showToast('Role Switched', `Switched context to ${role}`, 'info', 3000);
  };

  const getRoleIcon = (role: RoleName) => {
    switch (role) {
      case 'Principal Investigator':
        return <Stethoscope className="w-4 h-4 text-[#2E7D5B]" />;
      case 'Trial Coordinator':
        return <ClipboardList className="w-4 h-4 text-[#2E7D5B]" />;
      case 'Monitor':
        return <UserCheck className="w-4 h-4 text-[#C9A227]" />;
      case 'Ethics Reviewer':
        return <ShieldCheck className="w-4 h-4 text-[#7FAF91]" />;
      case 'Pharmacovigilance':
        return <ShieldAlert className="w-4 h-4 text-[#B91C1C]" />;
      case 'Admin':
        return <Sparkles className="w-4 h-4 text-[#2E7D5B]" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-[#2E7D5B]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[#E8E4D9] bg-white hover:bg-[#F5F1E8] hover:border-[#7FAF91] transition-all text-left text-xs shadow-2xs cursor-pointer',
          collapsed ? 'p-2 justify-center' : 'w-full'
        )}
        title={`Current Role: ${currentUser.role}`}
      >
        <div className="w-7 h-7 rounded-lg bg-[#EAF4EF] border border-[#A7D7C1] flex items-center justify-center shrink-0 shadow-2xs">
          {getRoleIcon(currentUser.role)}
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#26352D] truncate">{currentUser.role}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B] shrink-0" />
            </div>
            <p className="text-[10px] text-[#66736B] truncate font-medium">{currentUser.institution}</p>
          </div>
        )}

        {!collapsed && <ChevronDown className="w-3.5 h-3.5 text-[#8C9B91] shrink-0 ml-1" />}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white border border-[#E8E4D9] shadow-xl p-2 z-50 text-[#26352D] animate-slide-up">
          <div className="px-3 py-2 border-b border-[#F5F1E8] text-[11px] font-bold text-[#66736B] uppercase tracking-wider font-mono">
            Simulate Clinical Role
          </div>
          <div className="py-1 space-y-1">
            {roles.map((item) => {
              const isSelected = item.role === currentUser.role;
              return (
                <button
                  key={item.role}
                  onClick={() => handleSelectRole(item.role)}
                  className={cn(
                    'w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer',
                    isSelected
                      ? 'bg-[#EAF4EF] text-[#2E7D5B] font-bold border border-[#A7D7C1]'
                      : 'hover:bg-[#F5F1E8] text-[#5E6E64]'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-[#F5F1E8] border border-[#E8E4D9] flex items-center justify-center shrink-0">
                      {getRoleIcon(item.role)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold leading-snug truncate">{item.role}</p>
                      <p className="text-[10px] text-[#8C9B91] truncate">{item.user.name}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#2E7D5B] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
