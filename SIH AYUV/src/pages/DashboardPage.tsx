import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Users,
  Calendar,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Award,
  BookOpen,
  Sparkles,
  UserCheck,
  Stethoscope,
  Gamepad2,
  Globe,
  FileText,
  Lock,
  Layers,
  Check,
  HelpCircle,
  Beaker,
  AlertTriangle,
  FileSpreadsheet,
  Cpu,
} from 'lucide-react';
import { compilerService, EvidenceItem, Finding, ReadinessSummary } from '../services/compilerService';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { useTrial } from '../hooks/useTrialContext';
import { ReadinessDetailsModal } from '../components/common/ReadinessDetailsModal';
import { ChangeSetRecord, getStoredChangeSets } from '../data/changesets';
import { TrialSwitcherDropdown } from '../components/common/TrialSwitcherDropdown';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const { selectedTrial, openGuide, openFetchModal } = useTrial();

  const isPI = currentUser.role === 'Principal Investigator';
  const isEthics = currentUser.role === 'Ethics Reviewer';
  const isCRA = currentUser.role === 'Monitor';
  const isAdmin = currentUser.role === 'Admin';

  const [readiness, setReadiness] = useState<ReadinessSummary>(compilerService.getReadiness());
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(compilerService.getInitialEvidence());
  const [findings, setFindings] = useState<Finding[]>(compilerService.getInitialFindings());
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [activeCS, setActiveCS] = useState<ChangeSetRecord | null>(null);
  const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [csList, rData, eData, fData, aData] = await Promise.all([
          compilerService.fetchChangeSets(),
          compilerService.fetchReadiness('CS-0001'),
          compilerService.fetchEvidence('CS-0001'),
          compilerService.fetchFindings('CS-0001'),
          compilerService.fetchAuditTrail('CS-0001'),
        ]);

        if (Array.isArray(csList) && csList.length > 0) {
          setActiveCS(csList[0]);
        } else {
          const stored = getStoredChangeSets();
          if (stored.length > 0) setActiveCS(stored[0]);
        }

        if (rData) setReadiness(rData);
        if (eData) setEvidenceList(eData);
        if (fData) setFindings(fData);
        if (Array.isArray(aData) && aData.length > 0) {
          setAuditEvents([...aData].reverse().slice(0, 4));
        } else {
          setAuditEvents([]);
        }
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [selectedTrial.id]);

  const isCertifiedReady = readiness.status === 'READY';
  const isReady = isCertifiedReady;
  const blockingCount = isReady ? 0 : readiness.blockingFindings;
  const missingEvidenceCount = evidenceList.filter(
    (e) => e.status !== 'VERIFIED' && e.id !== 'EVD-04'
  ).length;

  const remainingCount =
    readiness.remainingRequirementsCount !== undefined
      ? readiness.remainingRequirementsCount
      : isCertifiedReady
      ? 0
      : Math.max(missingEvidenceCount, readiness.blockingFindings);

  const allGovernanceChecksCompleted =
    missingEvidenceCount === 0 && (readiness.blockingFindings === 0 || isCertifiedReady);

  // Dynamic status and next action derived from actual backend changeset state
  const csStatus = activeCS?.status || 'Draft';
  const isCsDraft = csStatus === 'Draft' || csStatus === 'DRAFT';
  const isCsImpactAnalyzed = csStatus === 'Impact analyzed';

  // Role-specific Next Actions
  let readinessDisplayTag = 'NOT READY';
  let nextActionLabel = 'Resolve requirements →';
  let nextActionRoute = '/compiler';
  let nextActionDesc = `${remainingCount} requirement${remainingCount === 1 ? '' : 's'} remain.`;

  if (isEthics) {
    readinessDisplayTag = 'IN REVIEW';
    nextActionLabel = 'Review pending evidence dossiers →';
    nextActionRoute = '/compiler';
    nextActionDesc = `${missingEvidenceCount > 0 ? missingEvidenceCount : 2} regulatory review items require committee decision.`;
  } else if (isCRA) {
    readinessDisplayTag = 'MONITORING ACTIVE';
    nextActionLabel = 'Verify site training logs →';
    nextActionRoute = '/compiler';
    nextActionDesc = 'Site training logs across centers require CRA sign-off.';
  } else if (isCsDraft) {
    readinessDisplayTag = 'DRAFT';
    nextActionLabel = 'Run impact analysis →';
    nextActionRoute = '/changesets';
    nextActionDesc = `Amendment ${activeCS?.id || 'CS-0001'} is saved as draft. Run impact analysis to evaluate affected sites and cohort.`;
  } else if (isCertifiedReady) {
    readinessDisplayTag = 'READY';
    nextActionLabel = 'Prepare implementation →';
    nextActionRoute = '/compiler';
    nextActionDesc = 'All required governance checks have been completed.';
  } else if (allGovernanceChecksCompleted) {
    readinessDisplayTag = 'READY FOR IMPLEMENTATION';
    nextActionLabel = 'Validate amendment →';
    nextActionRoute = '/compiler';
    nextActionDesc = 'All required governance checks have been completed.';
  } else if (isCsImpactAnalyzed) {
    readinessDisplayTag = 'IMPACT ANALYZED';
    nextActionLabel = 'Review requirements →';
    nextActionRoute = `/compiler?changeSetId=${encodeURIComponent(activeCS?.id || 'CS-0001')}`;
    nextActionDesc = `Impact analysis completed. Resolve ${remainingCount} remaining statutory requirements.`;
  } else {
    readinessDisplayTag = 'REQUIREMENTS IN PROGRESS';
    nextActionLabel = 'Resolve requirements →';
    nextActionRoute = '/compiler';
    nextActionDesc = `${remainingCount} requirement${remainingCount === 1 ? '' : 's'} remain.`;
  }

  // Steppers tailored per role
  const piSteps = [
    { name: 'Draft', route: '/changesets', isCompleted: true, isCurrent: isCsDraft },
    { name: 'Impact', route: '/impact', isCompleted: !isCsDraft, isCurrent: isCsImpactAnalyzed },
    {
      name: 'Resolve',
      route: '/compiler',
      isCompleted: isCertifiedReady,
      isCurrent: !isCertifiedReady && !isCsDraft && missingEvidenceCount > 0,
    },
    {
      name: 'Evidence',
      route: '/compiler',
      isCompleted: isCertifiedReady || missingEvidenceCount === 0,
      isCurrent: !isCertifiedReady && !isCsDraft && missingEvidenceCount === 0,
    },
    { name: 'Review', route: '/ethics', isCompleted: isCertifiedReady, isCurrent: false },
    { name: 'Ready', route: '/compiler', isCompleted: isCertifiedReady, isCurrent: false },
  ];

  const ethicsSteps = [
    { name: 'Submission', route: '/compiler', isCompleted: true, isCurrent: false },
    { name: 'IEC Review', route: '/compiler', isCompleted: isCertifiedReady, isCurrent: !isCertifiedReady },
    { name: 'Findings', route: '/ethics', isCompleted: isCertifiedReady, isCurrent: false },
    { name: 'Clearance', route: '/compiler', isCompleted: isCertifiedReady, isCurrent: false },
  ];

  const craSteps = [
    { name: 'Briefing', route: '/sites', isCompleted: true, isCurrent: false },
    { name: 'Site Training', route: '/compiler', isCompleted: isCertifiedReady, isCurrent: !isCertifiedReady },
    { name: 'Logs Verified', route: '/compiler', isCompleted: isCertifiedReady, isCurrent: false },
    { name: 'Rollout', route: '/sites', isCompleted: isCertifiedReady, isCurrent: false },
  ];

  const activeSteps = isEthics ? ethicsSteps : isCRA ? craSteps : piSteps;

  const handleStepClick = (step: (typeof activeSteps)[0]) => {
    if (step.name === 'Ready' && !isCertifiedReady) {
      showToast(
        'Readiness Locked',
        `${remainingCount} requirements remain before this amendment can be certified`,
        'warning'
      );
      return;
    }
    navigate(step.route);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* 0. GAME-LIKE ONBOARDING BANNER & CONTROLS HELPER */}
      <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-emerald-500/30 overflow-hidden relative">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] tracking-wider uppercase border border-emerald-500/30 flex items-center gap-1">
                <Gamepad2 className="w-3 h-3" />
                Interactive Game Guide & Controls Demo
              </span>
              <span className="text-xs text-slate-300">• New to Ayu-Trial Fabric?</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              What is Ayu-Trial Fabric & How Do You Control Medicine Trials?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Whenever a trial protocol changes (visit windows, dosage, safety bounds), changes cannot simply be applied blindly.
              You must follow a <strong>6-stage regulatory pipeline</strong>, attach required statutory evidence, and receive
              cryptographic multi-role approval signatures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={openGuide}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 hover:scale-[1.02] cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4 animate-bounce" />
              <span>Launch Controls Demo</span>
            </button>
            <button
              onClick={openFetchModal}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-emerald-300" />
              <span>+ Fetch Medicines from Web</span>
            </button>
          </div>
        </div>
      </section>

      {/* 1. DYNAMIC ACTIVE MEDICINE TRIAL OVERVIEW BANNER */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#1E4D38] bg-[#EAF4EF] px-2.5 py-0.5 rounded border border-[#C5DFD2]">
                {selectedTrial.protocolId}
              </span>
              <span className="text-xs text-[#5C6B62] font-semibold">• {selectedTrial.phase}</span>
              {selectedTrial.ctriNumber && (
                <span className="text-xs font-mono text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  CTRI: {selectedTrial.ctriNumber}
                </span>
              )}
              <span className="text-xs text-[#5C6B62]">
                {selectedTrial.activeSites || 3} Apex Research Centers · {selectedTrial.targetEnrollment || 140} Subjects
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E2922]">
              {selectedTrial.title}
            </h1>
            <p className="text-xs text-[#5C6B62] leading-relaxed max-w-2xl">
              <strong>Formulation:</strong> {selectedTrial.formulation} — <em>{selectedTrial.indication}</em>
            </p>
            <p className="text-[11px] text-slate-500">
              <strong>Lead Investigator / Sponsor:</strong> {selectedTrial.piName || 'Prof. Dr. Anandita Sharma'} • {selectedTrial.sponsor}
            </p>
          </div>

          {/* Active Amendment & Readiness Gate Widget */}
          <div className="p-3.5 bg-[#FAF9F4] border border-[#E2DFD6] rounded-lg text-xs space-y-1.5 text-left shrink-0 min-w-[220px]">
            <button
              onClick={() => navigate(isEthics ? '/compiler' : isCRA ? '/sites' : '/changesets')}
              className="w-full text-left group cursor-pointer"
              title="Click to open active workspace"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#5C6B62] uppercase tracking-wider block">
                  {isEthics ? 'Review Target' : isCRA ? 'Monitoring Focus' : 'Active Amendment'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#5C6B62] group-hover:text-[#1E4D38] group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="font-bold text-[#1E2922] group-hover:text-[#1E4D38] transition-colors">
                {activeCS?.title || activeCS?.type || 'Visit 4 Schedule Change'}
              </p>
              <span className="text-[10px] font-mono text-[#5C6B62]">
                {activeCS?.id || 'CS-0001'}
              </span>
            </button>

            {/* Clickable Readiness Gate Trigger */}
            <button
              onClick={() => setIsReadinessModalOpen(true)}
              className="flex items-center gap-1.5 pt-1 hover:underline cursor-pointer border-t border-slate-200 w-full"
              title="Click to view readiness gate details"
            >
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  isCertifiedReady
                    ? 'bg-[#1E4D38]'
                    : allGovernanceChecksCompleted
                    ? 'bg-[#5E826F]'
                    : isCsDraft
                    ? 'bg-amber-500'
                    : 'bg-amber-600'
                }`}
              />
              <span
                className={`text-xs font-semibold ${
                  isCertifiedReady
                    ? 'text-[#1E4D38]'
                    : allGovernanceChecksCompleted
                    ? 'text-[#1E4D38]'
                    : 'text-amber-800'
                }`}
              >
                {readinessDisplayTag}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. BIG & CLEAR INDICATION: HOW TO CONTROL MEDICINE TRIALS & APPROVAL AUDIT CENTER */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="border-b border-[#E8E5DC] pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-[#1E2922] uppercase tracking-wide font-mono">
              Medicine Protocol Control & Approval Verification Center
            </h2>
          </div>
          <p className="text-xs text-[#5C6B62] mt-1">
            Clear explanation of what changes can be made, statutory procedures, required files, and approver permissions.
          </p>
        </div>

        {/* 4 Essential Control Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: What Changes You Can Make */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              <Beaker className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">1. What You Can Change</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li><strong>Visit Windows:</strong> Extend or shrink visit days (e.g. Day 25–31 &rarr; Day 25–35).</li>
              <li><strong>Herbal Formulations:</strong> Dosage timing & extract purity specs.</li>
              <li><strong>Lab Biomarkers:</strong> Liver LFT & kidney KFT cutoff safety bounds.</li>
              <li><strong>Inclusion Criteria:</strong> Age ranges and symptom severity thresholds.</li>
            </ul>
          </div>

          {/* Card 2: Procedure You Must Follow */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Procedure to Follow</h3>
            <ol className="text-xs text-slate-600 space-y-1 font-medium">
              <li><span className="font-bold text-emerald-700">1. Draft:</span> Define protocol parameter diff.</li>
              <li><span className="font-bold text-emerald-700">2. Impact:</span> Cohort impact analysis.</li>
              <li><span className="font-bold text-emerald-700">3. Resolve:</span> Fix rule violations.</li>
              <li><span className="font-bold text-emerald-700">4. Evidence:</span> Upload regulatory dossiers.</li>
              <li><span className="font-bold text-emerald-700">5. Signatures:</span> PI + Ethics + CRA sign-off.</li>
              <li><span className="font-bold text-emerald-700">6. Execute:</span> Lock with Merkle hash.</li>
            </ol>
          </div>

          {/* Card 3: Files You Need */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">3. Files Required</h3>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>EVD-01:</strong> IEC Notification Dossier (NDCT 2019 Rule 26)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>EVD-02:</strong> Patient Consent Addendum v1.1 (ICMR 2017)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>EVD-03:</strong> Site CRC Retraining Sign-off Log</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Whose Permission Is Needed */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">4. Approvers Needed</h3>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li className="p-1 rounded bg-white border border-slate-200">
                <span className="font-bold text-slate-800 block text-[11px]">Lead PI (Prof. Dr. Sharma)</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Protocol Sign-off</span>
              </li>
              <li className="p-1 rounded bg-white border border-slate-200">
                <span className="font-bold text-slate-800 block text-[11px]">Ethics Chair (Dr. Kulkarni)</span>
                <span className="text-[10px] text-amber-700 font-semibold">Expedited Ethics Clearance</span>
              </li>
              <li className="p-1 rounded bg-white border border-slate-200">
                <span className="font-bold text-slate-800 block text-[11px]">CRA Monitor (Priya Nair)</span>
                <span className="text-[10px] text-sky-700 font-semibold">Site Readiness Verification</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Live Before vs After & Cryptographic Verification Indicator */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 font-mono">
                Live Change Verification (Active Amendment CS-0001)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900 font-bold">
              SHA-256 Merkle Chain Integrity: VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Previous (Baseline)</span>
              <p className="font-bold text-red-700 line-through mt-0.5">Visit 4 Window: Day 25–31</p>
              <p className="text-[11px] text-slate-500 mt-1">Causes 7 participant dropouts due to narrow window.</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Proposed (Amended)</span>
              <p className="font-bold text-emerald-700 mt-0.5">Visit 4 Window: Day 25–35 (+4 Days)</p>
              <p className="text-[11px] text-slate-500 mt-1">Rescues 100% of participants without protocol breach.</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Approval Signatures</span>
                <p className="font-semibold text-slate-800 text-[11px] mt-0.5">
                  {isCertifiedReady ? '✅ 3 of 3 Roles Approved' : '⏳ 2 of 3 Signatures Completed'}
                </p>
              </div>
              <button
                onClick={() => navigate('/compiler')}
                className="mt-2 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline text-left cursor-pointer"
              >
                Inspect full verification audit trail &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NEXT ACTION & WORKSPACE PROGRESS */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E5DC] pb-5">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono">
              Next Action
            </span>
            <p className="text-sm font-semibold text-[#1E2922]">
              {nextActionDesc}
            </p>
          </div>

          {/* Dynamic Next Action CTA */}
          <button
            onClick={() => navigate(nextActionRoute)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span>{nextActionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Progress Stepper */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono">
              {isEthics ? 'Ethics Review Progression' : isCRA ? 'Site Readiness Stages' : 'Amendment Progress'}
            </span>
            <span className="text-[11px] text-[#5C6B62]">Click any step to view details</span>
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-${activeSteps.length} gap-2 pt-1`}>
            {activeSteps.map((step, idx) => (
              <button
                key={step.name}
                onClick={() => handleStepClick(step)}
                className={`p-3 rounded-lg border text-center transition-all hover:scale-[1.02] cursor-pointer text-left ${
                  step.isCurrent
                    ? 'bg-[#FAF9F4] border-[#1E4D38] ring-1 ring-[#1E4D38]'
                    : step.isCompleted
                    ? 'bg-[#EAF4EF] border-[#C5DFD2] text-[#1E4D38]'
                    : 'bg-[#FAF9F4] border-[#E8E5DC] text-[#8C9B91] hover:border-[#B8B3A6]'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1E4D38]" />
                  ) : step.isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-[#1E4D38]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#8C9B91]/40" />
                  )}
                  <span className="text-[10px] font-mono font-bold">0{idx + 1}</span>
                </div>
                <span className="text-xs font-semibold block text-center">{step.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHAT NEEDS YOUR ATTENTION (Persona Tasks) */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E5DC] pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E2922] font-mono">
              {isEthics
                ? 'Reviews Awaiting Decision'
                : isCRA
                ? 'Operational Monitoring Tasks'
                : 'What Needs Your Attention'}
            </h2>
            <p className="text-xs text-[#5C6B62] mt-0.5">
              {isEthics
                ? 'Regulatory submissions requiring Institutional Ethics Committee vote or sign-off'
                : isCRA
                ? 'Clinical research center operational briefing and training verifications'
                : 'Action items required for regulatory certification'}
            </p>
          </div>
          <span className="text-xs font-semibold text-[#5C6B62]">
            {isReady ? '0 pending items' : `${blockingCount} pending items`}
          </span>
        </div>

        <div className="divide-y divide-[#E8E5DC]">
          {isEthics ? (
            <>
              {/* Ethics Task 1 */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E2922]">IEC notification dossier (EVD-01)</span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Review Pending
                    </span>
                  </div>
                  <p className="text-xs text-[#5C6B62]">
                    ChangeSet CS-0001 schedule modification requires formal IEC expedited acknowledgment.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/compiler')}
                  className="px-4 py-1.5 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  Review evidence
                </button>
              </div>

              {/* Ethics Task 2 */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E2922]">Informed Consent Addendum v1.1 (EVD-02)</span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Review Pending
                    </span>
                  </div>
                  <p className="text-xs text-[#5C6B62]">
                    Patient Information Sheet addendum for active participants under ICMR 2017.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/compiler')}
                  className="px-4 py-1.5 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  Review evidence
                </button>
              </div>
            </>
          ) : isCRA ? (
            <>
              {/* CRA Task 1 */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E2922]">Site CRC Retraining Logs (EVD-03)</span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Sign-off Required
                    </span>
                  </div>
                  <p className="text-xs text-[#5C6B62]">
                    Multi-center training sign-offs across research centers.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/compiler')}
                  className="px-4 py-1.5 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  Verify training
                </button>
              </div>
            </>
          ) : (
            <>
              {/* PI Task 1: IEC Notification */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E2922]">IEC notification dossier</span>
                    {isReady ? (
                      <span className="text-[10px] font-semibold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2]">
                        Approved
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5C6B62]">
                    Required before clinical implementation under NDCT 2019 Rule 26
                  </p>
                </div>
                <button
                  onClick={() => navigate('/compiler')}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E2DFD6] hover:bg-[#FAF9F4] text-xs font-semibold text-[#1E2922] transition-colors shrink-0 cursor-pointer"
                >
                  {isReady ? 'View record' : 'Review & Upload'}
                </button>
              </div>

              {/* PI Task 2: Site Retraining */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E2922]">Site retraining records</span>
                    {isReady ? (
                      <span className="text-[10px] font-semibold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2]">
                        3 of 3 completed
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        2 of 3 completed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5C6B62]">
                    CRC visit-window operational briefing sign-offs across centers
                  </p>
                </div>
                <button
                  onClick={() => navigate('/sites')}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E2DFD6] hover:bg-[#FAF9F4] text-xs font-semibold text-[#1E2922] transition-colors shrink-0 cursor-pointer"
                >
                  View sites
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 5. IMPACT SUMMARY & 6. RECENT ACTIVITY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IMPACT SUMMARY */}
        <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono">
              {isEthics ? 'Ethics Impact Scope' : isCRA ? 'Site Operational Scope' : 'Impact Summary'}
            </span>
            <p className="text-base font-bold text-[#1E2922]">
              {selectedTrial.activeSites || 3} sites · {selectedTrial.targetEnrollment || 140} participants · 1 visit · 1 CRF
            </p>
            <p className="text-xs text-[#5C6B62] leading-relaxed">
              {isEthics
                ? 'Amendment affects Visit 4 window across active participants requiring ethics notification and consent addendum.'
                : isCRA
                ? 'Visit tolerance bounds updated across study centers requiring CRC re-briefing.'
                : 'This amendment affects visit windows and assessment schedules for ongoing participant cohorts.'}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/impact')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4D38] hover:text-[#163B2B] hover:underline cursor-pointer"
            >
              <span>View detailed impact</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* RECENT CLINICAL ACTIVITY */}
        <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8E5DC] pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono">
                Recent Audit Trail Activity
              </span>
              <Clock className="w-3.5 h-3.5 text-[#5C6B62]" />
            </div>

            <div className="space-y-2.5 pt-1">
              {auditEvents.length > 0 ? (
                auditEvents.map((act) => (
                  <button
                    key={act.id}
                    onClick={() => navigate('/changesets')}
                    className="w-full text-left space-y-0.5 hover:bg-[#FAF9F4] p-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#1E2922] group-hover:text-[#1E4D38] truncate transition-colors">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-[#8C9B91] shrink-0 font-medium font-mono">
                        {act.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C6B62] leading-tight truncate">
                      {act.description || act.why || act.what}
                    </p>
                  </button>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-[#5C6B62]">
                  No recent audit activity recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8E5DC]">
            <button
              onClick={() => navigate('/changesets')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4D38] hover:text-[#163B2B] hover:underline cursor-pointer"
            >
              <span>View full timeline</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>

      {/* READINESS DETAILS DRAWER/MODAL */}
      <ReadinessDetailsModal
        isOpen={isReadinessModalOpen}
        onClose={() => setIsReadinessModalOpen(false)}
        readiness={readiness}
        evidenceList={evidenceList}
        findings={findings}
      />
    </div>
  );
};
