import React, { useState } from 'react';
import { Menu, Search, Bell, CheckCircle, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { MOCK_TRIALS } from '../data/mockTrials';

interface TopNavbarProps {
  onMenuClick: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuClick }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [selectedTrialId, setSelectedTrialId] = useState<string>(MOCK_TRIALS[0].id);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const selectedTrial = MOCK_TRIALS.find((t) => t.id === selectedTrialId) || MOCK_TRIALS[0];

  const notifications = [
    {
      id: 'notif-1',
      title: 'SAE-2026-003 Escalation',
      desc: 'CDSCO 24h notification filed successfully for SITE-01-AIIA.',
      time: '12m ago',
      type: 'warning',
    },
    {
      id: 'notif-2',
      title: 'Amendment v2.1 Approved',
      desc: 'IEC-AIIA granted approval for expanded visit windows.',
      time: '1h ago',
      type: 'success',
    },
    {
      id: 'notif-3',
      title: 'LIMS Sync Completed',
      desc: '89 new biomarker results imported from Agappe lab gateway.',
      time: '2h ago',
      type: 'info',
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 backdrop-blur-md border-b border-[#E8E4D9] shadow-[0_2px_12px_-2px_rgba(46,125,91,0.05)]">
      {/* Left side: Hamburger & Trial Selector */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-[#5E6E64] hover:text-[#26352D] hover:bg-[#F5F1E8] lg:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Active Study Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#5E6E64] font-mono">
              Active Clinical Protocol
            </span>
            <select
              value={selectedTrialId}
              onChange={(e) => {
                setSelectedTrialId(e.target.value);
                showToast('Protocol Context Updated', `Now viewing ${e.target.value}`, 'info');
              }}
              className="bg-[#F5F1E8] text-xs font-bold text-[#2E7D5B] rounded-xl px-3 py-1.5 border border-[#E8E4D9] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:bg-white cursor-pointer shadow-sm transition-all"
            >
              {MOCK_TRIALS.map((trial) => (
                <option key={trial.id} value={trial.id}>
                  {trial.protocolId} — {trial.shortTitle} ({trial.phase})
                </option>
              ))}
            </select>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EAF4EF] border border-[#A7D7C1] text-[#2E7D5B] text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-[#2E7D5B]" />
            <span>CTRI Registered: {selectedTrial.ctriNumber}</span>
          </div>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9B91]" />
          <input
            type="text"
            placeholder="Search participants, sites, rules, audit hashes (Cmd + K)..."
            className="w-full bg-[#F5F1E8] border border-[#E8E4D9] rounded-xl pl-9 pr-4 py-2 text-xs text-[#26352D] placeholder-[#8C9B91] focus:outline-none focus:bg-white focus:border-[#2E7D5B] focus:ring-2 focus:ring-[#2E7D5B]/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Right side: Notifications, GCP Status & Profile */}
      <div className="flex items-center gap-3">
        {/* Compliance Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EAF4EF] border border-[#A7D7C1] text-[#2E7D5B] text-xs font-bold shadow-sm">
          <CheckCircle className="w-3.5 h-3.5 text-[#2E7D5B]" />
          <span>GCP Compliant</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-[#5E6E64] hover:text-[#26352D] hover:bg-[#F5F1E8] border border-transparent hover:border-[#E8E4D9] transition-all"
            title="Trial Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C9A227] ring-2 ring-white animate-pulse" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-[#E8E4D9] shadow-xl p-2 z-50 animate-slide-up">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#F5F1E8]">
                <span className="text-xs font-bold text-[#26352D]">Governance Alerts</span>
                <span className="text-[10px] text-[#2E7D5B] font-semibold hover:underline cursor-pointer">Mark all read</span>
              </div>
              <div className="divide-y divide-[#F5F1E8] max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-[#FAF9F4] rounded-xl transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#26352D]">{n.title}</span>
                      <span className="text-[10px] text-[#8C9B91]">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#5E6E64] mt-1 leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#E8E4D9]">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full border-2 border-[#7FAF91] object-cover shadow-sm"
          />
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-[#26352D] leading-tight truncate max-w-[130px]">
              {currentUser.name.split(',')[0]}
            </p>
            <p className="text-[10px] text-[#2E7D5B] font-bold tracking-wide">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
