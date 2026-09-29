import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  RotateCcw,
  Check,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Lock,
  History,
  FileCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Download,
  Eye,
  Info,
} from 'lucide-react';
import {
  EvidenceItem,
  ReadinessSummary,
  Finding,
  compilerService,
} from '../../services/compilerService';
import { SiteTrainingEvidence } from '../../types/trialOps';
import { siteService } from '../../services/siteService';
import { useToast } from '../../hooks/useToast';

interface EvidenceDossierWorkspaceProps {
  changeSetId?: string;
  evidenceList: EvidenceItem[];
  readiness: ReadinessSummary;
  findings: Finding[];
  isPI: boolean;
  isCRA: boolean;
  isEthics: boolean;
  isAdmin: boolean;
  onOpenUpload: (item: EvidenceItem) => void;
  onOpenReview: (item: EvidenceItem) => void;
  onOpenAudit: () => void;
  onRefresh: () => Promise<void>;
  onNavigateToReadiness?: () => void;
}

interface AuditSnippet {
  id: number;
  title: string;
  actor: string;
  timestamp: string;
  description: string;
  status: string;
}

export const EvidenceDossierWorkspace: React.FC<EvidenceDossierWorkspaceProps> = ({
  changeSetId = 'CS-0001',
  evidenceList,
  readiness,
  findings,
  isPI,
  isCRA,
  isEthics,
  isAdmin,
  onOpenUpload,
  onOpenReview,
  onOpenAudit,
  onRefresh,
  onNavigateToReadiness,
}) => {
  const { showToast } = useToast();
  const [recentAudits, setRecentAudits] = useState<AuditSnippet[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [siteActionPending, setSiteActionPending] = useState<string | null>(null);

  // Site training review/reject modal
  const [rejectSiteModalOpen, setRejectSiteModalOpen] = useState(false);
  const [selectedRejectSite, setSelectedRejectSite] = useState<SiteTrainingEvidence | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Site training complete modal
  const [completeSiteModalOpen, setCompleteSiteModalOpen] = useState(false);
  const [selectedCompleteSite, setSelectedCompleteSite] = useState<SiteTrainingEvidence | null>(null);
  const [completedByName, setCompletedByName] = useState('Dr. V. Sharma (Lead PI)');
  const [isCompleting, setIsCompleting] = useState(false);

  // Load latest audit logs
  useEffect(() => {
    const fetchRecentAudit = async () => {
      setLoadingAudit(true);
      try {
        const res = await fetch(`/api/v1/audit/trail?changeSetId=${changeSetId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const reversed = [...data].reverse().slice(0, 4);
            setRecentAudits(
              reversed.map((d: any) => ({
                id: d.id,
                title: d.title,
                actor: d.who || d.actor,
                timestamp: d.timestamp,
                description: d.why || d.description,
                status: d.outcome || d.status,
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Could not load audit snippet:', err);
      } finally {
        setLoadingAudit(false);
      }
    };
    fetchRecentAudit();
  }, [changeSetId, evidenceList]);

  // Status counters from backend
  const verifiedCount = evidenceList.filter(
    (e) => e.status === 'VERIFIED' || e.status === 'AVAILABLE'
  ).length;
  const totalEvidenceCount = evidenceList.length;

  const evd03 = evidenceList.find((e) => e.id === 'EVD-03');
  const affectedSites = evd03?.siteEvidence || [];
  const verifiedSiteCount =
    evd03?.verifiedSitesCount ??
    affectedSites.filter((s) => s.verificationStatus === 'VERIFIED').length;
  const totalAffectedSites = evd03?.affectedSitesCount ?? affectedSites.length;

  // Site quick action handlers
  const handleVerifySite = async (site: SiteTrainingEvidence) => {
    setSiteActionPending(site.siteId);
    try {
      await siteService.verifySiteTraining(site.siteId, {
        changeSetId,
        verifiedBy: 'Lead Clinical Monitor',
      });
      showToast('Site Training Verified', `Verified training evidence for ${site.siteName}.`, 'success');
      await onRefresh();
    } catch (err) {
      showToast('Verification Failed', 'Could not verify site training.', 'error');
    } finally {
      setSiteActionPending(null);
    }
  };

  const handleOpenRejectSite = (site: SiteTrainingEvidence) => {
    setSelectedRejectSite(site);
    setRejectReason(site.rejectionReason || site.verificationNote || '');
    setRejectSiteModalOpen(true);
  };

  const handleSubmitSiteReject = async () => {
    if (!selectedRejectSite) return;
    if (!rejectReason.trim()) {
      showToast('Validation Error', 'Please provide a clear reason for requesting changes.', 'warning');
      return;
    }
    setIsRejecting(true);
    try {
      await siteService.requestChangesSiteTraining(selectedRejectSite.siteId, {
        changeSetId,
        rejectionReason: rejectReason.trim(),
        verifiedBy: 'Lead Clinical Monitor',
      });
      showToast('Changes Requested', `Feedback sent to ${selectedRejectSite.siteName} coordinator.`, 'info');
      setRejectSiteModalOpen(false);
      await onRefresh();
    } catch (err) {
      showToast('Request Failed', 'Failed to request changes.', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleOpenCompleteSite = (site: SiteTrainingEvidence) => {
    setSelectedCompleteSite(site);
    setCompletedByName('Dr. V. Sharma (Lead PI)');
    setCompleteSiteModalOpen(true);
  };

  const handleSubmitSiteComplete = async () => {
    if (!selectedCompleteSite) return;
    setIsCompleting(true);
    try {
      await siteService.completeSiteTraining(selectedCompleteSite.siteId, {
        changeSetId,
        completedBy: completedByName.trim() || 'Principal Investigator',
      });
      showToast('Training Completed', `Training record submitted for ${selectedCompleteSite.siteName}.`, 'success');
      setCompleteSiteModalOpen(false);
      await onRefresh();
    } catch (err) {
      showToast('Submission Failed', 'Failed to complete site training.', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return null;
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

  return (
    <div className="space-y-6">
      {/* 1. DOSSIER SUMMARY HERO */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1E4D38]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono">
                Evidence & Regulatory Document Dossier
              </span>
              <span className="text-xs text-[#8C9B91]">•</span>
              <span className="text-xs font-mono font-medium text-[#1E2922] bg-[#FAF9F4] px-2 py-0.5 rounded border border-[#E8E5DC]">
                {changeSetId}
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#1E2922] tracking-tight">
              Regulatory Submissions & Site Evidence
            </h1>
            <p className="text-xs text-[#5C6B62] leading-relaxed">
              Authoritative regulatory notifications, informed consent revisions, and multi-center training attestations
              required before amendment implementation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onNavigateToReadiness && (
              <button
                onClick={onNavigateToReadiness}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2DFD6] bg-[#FAF9F4] hover:bg-[#F2EFE9] text-xs font-semibold text-[#1E2922] transition-colors cursor-pointer"
              >
                <span>Amendment Readiness</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#5C6B62]" />
              </button>
            )}
            <button
              onClick={onOpenAudit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2DFD6] bg-white hover:bg-[#FAF9F4] text-xs font-semibold text-[#1E2922] transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#5C6B62]" />
              <span>Full Audit Trail</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-[#E8E5DC]">
          <div className="p-3.5 rounded-lg bg-[#FAF9F4] border border-[#E8E5DC] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62]">
                Evidence Requirements
              </div>
              <div className="text-sm font-bold text-[#1E2922] mt-0.5">
                {verifiedCount} / {totalEvidenceCount} verified
              </div>
            </div>
            <FileCheck className="w-5 h-5 text-[#1E4D38] opacity-80" />
          </div>

          <div className="p-3.5 rounded-lg bg-[#FAF9F4] border border-[#E8E5DC] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62]">
                Affected Sites Training
              </div>
              <div className="text-sm font-bold text-[#1E2922] mt-0.5">
                {verifiedSiteCount} / {totalAffectedSites} verified
              </div>
            </div>
            <GraduationCap className="w-5 h-5 text-[#1E4D38] opacity-80" />
          </div>

          <div className="p-3.5 rounded-lg bg-[#FAF9F4] border border-[#E8E5DC] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62]">
                Readiness State
              </div>
              <div className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    readiness.overallState === 'READY' ? 'bg-[#1E4D38]' : 'bg-amber-600'
                  }`}
                />
                <span
                  className={
                    readiness.overallState === 'READY' ? 'text-[#1E4D38]' : 'text-amber-800'
                  }
                >
                  {readiness.overallState || (readiness.status === 'READY' ? 'READY' : 'NOT READY')}
                </span>
              </div>
            </div>
            <ShieldCheck
              className={`w-5 h-5 ${
                readiness.overallState === 'READY' ? 'text-[#1E4D38]' : 'text-amber-600'
              }`}
            />
          </div>
        </div>
      </section>

      {/* 2. EVIDENCE REQUIREMENTS LIST */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold text-[#1E2922] tracking-tight">
              Required Regulatory & Operational Evidence
            </h2>
            <p className="text-xs text-[#5C6B62]">
              Each document requirement must be submitted with cryptographic checksum and verified by the designated authority.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#5C6B62]">
            {verifiedCount} of {totalEvidenceCount} satisfied
          </span>
        </div>

        <div className="space-y-4">
          {evidenceList.map((item) => {
            const isVerified = item.status === 'VERIFIED' || item.status === 'AVAILABLE';
            const isAwaiting = item.status === 'SUBMITTED';
            const isChangesRequested = item.status === 'REJECTED';
            const isRequired = item.status === 'MISSING';

            const requirementScope =
              item.id === 'EVD-01'
                ? 'Central Ethics Committee Notification (ICMR 2017 & NDCT 2019)'
                : item.id === 'EVD-02'
                ? 'Participant Information Sheet & Consent Addendum (Schedule Y/GCP)'
                : item.id === 'EVD-03'
                ? 'Multi-Center Site Investigator & CRC Operational Briefing'
                : 'Electronic Data Capture Schema Window Mapping Verification';

            return (
              <div
                key={item.id}
                className="bg-white border border-[#E2DFD6] rounded-xl p-5 sm:p-6 shadow-xs space-y-4 transition-all hover:border-[#D1CDC2]"
              >
                {/* ITEM HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#E8E5DC]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#FAF9F4] text-[#1E4D38] border border-[#E8E5DC]">
                        {item.id}
                      </span>
                      <h3 className="text-sm font-bold text-[#1E2922]">{item.title}</h3>
                      {item.isDemoFixture && (
                        <span className="text-[10px] text-[#8C9B91] font-mono">seeded</span>
                      )}
                    </div>
                    <div className="text-xs text-[#5C6B62] flex items-center gap-1.5">
                      <span className="text-[#8C9B91]">Purpose:</span>
                      <span>{requirementScope}</span>
                    </div>
                  </div>

                  {/* STATUS PILL */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isVerified && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EAF4EF] text-[#1E4D38] border border-[#C5DFD2]">
                        <Check className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    )}
                    {isAwaiting && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        <Clock className="w-3.5 h-3.5" />
                        Awaiting review
                      </span>
                    )}
                    {isChangesRequested && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Changes requested
                      </span>
                    )}
                    {isRequired && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F4F1EA] text-[#5C6B62] border border-[#E2DFD6]">
                        <span className="text-[#8C9B91]">○</span>
                        Required
                      </span>
                    )}
                  </div>
                </div>

                {/* DESCRIPTION & DETAIL */}
                <div className="text-xs text-[#1E2922] bg-[#FAF9F4] p-3 rounded-lg border border-[#E8E5DC] leading-relaxed">
                  <span className="font-semibold text-[#5C6B62]">Requirement description: </span>
                  {item.fileHint || item.description || 'Clinical trial statutory evidence requirement.'}
                </div>

                {/* REVIEW FEEDBACK (IF CHANGES REQUESTED) */}
                {isChangesRequested && item.rejectionReason && (
                  <div className="p-3.5 rounded-lg bg-rose-50/90 border border-rose-200 text-xs text-rose-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                      <span>Reviewer Feedback / Revision Request</span>
                    </div>
                    <p className="text-rose-900 italic pl-5">
                      &ldquo;{item.rejectionReason}&rdquo;
                    </p>
                    {item.reviewerRole && (
                      <p className="text-[11px] text-rose-800 pl-5">
                        Reviewed by: <span className="font-medium">{item.verifiedBy || item.reviewerRole}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* METADATA GRID: SUBMISSION & VERIFICATION PROVENANCE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* SUBMISSION PROVENANCE */}
                  <div className="p-3 rounded-lg border border-[#E8E5DC] bg-white space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62]">
                      Submission Provenance
                    </div>
                    {item.uploadedBy || item.submittedAt || item.fileName ? (
                      <div className="space-y-1 text-[#1E2922]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#5C6B62]">Submitted by:</span>
                          <span className="font-medium">{item.uploadedBy || 'Principal Investigator'}</span>
                        </div>
                        {item.submittedAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-[#5C6B62]">Timestamp:</span>
                            <span className="font-mono text-[11px]">{formatTimestamp(item.submittedAt)}</span>
                          </div>
                        )}
                        {item.fileName && (
                          <div className="flex items-center justify-between">
                            <span className="text-[#5C6B62]">Document name:</span>
                            <span className="font-mono text-[11px] truncate max-w-[180px]" title={item.fileName}>
                              {item.fileName}
                            </span>
                          </div>
                        )}
                        {item.checksumSha256 && (
                          <div className="flex items-center justify-between">
                            <span className="text-[#5C6B62]">Checksum (SHA-256):</span>
                            <span className="font-mono text-[10px] text-[#1E4D38] bg-[#EAF4EF] px-1 rounded">
                              {item.checksumSha256.substring(0, 14)}...
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[#8C9B91] italic pt-1">
                        Awaiting PI submission & document metadata
                      </p>
                    )}
                  </div>

                  {/* VERIFICATION PROVENANCE */}
                  <div className="p-3 rounded-lg border border-[#E8E5DC] bg-white space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62]">
                      Review & Determination
                    </div>
                    {isVerified ? (
                      <div className="space-y-1 text-[#1E2922]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#5C6B62]">Determined by:</span>
                          <span className="font-medium text-[#1E4D38]">
                            {item.verifiedBy || item.reviewerRole || 'Designated Reviewer'}
                          </span>
                        </div>
                        {item.verifiedAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-[#5C6B62]">Verified at:</span>
                            <span className="font-mono text-[11px]">{formatTimestamp(item.verifiedAt)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[#5C6B62]">Audit verification:</span>
                          <span className="font-mono text-[10px] text-[#1E4D38] bg-[#EAF4EF] px-1 rounded">
                            {item.verificationHash || '0x8A1F9E3B'}
                          </span>
                        </div>
                      </div>
                    ) : isChangesRequested ? (
                      <p className="text-xs text-rose-800 italic pt-1">
                        Changes requested. Re-submission required before sign-off.
                      </p>
                    ) : isAwaiting ? (
                      <p className="text-xs text-blue-800 italic pt-1">
                        Under formal governance review.
                      </p>
                    ) : (
                      <p className="text-xs text-[#8C9B91] italic pt-1">
                        Pending prior submission
                      </p>
                    )}
                  </div>
                </div>

                {/* EVD-03 NESTED SITE-SPECIFIC EVIDENCE SECTION */}
                {item.id === 'EVD-03' && affectedSites.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#E8E5DC] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#1E4D38]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E2922]">
                          Affected CTRI Participating Sites ({verifiedSiteCount} / {totalAffectedSites} Verified)
                        </h4>
                      </div>
                      <span className="text-[11px] text-[#5C6B62]">
                        Excludes unaffected sites
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-[#E8E5DC] rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#FAF9F4] border-b border-[#E8E5DC] text-[#5C6B62] font-semibold text-[11px]">
                            <th className="py-2.5 px-3">Site / Center</th>
                            <th className="py-2.5 px-3">Training Status</th>
                            <th className="py-2.5 px-3">Evidence State</th>
                            <th className="py-2.5 px-3">Monitor Review</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E5DC] bg-white">
                          {affectedSites.map((site) => {
                            const isSiteVerified =
                              site.verificationStatus === 'VERIFIED' || site.trainingStatus === 'VERIFIED';
                            const isSiteChanges =
                              site.trainingStatus === 'CHANGES_REQUESTED' ||
                              site.evidenceStatus === 'CHANGES_REQUESTED' ||
                              site.verificationStatus === 'CHANGES_REQUESTED';
                            const isSiteCompleted =
                              site.trainingStatus === 'COMPLETED' && !isSiteVerified && !isSiteChanges;

                            return (
                              <tr key={site.siteId} className="hover:bg-[#FAF9F4]/70 transition-colors">
                                <td className="py-3 px-3">
                                  <div className="font-bold text-[#1E2922]">{site.siteName}</div>
                                  <div className="text-[10px] text-[#5C6B62] font-mono">
                                    {site.siteCode || site.siteId} • {site.location || 'India'}
                                  </div>
                                  {isSiteChanges && (site.rejectionReason || site.verificationNote) && (
                                    <div className="mt-1 text-[11px] text-rose-800 italic bg-rose-50 p-1.5 rounded border border-rose-200">
                                      Note: &ldquo;{site.rejectionReason || site.verificationNote}&rdquo;
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  {isSiteVerified ? (
                                    <span className="text-[#1E4D38] font-medium flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Verified
                                    </span>
                                  ) : isSiteChanges ? (
                                    <span className="text-rose-800 font-medium flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Changes requested
                                    </span>
                                  ) : isSiteCompleted ? (
                                    <span className="text-[#1E2922] font-medium">Completed</span>
                                  ) : (
                                    <span className="text-[#5C6B62]">Required</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  {isSiteVerified ? (
                                    <span className="text-[#1E4D38] font-medium">Verified</span>
                                  ) : isSiteChanges ? (
                                    <span className="text-rose-800 font-medium">Changes requested</span>
                                  ) : isSiteCompleted ? (
                                    <span className="text-blue-800 font-medium">Awaiting review</span>
                                  ) : (
                                    <span className="text-[#5C6B62]">Required</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  {isSiteVerified ? (
                                    <span className="text-[#1E4D38] font-medium">Verified</span>
                                  ) : isSiteChanges ? (
                                    <span className="text-rose-800 font-medium">Changes requested</span>
                                  ) : (
                                    <span className="text-[#5C6B62]">Pending</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  {/* Role-aware actions for site training */}
                                  {isCRA || isAdmin ? (
                                    isSiteVerified ? (
                                      <span className="text-[11px] text-[#1E4D38] font-medium">Verified</span>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => handleVerifySite(site)}
                                          disabled={siteActionPending === site.siteId}
                                          className="px-2.5 py-1 rounded bg-[#1E4D38] hover:bg-[#163B2B] text-white text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                          Verify
                                        </button>
                                        <button
                                          onClick={() => handleOpenRejectSite(site)}
                                          disabled={siteActionPending === site.siteId}
                                          className="px-2.5 py-1 rounded border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 text-[11px] font-semibold transition-colors cursor-pointer"
                                        >
                                          Request changes
                                        </button>
                                      </div>
                                    )
                                  ) : isPI ? (
                                    isSiteVerified ? (
                                      <span className="text-[11px] text-[#1E4D38] font-medium">Verified</span>
                                    ) : (
                                      <button
                                        onClick={() => handleOpenCompleteSite(site)}
                                        className="px-2.5 py-1 rounded bg-[#1E4D38] hover:bg-[#163B2B] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                      >
                                        {isSiteChanges ? 'Resubmit training' : 'Complete training'}
                                      </button>
                                    )
                                  ) : (
                                    <span className="text-[11px] text-[#8C9B91]">Read-only</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ROW ACTIONS FOR EVD-01, EVD-02, EVD-04 */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-[#5C6B62]">
                    {item.id === 'EVD-01' && 'Central Ethics Committee review authority'}
                    {item.id === 'EVD-02' && 'Central Ethics Committee & PI review authority'}
                    {item.id === 'EVD-03' && 'Lead Clinical Research Associate (CRA) monitoring authority'}
                    {item.id === 'EVD-04' && 'Data Management & EDC Schema verification'}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* PI SUBMISSION / RESUBMISSION */}
                    {isPI && !isVerified && (
                      <button
                        onClick={() => onOpenUpload(item)}
                        className="px-4 py-2 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        {isChangesRequested ? 'Resubmit Dossier →' : isAwaiting ? 'Update Submission' : 'Submit Evidence Dossier →'}
                      </button>
                    )}

                    {/* ETHICS REVIEWER ACTIONS FOR EVD-01 & EVD-02 */}
                    {(isEthics || isAdmin) && (item.id === 'EVD-01' || item.id === 'EVD-02') && (
                      <button
                        onClick={() => onOpenReview(item)}
                        className="px-4 py-2 rounded-lg border border-[#E2DFD6] bg-white hover:bg-[#FAF9F4] text-xs font-semibold text-[#1E2922] transition-colors cursor-pointer shadow-xs"
                      >
                        {isVerified ? 'View Sign-off' : 'Review & Verify →'}
                      </button>
                    )}

                    {/* CRA ACTIONS FOR EVD-03 */}
                    {(isCRA || isAdmin) && item.id === 'EVD-03' && (
                      <button
                        onClick={() => onOpenReview(item)}
                        className="px-4 py-2 rounded-lg border border-[#E2DFD6] bg-white hover:bg-[#FAF9F4] text-xs font-semibold text-[#1E2922] transition-colors cursor-pointer shadow-xs"
                      >
                        {isVerified ? 'View Training Sign-off' : 'Docket Training Review →'}
                      </button>
                    )}

                    {/* VIEW DETAILS IF VERIFIED */}
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#1E4D38] font-semibold">
                        <Lock className="w-3.5 h-3.5" />
                        Signed & Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. RECENT GOVERNANCE ACTIVITY / AUDIT SNIPPET */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E5DC] pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#1E4D38]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E2922] font-mono">
              Recent Evidence & Governance Activity
            </h3>
          </div>
          <button
            onClick={onOpenAudit}
            className="text-xs font-semibold text-[#1E4D38] hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <span>View complete audit log</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentAudits.length > 0 ? (
          <div className="divide-y divide-[#E8E5DC]">
            {recentAudits.map((evt) => (
              <div key={evt.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-[#1E2922]">{evt.title}</div>
                  <div className="text-[11px] text-[#5C6B62]">{evt.description}</div>
                </div>
                <div className="text-right text-[11px] text-[#8C9B91] shrink-0 font-mono">
                  <div>{evt.actor}</div>
                  <div>{evt.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#8C9B91] italic py-2">
            {loadingAudit ? 'Loading audit records...' : 'No evidence governance events logged yet.'}
          </p>
        )}
      </section>

      {/* MODAL: CRA REQUEST CHANGES ON SITE */}
      {rejectSiteModalOpen && selectedRejectSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E2DFD6]">
            <div className="flex items-center gap-2 text-rose-900 border-b border-[#E8E5DC] pb-3">
              <AlertTriangle className="w-5 h-5 text-rose-700" />
              <h3 className="text-sm font-bold">Request Training Revisions</h3>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#1E2922]">
                Site: <strong>{selectedRejectSite.siteName}</strong>
              </p>
              <p className="text-[#5C6B62]">
                Please specify the missing signatures, incomplete modules, or documentation issues that the site team must correct:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Page 2 missing investigator signature. CRC log incomplete."
                rows={3}
                className="w-full p-3 rounded-lg border border-[#E2DFD6] text-xs text-[#1E2922] focus:outline-none focus:border-[#1E4D38]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectSiteModalOpen(false)}
                disabled={isRejecting}
                className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSiteReject}
                disabled={isRejecting}
                className="px-4 py-2 rounded-lg bg-rose-800 hover:bg-rose-900 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isRejecting ? 'Submitting...' : 'Send Revision Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PI COMPLETE TRAINING ON SITE */}
      {completeSiteModalOpen && selectedCompleteSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E2DFD6]">
            <div className="flex items-center gap-2 text-[#1E4D38] border-b border-[#E8E5DC] pb-3">
              <GraduationCap className="w-5 h-5 text-[#1E4D38]" />
              <h3 className="text-sm font-bold">Attest Site Training Completion</h3>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#1E2922]">
                Site: <strong>{selectedCompleteSite.siteName}</strong>
              </p>
              <p className="text-[#5C6B62]">
                Confirm that site investigators and CRCs have completed operational training on protocol changes under {changeSetId}.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-[#5C6B62] mb-1">
                  Attesting Investigator / Coordinator Name:
                </label>
                <input
                  type="text"
                  value={completedByName}
                  onChange={(e) => setCompletedByName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E2DFD6] text-xs text-[#1E2922] focus:outline-none focus:border-[#1E4D38]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCompleteSiteModalOpen(false)}
                disabled={isCompleting}
                className="px-4 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSiteComplete}
                disabled={isCompleting}
                className="px-4 py-2 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isCompleting ? 'Submitting...' : 'Submit Training Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
