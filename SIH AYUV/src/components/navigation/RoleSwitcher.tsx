import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { RoleName } from '../../types/user';
import { ShieldCheck, ChevronDown, Check, UserCheck, Stethoscope, ClipboardList, ShieldAlert, Sparkles, User } from 'lucide-react';
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
    showToast('Role Switched (Demo Mode)', `Active Persona: ${role}`, 'info', 3000);
  };

  const getRoleIcon = (role: RoleName) => {
    switch (role) {
      case 'Principal Investigator':
        return <Stethoscope className="w-4 h-4 text-[#1E4D38]" />;
      case 'Ethics Reviewer':
        return <ShieldCheck className="w-4 h-4 text-[#1E4D38]" />;
      case 'Monitor':
        return <UserCheck className="w-4 h-4 text-[#C9A227]" />;
      case 'Trial Coordinator':
        return <ClipboardList className="w-4 h-4 text-[#1E4D38]" />;
      case 'Pharmacovigilance':
        return <ShieldAlert className="w-4 h-4 text-[#B91C1C]" />;
      case 'Admin':
        return <Sparkles className="w-4 h-4 text-[#1E4D38]" />;
      default:
        return <User className="w-4 h-4 text-[#1E4D38]" />;
    }
  };

  const getRoleLabel = (role: RoleName) => {
    if (role === 'Monitor') return 'Clinical Research Associate (CRA)';
    if (role === 'Principal Investigator') return 'Principal Investigator (PI)';
    if (role === 'Ethics Reviewer') return 'Ethics Reviewer (IEC)';
    return role;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Demo Mode Badge */}
      {!collapsed && (
        <div className="flex items-center justify-between px-1 mb-1.5">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#5C6B62] bg-[#FAF9F4] px-1.5 py-0.5 rounded border border-[#E2DFD6]">
            DEMO MODE
          </span>
          <span className="text-[9px] text-[#8C9B91]">Role Switcher</span>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[#E2DFD6] bg-white hover:bg-[#FAF9F4] hover:border-[#1E4D38] transition-all text-left text-xs shadow-2xs cursor-pointer',
          collapsed ? 'p-2 justify-center' : 'w-full'
        )}
        title={`Active Persona: ${getRoleLabel(currentUser.role)} (Demo Mode)`}
      >
        <div className="w-7 h-7 rounded-lg bg-[#EAF4EF] border border-[#C5DFD2] flex items-center justify-center shrink-0 shadow-2xs">
          {getRoleIcon(currentUser.role)}
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#1E2922] truncate">{getRoleLabel(currentUser.role)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E4D38] shrink-0" />
            </div>
            <p className="text-[10px] text-[#5C6B62] truncate font-medium">{currentUser.name.split(',')[0]}</p>
          </div>
        )}

        {!collapsed && <ChevronDown className="w-3.5 h-3.5 text-[#8C9B91] shrink-0 ml-1" />}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-76 rounded-2xl bg-white border border-[#E2DFD6] shadow-xl p-2 z-50 text-[#1E2922] animate-slide-up">
          <div className="px-3 py-2 border-b border-[#E8E5DC] flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5C6B62] uppercase tracking-wider font-mono">
              Switch Clinical Persona
            </span>
            <span className="text-[9px] font-bold text-[#1E4D38] bg-[#EAF4EF] px-1.5 py-0.5 rounded border border-[#C5DFD2]">
              DEMO MODE
            </span>
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
                      ? 'bg-[#EAF4EF] text-[#1E4D38] font-bold border border-[#C5DFD2]'
                      : 'hover:bg-[#FAF9F4] text-[#5C6B62] hover:text-[#1E2922]'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-[#FAF9F4] border border-[#E2DFD6] flex items-center justify-center shrink-0">
                      {getRoleIcon(item.role)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold leading-snug truncate">{getRoleLabel(item.role)}</p>
                      <p className="text-[10px] text-[#8C9B91] truncate">{item.user.name.split(',')[0]} · {item.user.institution.split('(')[0]}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#1E4D38] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
