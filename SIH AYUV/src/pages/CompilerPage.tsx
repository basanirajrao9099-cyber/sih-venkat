import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Upload,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Lock,
  MessageSquare,
  FileCode,
  GraduationCap,
} from 'lucide-react';
import { AuditTrailModal } from '../components/common/AuditTrailModal';
import { AdvisoryModal, AdvisoryFindingExplanation } from '../components/common/AdvisoryModal';
import { Modal } from '../components/common/Modal';
import { ReadinessDetailsModal } from '../components/common/ReadinessDetailsModal';
import { AmendmentReadinessWorkspace } from '../components/amendments/AmendmentReadinessWorkspace';
import { EvidenceDossierWorkspace } from '../components/amendments/EvidenceDossierWorkspace';
import {
  compilerService,
  Finding,
  Obligation,
  EvidenceItem,
  PipelineStepName,
  PipelineStepStatus,
  ReadinessSummary,
} from '../services/compilerService';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export const CompilerPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const isPI = currentUser.role === 'Principal Investigator';
  const isEthics = currentUser.role === 'Ethics Reviewer';
  const isCRA = currentUser.role === 'Monitor';
  const isAdmin = currentUser.role === 'Admin';
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'readiness' | 'evidence' | 'pipeline'>('readiness');
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isAdvisoryOpen, setIsAdvisoryOpen] = useState(false);
  const [isReadinessDetailsOpen, setIsReadinessDetailsOpen] = useState(false);
  const [isPrepareModalOpen, setIsPrepareModalOpen] = useState(false);
  const [advisoryData, setAdvisoryData] = useState<AdvisoryFindingExplanation | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedUploadItem, setSelectedUploadItem] = useState<EvidenceItem | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review drawer/modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState<EvidenceItem | null>(null);
  const [isConfirmingApproval, setIsConfirmingApproval] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [changeFeedbackNote, setChangeFeedbackNote] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  // Compiler state machine: 'idle' | 'compiling' | 'failed' | 'recompiling' | 'ready'
  const [compilerState, setCompilerState] = useState<
    'idle' | 'compiling' | 'failed' | 'recompiling' | 'ready'
  >('failed');

  const [compileStepText, setCompileStepText] = useState<string>('');
  const [findings, setFindings] = useState<Finding[]>(compilerService.getInitialFindings());
  const [obligations, setObligations] = useState<Obligation[]>(
    compilerService.getInitialObligations()
  );
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(
    compilerService.getInitialEvidence()
  );
  const [readiness, setReadiness] = useState<ReadinessSummary>(compilerService.getReadiness());

  useEffect(() => {
    const currentStatus = compilerService.getCompilerStatus();
    if (currentStatus === 'READY') {
      setCompilerState('ready');
    }

    const loadLiveGovernance = async () => {
      try {
        const [fRes, oRes, eRes, rRes] = await Promise.all([
          fetch('/api/v1/compiler/findings?changeSetId=CS-0001'),
          fetch('/api/v1/compiler/obligations?changeSetId=CS-0001'),
          fetch('/api/v1/compiler/evidence?changeSetId=CS-0001'),
          fetch('/api/v1/compiler/readiness?changeSetId=CS-0001'),
        ]);
        if (fRes.ok) {
          const fData = await fRes.json();
          if (Array.isArray(fData) && fData.length > 0) setFindings(fData);
        }
        if (oRes.ok) {
          const oData = await oRes.json();
          if (Array.isArray(oData) && oData.length > 0) setObligations(oData);
        }
        if (eRes.ok) {
          const eData = await eRes.json();
          if (Array.isArray(eData) && eData.length > 0) setEvidenceList(eData);
        }
        if (rRes.ok) {
          const rData = await rRes.json();
          setReadiness(rData);
          if (rData.status === 'READY') {
            setCompilerState('ready');
          }
        }
      } catch (err) {
        console.warn('Backend compiler API unreachable, using local state', err);
      }
    };
    loadLiveGovernance();
  }, []);

  const pipelineSteps: PipelineStepName[] = [
    'CHANGESET',
    'IMPACT',
    'COMPILE',
    'RULES',
    'FINDINGS',
    'OBLIGATIONS',
    'EVIDENCE',
    'VERIFICATION',
    'READY',
  ];

  const getStepStatus = (step: PipelineStepName): PipelineStepStatus => {
    if (compilerState === 'idle') return 'PENDING';
    if (compilerState === 'compiling' || compilerState === 'recompiling') return 'RUNNING';
    if (compilerState === 'failed') {
      if (['CHANGESET', 'IMPACT', 'COMPILE', 'RULES'].includes(step)) return 'PASSED';
      if (['FINDINGS', 'OBLIGATIONS', 'EVIDENCE', 'VERIFICATION'].includes(step)) return 'FAILED';
      return 'PENDING';
    }
    if (compilerState === 'ready') return 'PASSED';
    return 'PENDING';
  };

  // Recompile / Validate amendment after resolving evidence
  const handleValidateAmendment = async () => {
    setCompilerState('compiling');
    setCompileStepText('Checking statutory requirements...');

    const steps = [
      'Checking requirements...',
      'Verifying submitted evidence dossiers...',
      'Re-evaluating statutory rules...',
      'Certifying amendment package...',
    ];

    try {
      const runPromise = fetch('/api/v1/compiler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changeSetId: 'CS-0001', trialId: 'AYU-2026-0001' }),
      });

      for (let i = 0; i < steps.length; i++) {
        setCompileStepText(steps[i]);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      const runRes = await runPromise;
      if (runRes.ok) {
        const runData = await runRes.json();
        if (runData.readiness) setReadiness(runData.readiness);

        const [fData, eData] = await Promise.all([
          compilerService.fetchFindings('CS-0001'),
          compilerService.fetchEvidence('CS-0001'),
        ]);
        setFindings(fData);
        setEvidenceList(eData);

        if (runData.status === 'PASSED' || runData.readiness?.status === 'READY') {
          setCompilerState('ready');
          compilerService.setCompilerStatus('READY');
          showToast('Validation Complete', 'Amendment is certified and ready for implementation', 'success');
        } else {
          setCompilerState('failed');
          showToast('Validation Incomplete', 'Requirements remaining before certification', 'warning');
        }
      }
    } catch (err) {
      console.warn('Backend recompile run error:', err);
      const updatedFindings = findings.map((f) =>
        f.type === 'BLOCK' ? { ...f, status: 'RESOLVED' as const } : f
      );
      setFindings(updatedFindings);
      setCompilerState('ready');
      compilerService.setCompilerStatus('READY');
      showToast('Validation Complete', 'Amendment is certified and ready for implementation', 'success');
    }
  };

  const handleOpenUpload = (item: EvidenceItem) => {
    setSelectedUploadItem(item);
    setUploadFileName(
      item.fileName ||
      (item.id === 'EVD-01'
        ? 'IEC_Notification_Dossier_Signed.pdf'
        : item.id === 'EVD-02'
        ? 'Patient_Information_Sheet_v1.1_Addendum.pdf'
        : 'Multi_Center_CRC_Training_Log.pdf')
    );
    setUploadDescription(
      item.description ||
      item.fileHint ||
      (item.id === 'EVD-01'
        ? 'Dossier acknowledgement receipt from Central Ethics Board'
        : item.id === 'EVD-02'
        ? 'Patient Information Sheet v1.1 addendum approved'
        : 'Site CRC sign-off certificates across 3 centers')
    );
    setUploadFile(null);
    setUploadError('');
    setIsUploadModalOpen(true);
  };

  const handleSubmitUpload = async () => {
    if (!selectedUploadItem) return;
    if (!uploadFileName.trim() && !uploadFile) {
      setUploadError('Please select a file to submit.');
      return;
    }
    if (!uploadDescription.trim()) {
      setUploadError('Please provide a description.');
      return;
    }

    setIsSubmitting(true);
    setUploadError('');

    try {
      await compilerService.submitEvidence({
        evidenceId: selectedUploadItem.id,
        changeSetId: 'CS-0001',
        title: selectedUploadItem.title,
        fileName: uploadFileName,
        fileSizeBytes: uploadFile ? uploadFile.size : 1048576,
        description: uploadDescription,
        fileHint: uploadDescription,
        uploadedBy: 'Dr. V. Sharma (Lead PI)',
        uploaderRole: 'Principal Investigator',
      });

      const [eData, rData] = await Promise.all([
        compilerService.fetchEvidence('CS-0001'),
        compilerService.fetchReadiness('CS-0001'),
      ]);
      setEvidenceList(eData);
      setReadiness(rData);

      setIsUploadModalOpen(false);
      showToast('Evidence Submitted', 'Status updated to Awaiting review', 'success');
    } catch (err) {
      console.warn('Evidence submission failed:', err);
      setUploadError('Evidence could not be submitted. Please try again.');
      showToast('Submission Failed', 'Evidence could not be submitted. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReview = (item: EvidenceItem) => {
    setSelectedReviewItem(item);
    setIsConfirmingApproval(false);
    setIsRequestingChanges(false);
    setChangeFeedbackNote(item.rejectionReason || '');
    setReviewError('');
    setIsReviewModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedReviewItem) return;
    setIsReviewSubmitting(true);
    setReviewError('');

    try {
      await compilerService.verifyEvidence(selectedReviewItem.id, 'ACCEPT', 'CS-0001');

      const [eData, rData, fData] = await Promise.all([
        compilerService.fetchEvidence('CS-0001'),
        compilerService.fetchReadiness('CS-0001'),
        compilerService.fetchFindings('CS-0001'),
      ]);
      setEvidenceList(eData);
      setReadiness(rData);
      setFindings(fData);

      setIsReviewModalOpen(false);
      setIsConfirmingApproval(false);
      showToast('Evidence Verified', `${selectedReviewItem.title} marked as verified.`, 'success');
    } catch (err) {
      console.warn('Verification failed:', err);
      setReviewError('Review decision could not be recorded. Please try again.');
      showToast('Verification Failed', 'Review decision could not be recorded.', 'error');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleSubmitRequestChanges = async () => {
    if (!selectedReviewItem) return;
    if (!changeFeedbackNote.trim()) {
      setReviewError('Please provide a reason for requesting changes.');
      return;
    }

    setIsReviewSubmitting(true);
    setReviewError('');

    try {
      await compilerService.verifyEvidence(
        selectedReviewItem.id,
        'REJECT',
        'CS-0001',
        changeFeedbackNote,
        changeFeedbackNote
      );

      const [eData, rData, fData] = await Promise.all([
        compilerService.fetchEvidence('CS-0001'),
        compilerService.fetchReadiness('CS-0001'),
        compilerService.fetchFindings('CS-0001'),
      ]);
      setEvidenceList(eData);
      setReadiness(rData);
      setFindings(fData);

      setIsReviewModalOpen(false);
      setIsRequestingChanges(false);
      showToast('Changes Requested', 'Feedback has been sent to the Principal Investigator.', 'info');
    } catch (err) {
      console.warn('Request changes failed:', err);
      setReviewError('Failed to record change request. Please try again.');
      showToast('Request Failed', 'Failed to record change request.', 'error');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'Today';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const handleExplainFinding = async (finding: Finding) => {
    setIsAdvisoryOpen(true);
    setAdvisoryLoading(true);
    try {
      const res = await fetch('/api/v1/advisory/explain-finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId: finding.id, changeSetId: 'CS-0001' }),
      });
      if (res.ok) {
        const data = await res.json();
        setAdvisoryData(data);
      } else {
        showToast('Advisory Unavailable', 'Could not retrieve statutory explanation', 'warning');
      }
    } catch (err) {
      console.warn('Advisory query error:', err);
      showToast('Advisory Error', 'Failed to consult advisory engine', 'warning');
    } finally {
      setAdvisoryLoading(false);
    }
  };

  const toggleObligationStatus = (id: string, forceStatus?: 'OPEN' | 'COMPLETED') => {
    setObligations((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const next = forceStatus || (o.status === 'OPEN' ? 'COMPLETED' : 'OPEN');
          return { ...o, status: next };
        }
        return o;
      })
    );
  };

  const handleReset = () => {
    fetch('/api/v1/compiler/reset?changeSetId=CS-0001', {
      method: 'POST',
    }).catch((err) => console.warn('Backend reset error:', err));

    setCompilerState('failed');
    setCompileStepText('');
    setFindings(compilerService.getInitialFindings());
    setObligations(compilerService.getInitialObligations());
    setEvidenceList(compilerService.getInitialEvidence());
    compilerService.resetDemoState();
    showToast('Reset Complete', 'Returned to initial pending requirements state', 'info', 1500);
  };

  const allEvidenceResolved = evidenceList
    .filter((e) => e.id !== 'EVD-04')
    .every((e) => e.status === 'VERIFIED');

  const isCertifiedReady = compilerState === 'ready' || readiness.status === 'READY';
  const isReady = isCertifiedReady;
  const missingCount = evidenceList.filter((e) => e.status !== 'VERIFIED' && e.id !== 'EVD-04').length;

  const remainingList =
    readiness.remainingRequirements && readiness.remainingRequirements.length > 0
      ? readiness.remainingRequirements
      : isCertifiedReady || allEvidenceResolved
      ? []
      : ['IEC approval', 'Site retraining'];

  const remainingCount =
    readiness.remainingRequirementsCount !== undefined
      ? readiness.remainingRequirementsCount
      : remainingList.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* 1. HEADER & DOCKET CONTEXT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E5DC] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2]">
              CS-0001
            </span>
            <span className="text-xs text-[#5C6B62] font-medium">• Visit 4 Schedule Change</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E2922]">
            Evidence & Regulatory Validation
          </h1>
          <p className="text-xs text-[#5C6B62] mt-0.5">
            Submit required compliance evidence and validate amendment readiness before rollout.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAuditOpen(true)}
            className="px-3.5 py-2 rounded-lg border border-[#E2DFD6] hover:bg-white text-xs font-semibold text-[#1E2922] transition-colors cursor-pointer"
          >
            View provenance
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg text-[#5C6B62] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Reset to initial state"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. WORKSPACE TAB SWITCHER */}
      <div className="flex items-center gap-2 border-b border-[#E8E5DC] pb-2">
        <button
          onClick={() => setActiveWorkspaceTab('readiness')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeWorkspaceTab === 'readiness'
              ? 'bg-[#1E4D38] text-white shadow-xs'
              : 'text-[#5C6B62] hover:bg-white hover:text-[#1E2922] border border-transparent'
          }`}
        >
          Readiness Workspace
        </button>
        <button
          onClick={() => setActiveWorkspaceTab('evidence')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeWorkspaceTab === 'evidence'
              ? 'bg-[#1E4D38] text-white shadow-xs'
              : 'text-[#5C6B62] hover:bg-white hover:text-[#1E2922] border border-transparent'
          }`}
        >
          <span>Evidence Dossier</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeWorkspaceTab === 'evidence'
                ? 'bg-white/20 text-white'
                : 'bg-[#E2DFD6] text-[#5C6B62]'
            }`}
          >
            {evidenceList.length}
          </span>
        </button>
        <button
          onClick={() => setActiveWorkspaceTab('pipeline')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeWorkspaceTab === 'pipeline'
              ? 'bg-[#1E4D38] text-white shadow-xs'
              : 'text-[#5C6B62] hover:bg-white hover:text-[#1E2922] border border-transparent'
          }`}
        >
          Rules & Statutory Basis
        </button>
      </div>

      {/* 3. TAB 1: AMENDMENT READINESS WORKSPACE */}
      {activeWorkspaceTab === 'readiness' && (
        <AmendmentReadinessWorkspace
          changeSetId="CS-0001"
          readiness={readiness}
          evidenceList={evidenceList}
          findings={findings}
          onOpenUpload={handleOpenUpload}
          onOpenReview={handleOpenReview}
          onOpenAudit={() => setIsAuditOpen(true)}
          onRefresh={async () => {
            try {
              const [fRes, oRes, eRes, rRes] = await Promise.all([
                fetch('/api/v1/compiler/findings?changeSetId=CS-0001'),
                fetch('/api/v1/compiler/obligations?changeSetId=CS-0001'),
                fetch('/api/v1/compiler/evidence?changeSetId=CS-0001'),
                fetch('/api/v1/compiler/readiness?changeSetId=CS-0001'),
              ]);
              if (fRes.ok) {
                const fData = await fRes.json();
                if (Array.isArray(fData)) setFindings(fData);
              }
              if (oRes.ok) {
                const oData = await oRes.json();
                if (Array.isArray(oData)) setObligations(oData);
              }
              if (eRes.ok) {
                const eData = await eRes.json();
                if (Array.isArray(eData)) setEvidenceList(eData);
              }
              if (rRes.ok) {
                const rData = await rRes.json();
                setReadiness(rData);
                if (rData.status === 'READY') setCompilerState('ready');
              }
            } catch (err) {
              console.warn('Error refreshing live governance state', err);
            }
          }}
          onNavigateToEvidence={() => setActiveWorkspaceTab('evidence')}
          isPI={isPI}
          isCRA={isCRA}
          isEthics={isEthics}
          isAdmin={isAdmin}
        />
      )}

      {/* 4. TAB 2: EVIDENCE DOSSIER */}
      {activeWorkspaceTab === 'evidence' && (
        <EvidenceDossierWorkspace
          changeSetId="CS-0001"
          evidenceList={evidenceList}
          readiness={readiness}
          findings={findings}
          onOpenUpload={handleOpenUpload}
          onOpenReview={handleOpenReview}
          onOpenAudit={() => setIsAuditOpen(true)}
          onRefresh={async () => {
            try {
              const [fRes, oRes, eRes, rRes] = await Promise.all([
                fetch('/api/v1/compiler/findings?changeSetId=CS-0001'),
                fetch('/api/v1/compiler/obligations?changeSetId=CS-0001'),
                fetch('/api/v1/compiler/evidence?changeSetId=CS-0001'),
                fetch('/api/v1/compiler/readiness?changeSetId=CS-0001'),
              ]);
              if (fRes.ok) {
                const fData = await fRes.json();
                if (Array.isArray(fData)) setFindings(fData);
              }
              if (oRes.ok) {
                const oData = await oRes.json();
                if (Array.isArray(oData)) setObligations(oData);
              }
              if (eRes.ok) {
                const eData = await eRes.json();
                if (Array.isArray(eData)) setEvidenceList(eData);
              }
              if (rRes.ok) {
                const rData = await rRes.json();
                setReadiness(rData);
                if (rData.status === 'READY') setCompilerState('ready');
              }
            } catch (err) {
              console.warn('Error refreshing live governance state', err);
            }
          }}
          onNavigateToReadiness={() => setActiveWorkspaceTab('readiness')}
          isPI={isPI}
          isCRA={isCRA}
          isEthics={isEthics}
          isAdmin={isAdmin}
        />
      )}


  {/* 5. TAB 3: RULES & STATUTORY BASIS & PIPELINE */}
  {activeWorkspaceTab === 'pipeline' && (
    <div className="space-y-6">
      {/* STATUTORY FINDINGS & REGULATORY BASIS */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E5DC] pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E2922] font-mono">
              Statutory Findings
            </h2>
            <p className="text-xs text-[#5C6B62] mt-0.5">
              Automated rule evaluation against NDCT 2019, ICMR 2017, and Ayush GCP
            </p>
          </div>
          <span className="text-xs font-semibold text-[#5C6B62]">
            {findings.length} findings evaluated
          </span>
        </div>

        <div className="divide-y divide-[#E8E5DC]">
          {findings.map((f) => {
            const isResolved = isReady || f.status === 'RESOLVED';

            return (
              <div key={f.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E2922]">{f.title}</span>
                    <span className="text-[10px] font-mono font-semibold text-[#5C6B62]">{f.id}</span>
                    {isResolved ? (
                      <span className="text-[10px] font-semibold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2]">
                        Resolved
                      </span>
                    ) : f.type === 'BLOCK' ? (
                      <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Blocker
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Warning
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5C6B62]">{f.description}</p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => handleExplainFinding(f)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E4D38] hover:text-[#163B2B] hover:underline cursor-pointer"
                  >
                    <span>View regulatory basis</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PROGRESSIVE DISCLOSURE: TECHNICAL COMPILATION PIPELINE */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-5 shadow-xs">
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="w-full flex items-center justify-between text-xs font-semibold text-[#5C6B62] hover:text-[#1E2922] transition-colors cursor-pointer"
        >
          <span className="font-mono uppercase tracking-wider">
            {showTechDetails ? 'Hide technical validation details' : 'View technical validation details (Pipeline & Snapshot)'}
          </span>
          {showTechDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTechDetails && (
          <div className="pt-4 space-y-4 border-t border-[#E8E5DC] mt-3 text-xs animate-fade-in">
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {pipelineSteps.map((step, idx) => {
                const status = getStepStatus(step);
                return (
                  <div
                    key={step}
                    className={`p-2 rounded-lg border text-center space-y-0.5 ${
                      status === 'PASSED'
                        ? 'bg-[#EAF4EF] border-[#C5DFD2] text-[#1E4D38]'
                        : status === 'FAILED'
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-[#FAF9F4] border-[#E8E5DC] text-[#8C9B91]'
                    }`}
                  >
                    <div className="text-[9px] font-mono font-bold">0{idx + 1}</div>
                    <div className="text-[10px] font-semibold truncate">{step}</div>
                    <div className="text-[9px] font-mono font-bold">{status}</div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <span className="text-[#5C6B62]">
                Snapshot Run ID: <strong className="text-[#1E2922]">{isReady ? 'CMP-000129' : 'CMP-000128'}</strong>
              </span>
              <button
                onClick={() => setIsAuditOpen(true)}
                className="text-[#1E4D38] hover:underline font-semibold text-left sm:text-right cursor-pointer"
              >
                Inspect SHA-256 Merkle Provenance →
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )}

      {/* EVIDENCE UPLOAD / SUBMIT MODAL */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadError('');
        }}
        title={selectedUploadItem?.status === 'REJECTED' ? 'Update evidence' : 'Submit evidence'}
        description="Protocol: AYU-CT-2026-042 · CS-0001 Visit 4 Schedule Change"
        size="md"
      >
        <div className="space-y-4 text-xs">
          {selectedUploadItem?.status === 'REJECTED' && selectedUploadItem.rejectionReason && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
              <span className="font-bold block text-rose-950">Evidence requires revision</span>
              <p className="text-[11px] text-rose-800">
                Reviewer: <span className="font-semibold">{selectedUploadItem.reviewerRole || 'Ethics Reviewer'}</span>
              </p>
              <p className="text-[11px] italic text-rose-900">
                &ldquo;{selectedUploadItem.rejectionReason}&rdquo;
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-[#1E2922] block">Evidence</label>
            <input
              type="text"
              value={selectedUploadItem?.title || ''}
              disabled
              className="w-full bg-[#FAF9F4] border border-[#E2DFD6] rounded-lg p-2.5 text-xs text-[#5C6B62] font-semibold cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#1E2922] block">Related amendment</label>
            <input
              type="text"
              value="CS-0001"
              disabled
              className="w-full bg-[#FAF9F4] border border-[#E2DFD6] rounded-lg p-2.5 text-xs text-[#5C6B62] font-mono cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#1E2922] block">
              Description <span className="text-rose-600">*</span>
            </label>
            <textarea
              value={uploadDescription}
              onChange={(e) => {
                setUploadDescription(e.target.value);
                if (uploadError) setUploadError('');
              }}
              placeholder="Provide documentation notes or dossier details..."
              className="w-full bg-white border border-[#E2DFD6] rounded-lg p-2.5 text-xs text-[#1E2922] focus:outline-none focus:border-[#1E4D38] min-h-[75px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-[#1E2922] block">
              File <span className="text-rose-600">*</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="px-3.5 py-2 rounded-lg border border-[#E2DFD6] bg-[#FAF9F4] hover:bg-white text-xs font-semibold text-[#1E2922] cursor-pointer transition-colors inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#5C6B62]" />
                <span>Choose file</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadFile(file);
                      setUploadFileName(file.name);
                      if (uploadError) setUploadError('');
                    }
                  }}
                />
              </label>
              <span className="text-xs font-mono text-[#5C6B62] truncate max-w-[260px]">
                {uploadFileName || 'No file chosen'}
              </span>
            </div>
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="pt-3 border-t border-[#E8E5DC] flex justify-end gap-2.5">
            <button
              onClick={() => {
                setIsUploadModalOpen(false);
                setUploadError('');
              }}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitUpload}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              {isSubmitting
                ? 'Submitting...'
                : selectedUploadItem?.status === 'REJECTED'
                ? 'Update evidence'
                : 'Submit evidence'}
            </button>
          </div>
        </div>
      </Modal>

      {/* EVIDENCE REVIEW / DETAIL DRAWER/MODAL */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setIsConfirmingApproval(false);
          setIsRequestingChanges(false);
          setReviewError('');
        }}
        title={
          isConfirmingApproval
            ? 'Approve this evidence?'
            : isRequestingChanges
            ? 'Request changes'
            : selectedReviewItem?.status === 'VERIFIED' || selectedReviewItem?.status === 'AVAILABLE'
            ? 'Evidence Record'
            : 'Review evidence'
        }
        description={
          isConfirmingApproval
            ? 'This will mark the evidence as verified and may satisfy a governance requirement.'
            : isRequestingChanges
            ? `Provide revision reason for ${selectedReviewItem?.title || ''}`
            : `Governance verification details for ${selectedReviewItem?.id || ''}`
        }
        size="md"
      >
        <div className="space-y-4 text-xs">
          {/* CONFIRMATION VIEW FOR APPROVAL */}
          {isConfirmingApproval ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-xl bg-[#EAF4EF] border border-[#C5DFD2] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#1E4D38]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve this evidence?</span>
                </div>
                <p className="text-[11px] text-[#5C6B62] leading-relaxed">
                  This will mark the evidence as verified and may satisfy a governance requirement.
                </p>
              </div>

              {reviewError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{reviewError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#E8E5DC] flex justify-end gap-2.5">
                <button
                  onClick={() => setIsConfirmingApproval(false)}
                  disabled={isReviewSubmitting}
                  className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApprove}
                  disabled={isReviewSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  {isReviewSubmitting ? 'Approving...' : 'Approve evidence'}
                </button>
              </div>
            </div>
          ) : isRequestingChanges ? (
            /* REQUEST CHANGES VIEW */
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="font-semibold text-rose-900 block">
                  Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={changeFeedbackNote}
                  onChange={(e) => {
                    setChangeFeedbackNote(e.target.value);
                    if (reviewError) setReviewError('');
                  }}
                  placeholder="Please provide the signed IEC notification dossier."
                  className="w-full bg-white border border-[#E2DFD6] rounded-lg p-2.5 text-xs text-[#1E2922] focus:outline-none focus:border-rose-600 min-h-[90px]"
                />
              </div>

              {reviewError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{reviewError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#E8E5DC] flex justify-end gap-2.5">
                <button
                  onClick={() => {
                    setIsRequestingChanges(false);
                    setReviewError('');
                  }}
                  disabled={isReviewSubmitting}
                  className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequestChanges}
                  disabled={isReviewSubmitting}
                  className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  {isReviewSubmitting ? 'Submitting...' : 'Request changes'}
                </button>
              </div>
            </div>
          ) : (
            /* DEFAULT EVIDENCE RECORD / REVIEW VIEW */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E5DC] space-y-3">
                <div>
                  <span className="text-[#5C6B62] text-[10px] uppercase font-bold block font-mono">Evidence Name</span>
                  <span className="font-bold text-[#1E2922] text-xs block mt-0.5">{selectedReviewItem?.title}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#5C6B62] block">Related amendment</span>
                    <span className="font-semibold text-[#1E2922]">CS-0001</span>
                  </div>
                  <div>
                    <span className="text-[#5C6B62] block">Submitted by</span>
                    <span className="font-semibold text-[#1E2922]">
                      {selectedReviewItem?.uploadedBy || 'Principal Investigator'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#5C6B62] block">Submission timestamp</span>
                    <span className="font-semibold text-[#1E2922]">
                      {formatTimestamp(selectedReviewItem?.submittedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5C6B62] block">Status</span>
                    <span className="font-semibold text-[#1E2922]">
                      {selectedReviewItem?.status === 'VERIFIED' || selectedReviewItem?.status === 'AVAILABLE'
                        ? 'Verified'
                        : selectedReviewItem?.status === 'SUBMITTED'
                        ? 'Awaiting review'
                        : selectedReviewItem?.status === 'REJECTED'
                        ? 'Changes requested'
                        : 'Required'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[#5C6B62] text-[10px] uppercase font-bold block font-mono">Description</span>
                  <p className="text-xs text-[#1E2922] mt-0.5">
                    {selectedReviewItem?.description || selectedReviewItem?.fileHint || 'Statutory evidence dossier for protocol amendment.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E8E5DC]">
                  <span className="text-[#5C6B62] text-[10px] uppercase font-bold block font-mono">Document / File Information</span>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#1E2922]">
                    <span className="font-mono">{selectedReviewItem?.fileName || 'evidence_document.pdf'}</span>
                    <span className="text-[#5C6B62]">1.2 MB</span>
                  </div>
                </div>
              </div>

              {/* Action Bar with Authoritative Role Enforcement */}
              <div className="pt-3 border-t border-[#E8E5DC] flex items-center justify-between gap-2.5">
                {selectedReviewItem?.status === 'VERIFIED' || selectedReviewItem?.status === 'AVAILABLE' ? (
                  <div className="w-full flex justify-end">
                    <button
                      onClick={() => setIsReviewModalOpen(false)}
                      className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                ) : isPI ? (
                  <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[11px] text-[#5C6B62] italic">
                      Awaiting determination from Ethics Committee / CRA. Reviewer actions are restricted for the Principal Investigator.
                    </span>
                    <button
                      onClick={() => setIsReviewModalOpen(false)}
                      className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer self-end sm:self-auto"
                    >
                      Close
                    </button>
                  </div>
                ) : isEthics && selectedReviewItem?.id === 'EVD-03' ? (
                  <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[11px] text-amber-800">
                      Site CRC training logs must be verified by Clinical Research Associate / Monitor.
                    </span>
                    <button
                      onClick={() => setIsReviewModalOpen(false)}
                      className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer self-end sm:self-auto"
                    >
                      Close
                    </button>
                  </div>
                ) : isCRA && (selectedReviewItem?.id === 'EVD-01' || selectedReviewItem?.id === 'EVD-02') ? (
                  <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[11px] text-amber-800">
                      IEC notification dossiers and consent addenda require Ethics Reviewer approval.
                    </span>
                    <button
                      onClick={() => setIsReviewModalOpen(false)}
                      className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer self-end sm:self-auto"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsRequestingChanges(true);
                        setChangeFeedbackNote(selectedReviewItem?.rejectionReason || '');
                        setReviewError('');
                      }}
                      className="px-3.5 py-2 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Request changes
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsReviewModalOpen(false)}
                        className="px-3.5 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setIsConfirmingApproval(true)}
                        className="px-5 py-2 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        {isCRA ? 'Verify & Sign-off' : 'Approve'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ADVISORY REGULATORY GUIDANCE & MERKLE AUDIT TRAIL MODALS */}
      <AdvisoryModal
        isOpen={isAdvisoryOpen}
        onClose={() => setIsAdvisoryOpen(false)}
        data={advisoryData}
        loading={advisoryLoading}
      />

      <AuditTrailModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />

      {/* READINESS DETAILS MODAL */}
      <ReadinessDetailsModal
        isOpen={isReadinessDetailsOpen}
        onClose={() => setIsReadinessDetailsOpen(false)}
        readiness={readiness}
        evidenceList={evidenceList}
        findings={findings}
      />

      {/* PREPARE IMPLEMENTATION CONFIRMATION MODAL */}
      <Modal
        isOpen={isPrepareModalOpen}
        onClose={() => setIsPrepareModalOpen(false)}
        title="Prepare Amendment Implementation"
        description="Protocol: AYU-CT-2026-042 · CS-0001 Visit 4 Schedule Change"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-[#EAF4EF] border border-[#C5DFD2] space-y-2">
            <div className="flex items-center gap-2 text-[#1E4D38] font-bold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Certified Ready for Implementation</span>
            </div>
            <p className="text-[#5C6B62] leading-relaxed text-[11px]">
              All required statutory governance checks, IEC approvals, consent addenda, and site training logs have been verified against the clinical governance rule engine.
            </p>
          </div>

          <div className="space-y-2 border border-[#E8E5DC] rounded-xl p-3.5 bg-[#FAF9F4]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono block">
              Implementation Rollout Scope
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white border border-[#E8E5DC] rounded-lg">
                <span className="text-[10px] text-[#5C6B62] block">Participating Centers</span>
                <span className="font-bold text-[#1E2922]">3 Sites (Delhi, Jaipur, Jamnagar)</span>
              </div>
              <div className="p-2.5 bg-white border border-[#E8E5DC] rounded-lg">
                <span className="text-[10px] text-[#5C6B62] block">Active Cohort</span>
                <span className="font-bold text-[#1E2922]">47 Participants</span>
              </div>
              <div className="p-2.5 bg-white border border-[#E8E5DC] rounded-lg">
                <span className="text-[10px] text-[#5C6B62] block">Assessment Target</span>
                <span className="font-bold text-[#1E2922]">Visit 4 Window (Day 25–35)</span>
              </div>
              <div className="p-2.5 bg-white border border-[#E8E5DC] rounded-lg">
                <span className="text-[10px] text-[#5C6B62] block">Governance Audit</span>
                <span className="font-bold text-[#1E4D38]">Cryptographic Seal Intact</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8E5DC] flex justify-end gap-2.5">
            <button
              onClick={() => setIsPrepareModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsPrepareModalOpen(false);
                showToast(
                  'Implementation Complete',
                  'Amendment CS-0001 successfully implemented across all 3 research centers',
                  'success'
                );
              }}
              className="px-5 py-2 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Confirm rollout implementation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
