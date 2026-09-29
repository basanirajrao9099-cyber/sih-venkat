import React, { useState } from 'react';
import { useTrial } from '../../hooks/useTrialContext';
import { Search, Globe, CheckCircle2, AlertCircle, Loader2, X, Sparkles, BookOpen, ExternalLink } from 'lucide-react';

const PRESET_CTRI_TRIALS = [
  {
    number: 'CTRI/2020/06/025557',
    name: 'Ashwagandha & Guduchi in Post-Viral Fatigue',
    phase: 'Phase III',
    herbs: 'Withania somnifera + Tinospora cordifolia',
  },
  {
    number: 'CTRI/2020/05/025429',
    name: 'AYUSH-64 in Mild-to-Moderate COVID-19 & Viral Syndrome',
    phase: 'Phase II/III',
    herbs: 'Saptaparna, Katuki, Chirayata, Kuberaksha',
  },
  {
    number: 'CTRI/2020/05/025213',
    name: 'Curcumin-Piperine Nano-emulsion Clinical Trial',
    phase: 'Phase II',
    herbs: 'Curcuma longa + Piper nigrum',
  },
  {
    number: 'CTRI/2021/08/035890',
    name: 'Brahmi & Shankhpushpi Cognitive Enhancement Protocol',
    phase: 'Phase II',
    herbs: 'Bacopa monnieri + Convolvulus pluricaulis',
  },
  {
    number: 'CTRI/2022/03/041125',
    name: 'Triphala & Guggulu Metabolic Syndrome Trial',
    phase: 'Phase III',
    herbs: 'Emblica, Terminalia chebula, Commiphora mukul',
  },
];

export const FetchCTRIModal: React.FC = () => {
  const { isFetchModalOpen, closeFetchModal, fetchLiveTrial } = useTrial();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  if (!isFetchModalOpen) return null;

  const handleFetch = async (ctriNum: string) => {
    if (!ctriNum.trim()) return;
    setLoading(true);
    setError(null);
    setSuccessResult(null);
    try {
      const trial = await fetchLiveTrial(ctriNum.trim());
      setSuccessResult(trial);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trial details from CTRI. Please check the registration number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 gpu-accelerated animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
              <Globe className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Import Real Medicine Trial from CTRI</h2>
              <p className="text-xs text-emerald-100/90">
                Live read-only connector to Clinical Trials Registry - India (ICMR / Ministry of Ayush)
              </p>
            </div>
          </div>
          <button
            onClick={closeFetchModal}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Enter CTRI Registration Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. CTRI/2020/06/025557"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch(query)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={() => handleFetch(query)}
                disabled={loading || !query.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Fetch Trial</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Or Select Real Verified Ayurvedic Medicine Protocols:</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_CTRI_TRIALS.map((preset) => (
                <div
                  key={preset.number}
                  onClick={() => {
                    setQuery(preset.number);
                    handleFetch(preset.number);
                  }}
                  className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {preset.number}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {preset.phase}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {preset.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      🌿 <span className="italic">{preset.herbs}</span>
                    </p>
                  </div>
                  <button className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <span>Load</span> &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to fetch from CTRI</p>
                <p className="text-xs mt-0.5 text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Success Result Preview */}
          {successResult && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Medicine Trial Successfully Loaded & Activated!</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40 text-xs space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{successResult.title}</p>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1">
                  <div><strong>Protocol ID:</strong> {successResult.protocolId}</div>
                  <div><strong>CTRI ID:</strong> {successResult.ctriNumber}</div>
                  <div><strong>Phase:</strong> {successResult.phase}</div>
                  <div><strong>Formulation:</strong> {successResult.formulation}</div>
                </div>
              </div>
              <button
                onClick={closeFetchModal}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Go to Trial Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strictly read-only source hashing under NDCT 2019 / GCP compliance</span>
          </div>
          <button
            onClick={closeFetchModal}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
