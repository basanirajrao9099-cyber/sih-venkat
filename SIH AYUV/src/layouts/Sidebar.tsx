import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Building2,
  Users,
  UserPlus,
  FileText,
  GitPullRequest,
  TrendingUp,
  ShieldAlert,
  Award,
  Scale,
  Cpu,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Sparkles,
  Leaf,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { RoleSwitcher } from '../components/navigation/RoleSwitcher';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const navGroups: NavGroup[] = [
    {
      title: 'TRIAL OPERATIONS',
      items: [
        { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'SIH Demo Mode', to: '/demo', icon: <Sparkles className="w-4 h-4 text-[#2E7D5B]" />, badge: 'LIVE' },
        { label: 'Clinical Trials', to: '/trials', icon: <FlaskConical className="w-4 h-4" />, badge: '1' },
        { label: 'Trial Sites', to: '/sites', icon: <Building2 className="w-4 h-4" />, badge: '3' },
      ],
    },
    {
      title: 'SUBJECTS & PROTOCOL',
      items: [
        { label: 'Participants', to: '/participants', icon: <Users className="w-4 h-4" />, badge: '47' },
        { label: 'Recruitment', to: '/recruitment', icon: <UserPlus className="w-4 h-4" /> },
        { label: 'Protocol & SoA', to: '/protocol', icon: <FileText className="w-4 h-4" /> },
        { label: 'Changesets', to: '/changesets', icon: <GitPullRequest className="w-4 h-4" />, badge: 'v1.1' },
      ],
    },
    {
      title: 'IMPACT & GOVERNANCE',
      items: [
        { label: 'Impact Analysis', to: '/impact', icon: <TrendingUp className="w-4 h-4" /> },
        { label: 'Safety & PV', to: '/safety', icon: <ShieldAlert className="w-4 h-4" />, badge: '1 SAE' },
        { label: 'Ethics (IEC)', to: '/ethics', icon: <Award className="w-4 h-4" /> },
        { label: 'Regulatory', to: '/regulatory', icon: <Scale className="w-4 h-4" /> },
      ],
    },
    {
      title: 'FABRIC SYSTEM',
      items: [
        { label: 'Integrations', to: '/integrations', icon: <Boxes className="w-4 h-4" /> },
        { label: 'Protocol Compiler', to: '/compiler', icon: <Cpu className="w-4 h-4" />, badge: 'Rule Valid' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#26352D]/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-[#E8E4D9] shadow-[2px_0_12px_-2px_rgba(46,125,91,0.04)] transition-all duration-300 ease-in-out select-none',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#E8E4D9] bg-[#FAF9F4]/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2E7D5B] to-[#7FAF91] flex items-center justify-center text-white shadow-md shadow-[#2E7D5B]/20 shrink-0">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-extrabold tracking-tight text-[#26352D] flex items-center gap-1.5">
                  AYU-TRIAL <span className="text-[#2E7D5B] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#EAF4EF] border border-[#A7D7C1]">FABRIC</span>
                </h1>
                <p className="text-[10px] text-[#66736B] font-medium truncate">Ayurvedic Governance Compiler</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-[#66736B] hover:text-[#26352D] hover:bg-[#F5F1E8] transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Role Selector Card */}
        <div className="p-3 border-b border-[#E8E4D9]/80 bg-[#FAF9F4]/40">
          <RoleSwitcher collapsed={collapsed} />
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!collapsed ? (
                <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#66736B] font-mono mb-2">
                  {group.title}
                </h2>
              ) : (
                <div className="h-px bg-[#E8E4D9] my-3 mx-2" />
              )}

              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                      isActive
                        ? 'bg-[#EAF4EF] text-[#2E7D5B] border border-[#A7D7C1] shadow-sm'
                        : 'text-[#5E6E64] hover:text-[#26352D] hover:bg-[#F5F1E8]'
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span
                    className={cn(
                      'shrink-0 transition-colors group-hover:text-[#2E7D5B]',
                      'text-[#5E6E64]'
                    )}
                  >
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span className="flex-1 truncate text-left">{item.label}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#F5F1E8] border border-[#E8E4D9] text-[#2E7D5B]">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Footer info */}
        {!collapsed && (
          <div className="p-3 border-t border-[#E8E4D9] text-[11px] text-[#66736B] flex items-center justify-between bg-[#FAF9F4]/60">
            <span>Ministry of Ayush</span>
            <span className="text-[#2E7D5B] font-mono font-bold">AIIA Delhi</span>
          </div>
        )}
      </aside>
    </>
  );
};
