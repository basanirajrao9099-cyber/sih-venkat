import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Sparkles, HelpCircle, Gamepad2, Globe, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useTrial } from '../hooks/useTrialContext';
import { TrialSwitcherDropdown } from '../components/common/TrialSwitcherDropdown';

interface TopNavbarProps {
  onMenuClick: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  category: 'Amendment' | 'Site' | 'Participant' | 'Evidence';
  subtitle: string;
  route: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { selectedTrial, openGuide, openFetchModal } = useTrial();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const notifications = [
    {
      id: 'notif-1',
      title: 'IEC Notification Dossier Submitted',
      desc: 'Institutional Ethics Committee review pending for ChangeSet CS-0001.',
      time: '45m ago',
      route: '/ethics',
    },
    {
      id: 'notif-2',
      title: 'Site Retraining Completed',
      desc: 'AIIA New Delhi signed off on CRC operational briefing logs.',
      time: '2h ago',
      route: '/sites',
    },
    {
      id: 'notif-3',
      title: 'Protocol Amendment CS-0001 Created',
      desc: 'Visit 4 window shifted from Day 25–31 to Day 25–35 across 3 sites.',
      time: 'Yesterday',
      route: '/changesets',
    },
  ];

  // Search corpus
  const searchIndex: SearchResult[] = [
    { id: 'cs-1', title: 'Visit 4 Schedule Change (CS-0001)', category: 'Amendment', subtitle: 'Day 25–31 → Day 25–35 protocol amendment', route: '/changesets' },
    { id: 'site-1', title: 'AIIA New Delhi (Site 01)', category: 'Site', subtitle: 'Lead investigational center · 18 participants', route: '/sites' },
    { id: 'site-2', title: 'National Institute of Ayurveda, Jaipur (Site 02)', category: 'Site', subtitle: 'Apex research center · 15 participants', route: '/sites' },
    { id: 'site-3', title: 'IPGT&RA Jamnagar (Site 03)', category: 'Site', subtitle: 'Participating study center · 14 participants', route: '/sites' },
    { id: 'p-1', title: 'Participant P-001 (Visit 4)', category: 'Participant', subtitle: 'Active cohort · Site 01 AIIA', route: '/participants' },
    { id: 'p-2', title: 'Participant P-014 (Visit 4)', category: 'Participant', subtitle: 'Active cohort · Site 02 NIA', route: '/participants' },
    { id: 'p-3', title: 'Participant P-047 (Visit 4)', category: 'Participant', subtitle: 'Active cohort · Site 03 IPGT', route: '/participants' },
    { id: 'evd-1', title: 'IEC Notification Letter (EVD-01)', category: 'Evidence', subtitle: 'Central ethics board dossier acknowledgement', route: '/compiler' },
    { id: 'evd-2', title: 'Patient Consent Addendum v1.1 (EVD-02)', category: 'Evidence', subtitle: 'ICMR 2017 compliant patient information sheet', route: '/compiler' },
  ];

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = searchIndex.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
    setSearchResults(matches);
    setIsSearchOpen(true);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (route: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(route);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 backdrop-blur-md border-b border-[#E8E5DC] shadow-xs">
      {/* Left side: Hamburger & Medicine Trial Dropdown */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-[#5C6B62] hover:text-[#1E2922] hover:bg-[#FAF9F4] lg:hidden transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Multi-Trial Dropdown */}
        <TrialSwitcherDropdown />
      </div>

      {/* Center Search Bar with Dropdown Results */}
      <div ref={searchRef} className="relative hidden lg:flex items-center flex-1 max-w-sm xl:max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C9B91]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
            placeholder="Search amendments, sites, evidence..."
            className="w-full bg-[#FAF9F4] border border-[#E2DFD6] rounded-xl pl-8 pr-8 py-1.5 text-xs text-[#1E2922] placeholder-[#8C9B91] focus:outline-none focus:bg-white focus:border-[#1E4D38] transition-all"
          />
        </div>

        {/* Live Search Results Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E2DFD6] rounded-xl shadow-lg p-2 z-50 max-h-80 overflow-y-auto animate-fade-in">
            {searchResults.length > 0 ? (
              <div className="divide-y divide-[#E8E5DC]">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => handleSelectResult(res.route)}
                    className="w-full text-left p-2.5 hover:bg-[#FAF9F4] rounded-lg transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1E2922] truncate group-hover:text-[#1E4D38]">
                          {res.title}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-[#5C6B62] bg-[#FAF9F4] px-1.5 py-0.5 rounded border border-[#E2DFD6]">
                          {res.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C6B62] truncate">{res.subtitle}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8C9B91] shrink-0 group-hover:text-[#1E4D38] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#5C6B62]">
                No matching clinical records found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: Game Guide + Fetch CTRI + Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Game Guide Walkthrough Trigger */}
        <button
          onClick={openGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 text-xs font-bold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
          title="Interactive Platform Guide & Controls Demo"
        >
          <Gamepad2 className="w-4 h-4 animate-bounce" />
          <span className="hidden sm:inline">How It Works / Guide</span>
        </button>

        {/* Fetch More Medicines Shortcut */}
        <button
          onClick={openFetchModal}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          title="Fetch Live Clinical Trial from CTRI (Ministry of Ayush)"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span>+ Import CTRI</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-[#5C6B62] hover:text-[#1E2922] hover:bg-[#FAF9F4] border border-transparent hover:border-[#E2DFD6] transition-all cursor-pointer"
            title="Trial Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-600 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-[#E2DFD6] shadow-xl p-2 z-50 animate-fade-in">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#E8E5DC]">
                <span className="text-xs font-bold text-[#1E2922]">Governance Alerts</span>
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    showToast('Notifications Cleared', 'All alerts marked as read', 'info');
                  }}
                  className="text-[10px] text-[#1E4D38] font-semibold hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
              </div>
              <div className="divide-y divide-[#E8E5DC] max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate(n.route);
                    }}
                    className="p-3 hover:bg-[#FAF9F4] rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1E2922]">{n.title}</span>
                      <span className="text-[10px] text-[#8C9B91]">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#5C6B62] mt-1 leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-[#E8E5DC]">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full border border-[#C5DFD2] object-cover"
          />
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-[#1E2922] leading-tight truncate max-w-[130px]">
              {currentUser.name.split(',')[0]}
            </p>
            <p className="text-[10px] text-[#1E4D38] font-bold tracking-wide">
              {currentUser.role === 'Monitor' ? 'Clinical Research Associate' : currentUser.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
