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
import { ClinicalTrial } from '../types/trial';

interface TrialAmendmentContext {
  id: string;
  title: string;
  previous: string;
  proposed: string;
  changeReason: string;
  piName: string;
  leadSite: string;
  sitesCount: number;
  participantsCount: number;
  tasks: Array<{
    id: string;
    name: string;
    status: string;
    statusType: 'required' | 'progress' | 'pending' | 'approved';
    desc: string;
    btnText: string;
    route: string;
  }>;
  recentAudits: Array<{
    id: string;
    title: string;
    timestamp: string;
    description: string;
  }>;
}

const getTrialAmendmentContext = (trial: ClinicalTrial): TrialAmendmentContext => {
  const pid = trial.protocolId || '';
  const title = trial.title || '';

  if (pid.includes('088') || title.includes('AYUSH-64')) {
    return {
      id: 'CS-0002',
      title: 'AYUSH-64 Dosage & Post-Meal Intake Optimization',
      previous: 'AYUSH-64: 500mg 2x/day (BD)',
      proposed: 'AYUSH-64: 500mg 3x/day (TDS) Post-Meal (+1 Dose)',
      changeReason: 'Optimizes anti-inflammatory bioavailability for moderate Amavata patients.',
      piName: trial.piName || 'Dr. Devendra Triguna',
      leadSite: 'National Institute of Ayurveda (NIA), Jaipur',
      sitesCount: trial.activeSites || 5,
      participantsCount: trial.targetEnrollment || 180,
      tasks: [
        {
          id: 'task-1',
          name: 'Drug Safety Monitoring Board (DSMB) Dosage Clearance',
          status: 'Required',
          statusType: 'required',
          desc: 'Pharmacovigilance sign-off for TDS 500mg daily regimen under NDCT 2019 Rule 26',
          btnText: 'Review & Upload',
          route: '/compiler',
        },
        {
          id: 'task-2',
          name: 'ACR-20 Amavata eCRF Modification',
          status: '2 of 5 completed',
          statusType: 'progress',
          desc: 'Joint swelling and morning stiffness assessment window update across 5 hospitals',
          btnText: 'View sites',
          route: '/sites',
        },
        {
          id: 'task-3',
          name: 'Patient Dosage Counseling Addendum',
          status: 'Awaiting verification',
          statusType: 'pending',
          desc: 'Patient instruction leaflet update for 180 active enrolled participants',
          btnText: 'View evidence',
          route: '/compiler',
        },
      ],
      recentAudits: [
        { id: 'act-1', title: 'AYUSH-64 Dose Amendment Drafted (CS-0002)', timestamp: '10m ago', description: 'Proposed 500mg TDS dose escalation across 5 centers' },
        { id: 'act-2', title: 'NIA Jaipur Site Operational Audit', timestamp: '1h ago', description: 'Center verified active cohort of 36 participants' },
        { id: 'act-3', title: 'DSMB Safety Review Initiated', timestamp: '4h ago', description: 'Central regulatory dossier submitted for expedited vote' },
      ],
    };
  }

  if (pid.includes('105') || title.includes('Curcumin')) {
    return {
      id: 'CS-0003',
      title: 'WOMAC Score & Inclusion Age Expansion (45–75 yrs)',
      previous: 'Age: 50–65 yrs (WOMAC > 50)',
      proposed: 'Age: 45–75 yrs (WOMAC > 40) Expanded Inclusion',
      changeReason: 'Broadens real-world accessibility and accelerates participant accrual.',
      piName: trial.piName || 'Prof. Sanjeev Sharma',
      leadSite: 'Institute of Post Graduate Teaching & Research in Ayurveda, Jamnagar',
      sitesCount: trial.activeSites || 6,
      participantsCount: trial.targetEnrollment || 240,
      tasks: [
        {
          id: 'task-1',
          name: 'Institutional Ethics Board Age Expansion Dossier',
          status: 'Required',
          statusType: 'required',
          desc: 'Fast-track ethics clearance for expanded age bracket under ICMR 2017 standards',
          btnText: 'Review & Upload',
          route: '/compiler',
        },
        {
          id: 'task-2',
          name: 'Investigator Site Screening Calibration',
          status: '3 of 6 completed',
          statusType: 'progress',
          desc: 'WOMAC index scoring harmonization across 6 participating orthopedic centers',
          btnText: 'View sites',
          route: '/sites',
        },
        {
          id: 'task-3',
          name: 'Informed Consent Form (ICF v1.2)',
          status: 'Awaiting verification',
          statusType: 'pending',
          desc: 'Updated vernacular language consent sheets for expanded cohort',
          btnText: 'View evidence',
          route: '/compiler',
        },
      ],
      recentAudits: [
        { id: 'act-1', title: 'Inclusion Criteria Amendment CS-0003 Created', timestamp: '15m ago', description: 'Age range widened to 45–75 yrs with WOMAC threshold 40' },
        { id: 'act-2', title: 'IPGTRA Jamnagar Ethics Review', timestamp: '2h ago', description: 'Institutional board dossier logged' },
        { id: 'act-3', title: 'Orthopedic Biomarker Panel Verification', timestamp: '5h ago', description: 'Cartilage imaging SOP synchronized' },
      ],
    };
  }

  if (pid.includes('121') || title.includes('Triphala')) {
    return {
      id: 'CS-0004',
      title: 'HbA1c & LFT Safety Diagnostic Window Adjustment',
      previous: 'Testing Window: Every 30 Days (±2d)',
      proposed: 'Testing Window: 45-Day Flex Schedule (±5d)',
      changeReason: 'Accommodates multi-center lab processing without protocol breach.',
      piName: trial.piName || 'Dr. Vaidya K.S. Dhiman',
      leadSite: 'Central Ayurveda Research Institute (CARI), Bengaluru',
      sitesCount: trial.activeSites || 10,
      participantsCount: trial.targetEnrollment || 400,
      tasks: [
        {
          id: 'task-1',
          name: 'NABL Central Lab SOP Addendum',
          status: 'Required',
          statusType: 'required',
          desc: 'Quality assurance protocol for extended metabolic sample analysis',
          btnText: 'Review & Upload',
          route: '/compiler',
        },
        {
          id: 'task-2',
          name: 'Site Phlebotomy & CRC Briefings',
          status: '7 of 10 completed',
          statusType: 'progress',
          desc: 'Blood draw and fasting glucose synchronization across 10 centers',
          btnText: 'View sites',
          route: '/sites',
        },
        {
          id: 'task-3',
          name: 'Patient Visit Schedule Card v2.0',
          status: 'Awaiting verification',
          statusType: 'pending',
          desc: 'Distributed to 400 enrolled Type 2 Diabetes participants',
          btnText: 'View evidence',
          route: '/compiler',
        },
      ],
      recentAudits: [
        { id: 'act-1', title: 'Lab Diagnostic Window Shift CS-0004', timestamp: '20m ago', description: 'Shifted sample window to 45 days' },
        { id: 'act-2', title: 'CARI Bengaluru Site Sign-off', timestamp: '3h ago', description: 'Lead center finalized operational schedule' },
      ],
    };
  }

  if (pid.includes('149') || title.includes('Brahmi')) {
    return {
      id: 'CS-0005',
      title: 'Shirodhara Procedure Session Duration Flexibility',
      previous: 'Procedure Duration: Strict 45 mins',
      proposed: 'Procedure Duration: 40–50 mins Tolerant Window',
      changeReason: 'Allows therapist calibration for autonomic nervous system stabilization.',
      piName: trial.piName || 'Dr. B.R. Ramakrishna',
      leadSite: 'NIMHANS Integrative Medicine Unit, Bengaluru',
      sitesCount: trial.activeSites || 3,
      participantsCount: trial.targetEnrollment || 120,
      tasks: [
        {
          id: 'task-1',
          name: 'Panchakarma Protocol SOP Certification',
          status: 'Required',
          statusType: 'required',
          desc: 'Standard operating procedure sign-off for continuous Brahmi Taila flow',
          btnText: 'Review & Upload',
          route: '/compiler',
        },
        {
          id: 'task-2',
          name: 'Therapist Calibration Sign-offs',
          status: '2 of 3 completed',
          statusType: 'progress',
          desc: 'HAM-A anxiety score evaluation synchronization across centers',
          btnText: 'View sites',
          route: '/sites',
        },
        {
          id: 'task-3',
          name: 'Subject Relaxation Diary Update',
          status: 'Awaiting verification',
          statusType: 'pending',
          desc: 'Home compliance logs for 120 enrolled subjects',
          btnText: 'View evidence',
          route: '/compiler',
        },
      ],
      recentAudits: [
        { id: 'act-1', title: 'Shirodhara Procedure Change CS-0005', timestamp: '25m ago', description: 'Session duration window adjusted to 40-50m' },
        { id: 'act-2', title: 'NIMHANS Ethics Initial Submission', timestamp: '5h ago', description: 'Expedited review dossier logged' },
      ],
    };
  }

  // Default Ashwagandha / Standard
  return {
    id: 'CS-0001',
    title: 'Visit 4 Schedule & Window Modification',
    previous: 'Visit 4 Window: Day 25–31',
    proposed: 'Visit 4 Window: Day 25–35 (+4 Days)',
    changeReason: 'Rescues 100% of participants from protocol dropout due to holiday transit.',
    piName: trial.piName || 'Prof. Dr. Anandita Sharma',
    leadSite: 'All India Institute of Ayurveda (AIIA), New Delhi',
    sitesCount: trial.activeSites || 3,
    participantsCount: trial.targetEnrollment || 140,
    tasks: [
      {
        id: 'task-1',
        name: 'IEC notification dossier',
        status: 'Required',
        statusType: 'required',
        desc: 'Required before clinical implementation under NDCT 2019 Rule 26',
        btnText: 'Review & Upload',
        route: '/compiler',
      },
      {
        id: 'task-2',
        name: 'Site retraining records',
        status: '2 of 3 completed',
        statusType: 'progress',
        desc: 'CRC visit-window operational briefing sign-offs across centers',
        btnText: 'View sites',
        route: '/sites',
      },
      {
        id: 'task-3',
        name: 'Updated informed consent (ICF Addendum)',
        status: 'Awaiting verification',
        statusType: 'pending',
        desc: 'Patient Information Sheet v1.1 addendum for active enrolled participants',
        btnText: 'View evidence',
        route: '/compiler',
      },
    ],
    recentAudits: [
      { id: 'act-1', title: 'Protocol Amendment CS-0001 Created', timestamp: '30m ago', description: 'Visit 4 window shifted from Day 25–31 to Day 25–35' },
      { id: 'act-2', title: 'Site Retraining Completed', timestamp: '2h ago', description: 'AIIA New Delhi signed off on CRC operational briefing logs' },
      { id: 'act-3', title: 'IEC Notification Dossier Submitted', timestamp: '4h ago', description: 'Institutional Ethics Committee review pending for ChangeSet CS-0001' },
    ],
  };
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const { selectedTrial, openGuide, openFetchModal } = useTrial();

  const isPI = currentUser.role === 'Principal Investigator';
  const isEthics = currentUser.role === 'Ethics Reviewer';
  const isCRA = currentUser.role === 'Monitor';
  const isAdmin = currentUser.role === 'Admin';

  const trialCtx = getTrialAmendmentContext(selectedTrial);

  const [readiness, setReadiness] = useState<ReadinessSummary>(compilerService.getReadiness());
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(compilerService.getInitialEvidence());
  const [findings, setFindings] = useState<Finding[]>(compilerService.getInitialFindings());
  const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [rData, eData, fData] = await Promise.all([
          compilerService.fetchReadiness(trialCtx.id),
          compilerService.fetchEvidence(trialCtx.id),
          compilerService.fetchFindings(trialCtx.id),
        ]);

        if (rData) setReadiness(rData);
        if (eData) setEvidenceList(eData);
        if (fData) setFindings(fData);
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

  // Role-specific Next Actions
  let readinessDisplayTag = 'REQUIREMENTS IN PROGRESS';
  let nextActionLabel = 'Resolve requirements →';
  let nextActionRoute = '/compiler';
  let nextActionDesc = `${remainingCount} requirement${remainingCount === 1 ? '' : 's'} remain for ${trialCtx.id}.`;

  if (isEthics) {
    readinessDisplayTag = 'IN REVIEW';
    nextActionLabel = 'Review pending evidence dossiers →';
    nextActionRoute = '/compiler';
    nextActionDesc = `${missingEvidenceCount > 0 ? missingEvidenceCount : 2} regulatory review items require committee decision for ${trialCtx.id}.`;
  } else if (isCRA) {
    readinessDisplayTag = 'MONITORING ACTIVE';
    nextActionLabel = 'Verify site training logs →';
    nextActionRoute = '/compiler';
    nextActionDesc = `Site training logs across ${trialCtx.sitesCount} centers require CRA sign-off.`;
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
  }

  // Steppers tailored per role
  const piSteps = [
    { name: 'Draft', route: '/changesets', isCompleted: true, isCurrent: false },
    { name: 'Impact', route: '/impact', isCompleted: true, isCurrent: false },
    {
      name: 'Resolve',
      route: '/compiler',
      isCompleted: isCertifiedReady,
      isCurrent: !isCertifiedReady && missingEvidenceCount > 0,
    },
    {
      name: 'Evidence',
      route: '/compiler',
      isCompleted: isCertifiedReady || missingEvidenceCount === 0,
      isCurrent: !isCertifiedReady && missingEvidenceCount === 0,
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
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
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
                {trialCtx.sitesCount} Apex Research Centers · {trialCtx.participantsCount} Subjects
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E2922]">
              {selectedTrial.title}
            </h1>
            <p className="text-xs text-[#5C6B62] leading-relaxed max-w-2xl">
              <strong>Formulation:</strong> {selectedTrial.formulation} — <em>{selectedTrial.indication}</em>
            </p>
            <p className="text-[11px] text-slate-500">
              <strong>Lead Investigator / Sponsor:</strong> {trialCtx.piName} ({trialCtx.leadSite}) • {selectedTrial.sponsor}
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
                {trialCtx.title}
              </p>
              <span className="text-[10px] font-mono text-[#5C6B62]">
                {trialCtx.id}
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
            Real-time parameters, statutory requirements, and authorized signatures for <strong>{selectedTrial.shortTitle}</strong>.
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
              <li><strong>Visit Windows:</strong> Extend or shrink visit days.</li>
              <li><strong>Herbal Formulations:</strong> Dosage timing & extract purity specs.</li>
              <li><strong>Lab Biomarkers:</strong> Liver LFT & kidney KFT cutoff bounds.</li>
              <li><strong>Inclusion Criteria:</strong> Age ranges and symptom scores.</li>
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
              <li className="p-1.5 rounded bg-white border border-slate-200">
                <span className="font-bold text-slate-800 block text-[11px] truncate">Lead PI ({trialCtx.piName.split(',')[0]})</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Protocol Sign-off</span>
              </li>
              <li className="p-1.5 rounded bg-white border border-slate-200">
                <span className="font-bold text-slate-800 block text-[11px]">Ethics Chair (Dr. Rajesh Kulkarni)</span>
                <span className="text-[10px] text-amber-700 font-semibold">Expedited Ethics Clearance</span>
              </li>
              <li className="p-1.5 rounded bg-white border border-slate-200">
                <span className="font-bold text-slate-800 block text-[11px]">Lead CRA (Priya Nair)</span>
                <span className="text-[10px] text-sky-700 font-semibold">Site Readiness Verification</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Live Before vs After & Cryptographic Verification Indicator */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 font-mono">
                Live Change Verification (Active Amendment {trialCtx.id})
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900 font-bold">
              SHA-256 Merkle Chain Integrity: VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Previous (Baseline Protocol)</span>
              <p className="font-bold text-red-700 line-through mt-0.5">{trialCtx.previous}</p>
              <p className="text-[11px] text-slate-500 mt-1">Requires amendment to prevent clinical non-compliance.</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Proposed (Amended Protocol)</span>
              <p className="font-bold text-emerald-700 mt-0.5">{trialCtx.proposed}</p>
              <p className="text-[11px] text-slate-500 mt-1">{trialCtx.changeReason}</p>
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
              Action items required for {selectedTrial.shortTitle} ({trialCtx.id}) regulatory certification
            </p>
          </div>
          <span className="text-xs font-semibold text-[#5C6B62]">
            {isReady ? '0 pending items' : `${trialCtx.tasks.length} pending items`}
          </span>
        </div>

        <div className="divide-y divide-[#E8E5DC]">
          {trialCtx.tasks.map((task) => (
            <div key={task.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1E2922]">{task.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    task.statusType === 'required'
                      ? 'text-amber-800 bg-amber-50 border-amber-200'
                      : task.statusType === 'progress'
                      ? 'text-sky-800 bg-sky-50 border-sky-200'
                      : 'text-[#1E4D38] bg-[#EAF4EF] border-[#C5DFD2]'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-xs text-[#5C6B62]">{task.desc}</p>
              </div>
              <button
                onClick={() => navigate(task.route)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E2DFD6] hover:bg-[#FAF9F4] text-xs font-semibold text-[#1E2922] transition-colors shrink-0 cursor-pointer"
              >
                {task.btnText}
              </button>
            </div>
          ))}
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
              {trialCtx.sitesCount} sites · {trialCtx.participantsCount} participants · 1 visit · 1 CRF
            </p>
            <p className="text-xs text-[#5C6B62] leading-relaxed">
              Amendment {trialCtx.id} targets {trialCtx.title} across {trialCtx.sitesCount} research hospitals.
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
              {trialCtx.recentAudits.map((act) => (
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
                    {act.description}
                  </p>
                </button>
              ))}
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
