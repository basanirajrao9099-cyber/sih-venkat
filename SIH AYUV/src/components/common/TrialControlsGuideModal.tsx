import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Gamepad2,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Scale,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useTrial } from '../../hooks/useTrialContext';
import { useNavigate } from 'react-router-dom';

interface GuideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const TrialControlsGuideModal: React.FC<GuideModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const navigate = useNavigate();
  const { openFetchModal, isGuideOpen, closeGuide } = useTrial();
  const [currentStep, setCurrentStep] = useState(0);

  const isOpen = propIsOpen !== undefined ? propIsOpen : isGuideOpen;
  const onClose = propOnClose || closeGuide;

  if (!isOpen) return null;

  const steps = [
    {
      id: 'purpose',
      badge: 'Step 1 of 6 · Core Concept',
      title: '🎯 Why Does Ayu-Trial Fabric Exist?',
      subtitle: 'Understanding the problem: Why trial changes require cryptographic governance.',
      icon: <Scale className="w-8 h-8 text-[#2E7D5B]" />,
      content: (
        <div className="space-y-4 text-sm text-[#26352D]">
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl leading-relaxed">
            <p className="font-semibold text-emerald-900 text-base mb-1">
              💊 Clinical Trials are NOT like regular software:
            </p>
            <p className="text-emerald-800">
              When a researcher wants to extend a medicine follow-up visit (e.g., from <strong>Day 31 to Day 35</strong>), they cannot simply edit a database. Under Indian law (<strong>ICMR 2017 & NDCT Rules 2019</strong>), an unverified change will invalidate patient data, cause regulatory audits, or halt the entire clinical trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">❌ The Old Way</span>
              <p className="text-xs text-slate-600">Manual emails, spreadsheets, delayed approvals, and site desynchronization.</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg shadow-sm">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">⚡ The Compiler Way</span>
              <p className="text-xs text-emerald-900">Treats protocol changes like executable code. Validates all legal gates automatically!</p>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">🔒 Merkle Provenance</span>
              <p className="text-xs text-slate-600">Every decision is cryptographically hashed with SHA-256 for instant tamper detection.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'medicines',
      badge: 'Step 2 of 6 · Medicine Controls',
      title: '💊 How to Select & Control Different Medicine Trials',
      subtitle: 'You can monitor multiple Ayurvedic formulations or import real ones from CTRI.',
      icon: <Layers className="w-8 h-8 text-[#2E7D5B]" />,
      content: (
        <div className="space-y-4 text-sm text-[#26352D]">
          <p className="text-slate-600 leading-relaxed">
            Ayu-Trial Fabric allows you to govern multiple clinical trials in parallel. Each medicine trial has its own patient cohort, protocol schedule, and participating research hospitals.
          </p>

          <div className="space-y-2.5">
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">1</span>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Use the Top Navbar Dropdown</h4>
                  <p className="text-xs text-slate-500">Switch between Ashwagandha, AYUSH-64, Curcumin, Triphala, and Brahmi trials anytime.</p>
                </div>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-mono">Top Header</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">2</span>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Fetch Real Trials from CTRI (Internet)</h4>
                  <p className="text-xs text-slate-500">Import live public clinical trial records directly from the Clinical Trials Registry - India (ctri.nic.in).</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  openFetchModal();
                }}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                Fetch CTRI Now
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'changes',
      badge: 'Step 3 of 6 · What Changes Can You Make?',
      title: '📝 What Changes (ChangeSets) Can You Create?',
      subtitle: 'Protocol amendments are drafted as atomic, version-controlled ChangeSets.',
      icon: <FileSpreadsheet className="w-8 h-8 text-[#2E7D5B]" />,
      content: (
        <div className="space-y-3 text-sm text-[#26352D]">
          <p className="text-slate-600">
            A <strong>ChangeSet</strong> is a formal proposal to modify any aspect of a clinical trial protocol:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="font-semibold text-xs text-slate-900 block mb-0.5">📅 Visit Schedules & Windows</span>
              <p className="text-xs text-slate-600">e.g. Shifting Visit 4 follow-up from Day 25–31 to Day 25–35.</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="font-semibold text-xs text-slate-900 block mb-0.5">💊 Medicine Formulation / Dose</span>
              <p className="text-xs text-slate-600">e.g. Changing tablet frequency or adding an adjunct formulation.</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="font-semibold text-xs text-slate-900 block mb-0.5">🏥 Adding / Removing Centers</span>
              <p className="text-xs text-slate-600">e.g. Onboarding AIIA New Delhi, NIA Jaipur, or IPGT Jamnagar.</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="font-semibold text-xs text-slate-900 block mb-0.5">👥 Target Patient Cohort</span>
              <p className="text-xs text-slate-600">e.g. Expanding sample size or modifying inclusion/exclusion criteria.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'pipeline',
      badge: 'Step 4 of 6 · The 7-Step Compiler',
      title: '🛑 How Changes Are Evaluated & Why They Fail',
      subtitle: 'The compiler halts with BUILD FAILED until all legal obligations have verified evidence.',
      icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
      content: (
        <div className="space-y-3 text-sm text-[#26352D]">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <strong>The Golden Rule:</strong> When you click <em>"Run Governance Compile"</em>, the engine checks 10 Indian statutory rules. If any rule lacks proof, the status locks to <strong>BLOCKED</strong> (BUILD FAILED).
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="p-2 bg-slate-100 rounded-lg flex items-center justify-between">
              <span>1. Draft ChangeSet (CS-0001)</span>
              <span className="text-emerald-700 font-bold">SUBMITTED</span>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg flex items-center justify-between">
              <span>2. Blast Radius Resolution</span>
              <span className="text-blue-700 font-bold">13 Nodes Impacted</span>
            </div>
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <span>3. Initial Compilation (CMP-000128)</span>
              <span className="text-red-700 font-bold">BUILD FAILED (3 Blockers)</span>
            </div>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <span>4. Evidence Verification & Recompile</span>
              <span className="text-emerald-700 font-bold">BUILD PASSED (READY)</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'files-and-permissions',
      badge: 'Step 5 of 6 · Required Files & Permissions',
      title: '📑 What Files You Need & Whose Permission',
      subtitle: 'Clear role-based breakdown for resolving each blocker finding.',
      icon: <UserCheck className="w-8 h-8 text-[#2E7D5B]" />,
      content: (
        <div className="space-y-3 text-sm text-[#26352D]">
          <div className="grid grid-cols-1 gap-2.5">
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-800 shrink-0 font-bold text-xs">F-001</div>
              <div>
                <h4 className="font-semibold text-xs text-slate-900">IEC Ethics Committee Notification</h4>
                <p className="text-xs text-slate-500 mt-0.5"><strong>File Needed:</strong> Institutional Ethics Committee Notification Receipt (PDF with SHA-256 hash).</p>
                <p className="text-xs text-purple-700 mt-0.5"><strong>Whose Permission:</strong> Ethics Reviewer / IEC Chair approval.</p>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-800 shrink-0 font-bold text-xs">F-002</div>
              <div>
                <h4 className="font-semibold text-xs text-slate-900">Informed Consent Form (ICF) Addendum</h4>
                <p className="text-xs text-slate-500 mt-0.5"><strong>File Needed:</strong> Revised patient consent addendum sheet.</p>
                <p className="text-xs text-blue-700 mt-0.5"><strong>Whose Permission:</strong> Lead Principal Investigator (PI).</p>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 font-bold text-xs">F-003</div>
              <div>
                <h4 className="font-semibold text-xs text-slate-900">CRC Site Retraining Record</h4>
                <p className="text-xs text-slate-500 mt-0.5"><strong>File Needed:</strong> Clinical Research Coordinator (CRC) training log across all 3 research hospitals.</p>
                <p className="text-xs text-amber-800 mt-0.5"><strong>Whose Permission:</strong> Clinical Monitor (CRA) sign-off.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'workflow-summary',
      badge: 'Step 6 of 6 · Ready to Go!',
      title: '🚀 Your 3-Minute Quick Action Guide',
      subtitle: 'Summary of how to navigate and demonstrate the application.',
      icon: <Sparkles className="w-8 h-8 text-[#2E7D5B]" />,
      content: (
        <div className="space-y-4 text-sm text-[#26352D]">
          <div className="p-4 bg-emerald-950 text-white rounded-xl space-y-2">
            <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" /> Ready to try it? Follow these 4 clicks:
            </h4>
            <ol className="text-xs text-slate-200 space-y-1.5 list-decimal list-inside">
              <li>Open <strong>Compiler</strong> from the sidebar (`/compiler`).</li>
              <li>Click <strong>"Run Governance Compile"</strong> $\rightarrow$ Watch it halt on <strong>BUILD FAILED</strong>.</li>
              <li>Click <strong>"ADD EVIDENCE"</strong> on EVD-01, 02, and 03 to upload the proof.</li>
              <li>Click <strong>"Recompile Package"</strong> $\rightarrow$ Screen turns green: <strong>BUILD PASSED</strong>!</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                navigate('/compiler');
              }}
              className="flex-1 bg-[#2E7D5B] hover:bg-[#24664A] text-white py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              Go to Governance Compiler
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/demo');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 px-4 rounded-xl font-medium text-xs transition-colors"
            >
              Live Demo Wizard
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF9F4] border border-slate-300 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Gamepad2 className="w-6 h-6 text-[#2E7D5B]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D5B] block">
                Interactive Control & Purpose Walkthrough
              </span>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {steps[currentStep].title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">{steps[currentStep].badge}</span>
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 bg-[#2E7D5B]'
                    : idx < currentStep
                    ? 'w-2 bg-emerald-300'
                    : 'w-2 bg-slate-300'
                }`}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs text-slate-500 font-medium">{steps[currentStep].subtitle}</p>
          {steps[currentStep].content}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Skip Tour
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2E7D5B] hover:bg-[#24664A] text-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                Next Step
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Got It! Close Guide
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
