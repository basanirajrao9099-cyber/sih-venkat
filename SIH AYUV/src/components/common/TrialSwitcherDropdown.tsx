import React, { useState, useRef, useEffect } from 'react';
import { useTrial } from '../../hooks/useTrialContext';
import { ChevronDown, Check, Plus, Globe, Sparkles, Beaker, Pill, ShieldCheck } from 'lucide-react';

export const TrialSwitcherDropdown: React.FC = () => {
  const { selectedTrial, trialList, switchTrial, openFetchModal } = useTrial();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 transition-all text-xs font-semibold shadow-sm group"
        title="Switch Medicine Clinical Trial"
      >
        <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px] border border-emerald-500/30">
          🌿
        </div>
        <div className="text-left max-w-[200px] sm:max-w-[260px] truncate">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{selectedTrial.protocolId}</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
              {selectedTrial.phase}
            </span>
          </div>
          <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px]">
            {selectedTrial.title}
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-fade-in divide-y divide-slate-100 dark:divide-slate-800">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Select Ayurvedic Medicine Trial</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {trialList.length} Studies
            </span>
          </div>

          {/* Trial List */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
            {trialList.map((trial) => {
              const isSelected = trial.id === selectedTrial.id;
              return (
                <button
                  key={trial.id}
                  onClick={() => {
                    switchTrial(trial.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 shadow-sm'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {trial.protocolId}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {trial.phase}
                      </span>
                      {trial.ctriNumber && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          CTRI: {trial.ctriNumber}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-semibold leading-tight line-clamp-2 ${
                      isSelected ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {trial.title}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      <Beaker className="w-3 h-3 text-slate-400" />
                      <span>{trial.formulation}</span>
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action to Fetch New */}
          <div className="p-2 bg-slate-50 dark:bg-slate-950/40">
            <button
              onClick={() => {
                setIsOpen(false);
                openFetchModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Fetch More Medicines from CTRI / Web</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
