import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building2,
  FileText,
  History,
  ArrowRight,
  RotateCcw,
  Check,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import {
  ReadinessSummary,
  EvidenceItem,
  Finding,
  ReadinessBlocker,
} from '../../services/compilerService';
import { SiteTrainingEvidence } from '../../types/trialOps';
import { siteService } from '../../services/siteService';
import { useToast } from '../../hooks/useToast';

interface AmendmentReadinessWorkspaceProps {
  changeSetId?: string;
  readiness: ReadinessSummary;
  evidenceList: EvidenceItem[];
  findings: Finding[];
  onOpenUpload: (item: EvidenceItem) => void;
  onOpenReview: (item: EvidenceItem) => void;
  onOpenAudit: () => void;
  onRefresh: () => Promise<void>;
  isPI: boolean;
  isCRA: boolean;
  isEthics: boolean;
  isAdmin: boolean;
  onNavigateToEvidence?: () => void;
}

interface AuditSnippet {
  id: number;
  title: string;
  actor: string;
  timestamp: string;
  description: string;
  status: string;
}

export const AmendmentReadinessWorkspace: React.FC<AmendmentReadinessWorkspaceProps> = ({
  changeSetId = 'CS-0001',
  readiness,
  evidenceList,
  findings,
  onOpenUpload,
  onOpenReview,
  onOpenAudit,
  onRefresh,
  isPI,
  isCRA,
  isEthics,
  isAdmin,
  onNavigateToEvidence,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [recentAudits, setRecentAudits] = useState<AuditSnippet[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [siteActionPending, setSiteActionPending] = useState<string | null>(null);

  // Quick CRA reject modal state
  const [rejectSiteModalOpen, setRejectSiteModalOpen] = useState(false);
  const [selectedRejectSite, setSelectedRejectSite] = useState<SiteTrainingEvidence | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Load latest audit logs
  useEffect(() => {
    const fetchRecentAudit = async () => {
      setLoadingAudit(true);
      try {
        const res = await fetch(`/api/v1/audit/trail?changeSetId=${changeSetId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Take the last 3 events in reverse chronological order
            const reversed = [...data].reverse().slice(0, 3);
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
        console.warn('Unable to load recent audit trail', err);
      } finally {
        setLoadingAudit(false);
      }
    };
    fetchRecentAudit();
  }, [changeSetId, readiness]);

  // EVD-03 specific data
  const evd03 = evidenceList.find((e) => e.id === 'EVD-03');
  const affectedSiteList: SiteTrainingEvidence[] = (evd03?.siteEvidence || []).filter(
    (s) => s.impactStatus !== 'NOT_AFFECTED'
  );

  const isReady = readiness.status === 'READY' || readiness.overallState === 'READY';
  const blockers: ReadinessBlocker[] = readiness.blockers || [];

  // CRA direct verification handler
  const handleVerifySite = async (site: SiteTrainingEvidence) => {
    if (!isCRA && !isAdmin) {
      showToast('Unauthorized', 'Only CRA Monitors or Administrators can verify site training.', 'error');
      return;
    }
    setSiteActionPending(site.siteId);
    try {
      await siteService.verifySiteTraining(site.siteId, { changeSetId, verifiedBy: 'Lead Clinical Monitor' });
      showToast('Site Training Verified', `Successfully verified training for ${site.siteName}.`, 'success');
      await onRefresh();
    } catch (err: any) {
      showToast('Verification Failed', err.message || 'Error verifying site training', 'error');
    } finally {
      setSiteActionPending(null);
    }
  };

  // PI direct completion/resubmission handler
  const handleCompleteSite = async (site: SiteTrainingEvidence) => {
    if (!isPI && !isAdmin) {
      showToast('Unauthorized', 'Only Principal Investigators or Study Coordinators can submit site training.', 'error');
      return;
    }
    setSiteActionPending(site.siteId);
    try {
      await siteService.completeSiteTraining(site.siteId, { changeSetId, completedBy: 'Dr. V. Sharma (Lead PI)' });
      showToast('Training Submitted', `Training log submitted for ${site.siteName}. Awaiting monitor review.`, 'success');
      await onRefresh();
    } catch (err: any) {
      showToast('Submission Failed', err.message || 'Error completing site training', 'error');
    } finally {
      setSiteActionPending(null);
    }
  };

  const handleOpenRejectModal = (site: SiteTrainingEvidence) => {
    setSelectedRejectSite(site);
    setRejectReason('Training documentation missing required investigator signatures.');
    setRejectSiteModalOpen(true);
  };

  const handleConfirmRejectSite = async () => {
    if (!selectedRejectSite || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      await siteService.requestChangesSiteTraining(
        selectedRejectSite.siteId,
        {
          changeSetId,
          rejectionReason: rejectReason.trim(),
          verifiedBy: 'Lead Clinical Monitor',
        }
      );
      showToast('Changes Requested', `Requested changes for ${selectedRejectSite.siteName}.`, 'warning');
      setRejectSiteModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      showToast('Action Failed', err.message || 'Error requesting changes', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. READINESS HEADER & OVERALL CERTIFICATION STATE */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E5DC] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C6B62] font-mono">
                Amendment {readiness.changeSet || changeSetId}
              </span>
              <span className="text-[#8C9B91]">·</span>
              <span className="text-xs font-medium text-[#5C6B62]">Protocol {readiness.protocol || 'v1.1'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E2922] font-serif">
              Amendment Readiness & Governance
            </h1>
            <p className="text-xs text-[#5C6B62]">
              Authoritative validation workspace for multi-center trial protocol implementation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`px-4 py-2 rounded-lg border flex items-center gap-2.5 ${
                isReady
                  ? 'bg-[#EAF4EF] border-[#C5DFD2] text-[#1E4D38]'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}
            >
              {isReady ? (
                <CheckCircle2 className="w-5 h-5 text-[#1E4D38]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-700" />
              )}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block font-mono">
                  {isReady ? 'READY' : 'NOT READY'}
                </span>
                <span className="text-[11px] opacity-80 block">
                  {isReady
                    ? 'All governance checks satisfied'
                    : `${blockers.length} active blocker${blockers.length === 1 ? '' : 's'}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. GOVERNANCE READINESS DIMENSIONS */}
        <div className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#5C6B62] font-mono">
              Readiness Dimensions
            </h2>
            <span className="text-xs text-[#5C6B62]">
              {(readiness.dimensions || []).filter((d) => d.isComplete || d.status === 'COMPLETE').length} of{' '}
              {readiness.dimensions?.length || 5} complete
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(readiness.dimensions || []).map((dim) => {
              const isDimComplete = dim.isComplete || dim.status === 'COMPLETE';
              return (
                <div
                  key={dim.name}
                  className={`p-3.5 rounded-lg border transition-colors ${
                    isDimComplete
                      ? 'bg-[#FAF9F4] border-[#E2DFD6]'
                      : 'bg-amber-50/40 border-amber-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#1E2922]">{dim.name}</span>
                    {isDimComplete ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E4D38]">
                        <Check className="w-3.5 h-3.5 text-[#1E4D38] stroke-[2.5]" /> Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800">
                        <Clock className="w-3 h-3 text-amber-700" /> Pending
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#5C6B62] leading-tight">
                    {dim.details || (isDimComplete ? 'Verified' : 'Action required')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. WHAT IS BLOCKING READINESS? */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E5DC] pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E2922] font-mono">
              What is blocking readiness?
            </h2>
            <p className="text-xs text-[#5C6B62] mt-0.5">
              Outstanding findings, unverified site records, and action items required before rollout.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#5C6B62]">
            {blockers.length === 0 ? '0 Blockers' : `${blockers.length} Item${blockers.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {blockers.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#EAF4EF]/70 border border-[#C5DFD2] flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#1E4D38] shrink-0" />
            <span className="text-xs font-medium text-[#1E4D38]">
              All required governance checks and affected-site evidence have been verified.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-[#E8E5DC]">
            {blockers.map((blk, idx) => {
              const isChangesRequested =
                blk.status.toLowerCase().includes('changes') || blk.status.toLowerCase().includes('reject');
              const isRequired = blk.status.toLowerCase().includes('require');
              const isReviewPending = blk.status.toLowerCase().includes('await') || blk.status.toLowerCase().includes('review');

              return (
                <div key={blk.id || idx} className="py-3.5 first:pt-1 last:pb-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1E2922]">
                        {idx + 1}. {blk.title}
                      </span>
                      <span className="text-xs text-[#8C9B91]">·</span>
                      <span className="text-xs font-medium text-[#5C6B62]">{blk.requirementName}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isChangesRequested
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isReviewPending
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        }`}
                      >
                        {blk.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#5C6B62]">{blk.explanation}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role-aware contextual quick action */}
                    {blk.category === 'TRAINING' && blk.siteId && (
                      <>
                        {isChangesRequested && (isPI || isAdmin) && (
                          <button
                            onClick={() => {
                              const site = affectedSiteList.find((s) => s.siteId === blk.siteId);
                              if (site) handleCompleteSite(site);
                            }}
                            disabled={siteActionPending === blk.siteId}
                            className="px-3 py-1.5 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            Resubmit training →
                          </button>
                        )}

                        {isRequired && (isPI || isAdmin) && (
                          <button
                            onClick={() => {
                              const site = affectedSiteList.find((s) => s.siteId === blk.siteId);
                              if (site) handleCompleteSite(site);
                            }}
                            disabled={siteActionPending === blk.siteId}
                            className="px-3 py-1.5 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            Complete training →
                          </button>
                        )}

                        {isReviewPending && (isCRA || isAdmin) && (
                          <button
                            onClick={() => {
                              const site = affectedSiteList.find((s) => s.siteId === blk.siteId);
                              if (site) handleVerifySite(site);
                            }}
                            disabled={siteActionPending === blk.siteId}
                            className="px-3 py-1.5 rounded-lg bg-[#1E4D38] hover:bg-[#163B2B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            Verify training →
                          </button>
                        )}
                      </>
                    )}

                    {blk.category === 'ETHICS' && (
                      <button
                        onClick={() => {
                          const evd = evidenceList.find((e) => e.id === 'EVD-01');
                          if (evd) {
                            if (evd.status === 'SUBMITTED' && (isEthics || isCRA || isAdmin)) {
                              onOpenReview(evd);
                            } else {
                              onOpenUpload(evd);
                            }
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#E2DFD6] hover:bg-[#FAF9F4] text-xs font-semibold text-[#1E2922] transition-colors cursor-pointer"
                      >
                        Resolve EVD-01 →
                      </button>
                    )}

                    {blk.category === 'EVIDENCE' && (
                      <button
                        onClick={() => {
                          const evd = evidenceList.find((e) => e.id === 'EVD-02');
                          if (evd) {
                            if (evd.status === 'SUBMITTED' && (isCRA || isEthics || isAdmin)) {
                              onOpenReview(evd);
                            } else {
                              onOpenUpload(evd);
                            }
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#E2DFD6] hover:bg-[#FAF9F4] text-xs font-semibold text-[#1E2922] transition-colors cursor-pointer"
                      >
                        Resolve EVD-02 →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. AFFECTED SITE PROGRESS (EVD-03 SITE-SPECIFIC EVIDENCE) */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E5DC] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E2922] font-mono">
                Affected Site Progress
              </h2>
              <span className="text-xs font-semibold text-[#5C6B62] bg-[#FAF9F4] px-2 py-0.5 rounded border border-[#E2DFD6]">
                EVD-03 · {evd03?.verifiedSitesCount ?? 0} of {evd03?.affectedSitesCount ?? affectedSiteList.length} sites verified
              </span>
            </div>
            <p className="text-xs text-[#5C6B62] mt-0.5">
              Multi-center protocol training and evidence verification across impacted trial sites.
            </p>
          </div>

          <button
            onClick={() => navigate('/sites')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E4D38] hover:text-[#163B2B] self-start sm:self-auto cursor-pointer"
          >
            <span>Study sites directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {affectedSiteList.length === 0 ? (
          <p className="text-xs text-[#5C6B62] py-2">No participating sites affected by this amendment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E5DC] text-[#5C6B62] font-semibold text-[11px]">
                  <th className="pb-3 font-medium">Site</th>
                  <th className="pb-3 font-medium">Training</th>
                  <th className="pb-3 font-medium">Evidence</th>
                  <th className="pb-3 font-medium">Monitor Verification</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DC]">
                {affectedSiteList.map((site) => {
                  const isVerified = site.trainingStatus === 'VERIFIED' && site.evidenceStatus === 'VERIFIED';
                  const isChangesRequested = site.trainingStatus === 'REJECTED' || site.evidenceStatus === 'CHANGES_REQUESTED';
                  const isCompleted = site.trainingStatus === 'COMPLETED';
                  const isRequired = site.trainingStatus === 'REQUIRED';

                  return (
                    <tr key={site.siteId} className="hover:bg-[#FAF9F4]/60 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-[#5C6B62] shrink-0" />
                          <div>
                            <span className="font-semibold text-[#1E2922] block">{site.siteName}</span>
                            <span className="text-[10px] text-[#5C6B62] font-mono">
                              {site.city}{site.state ? `, ${site.state}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isVerified
                              ? 'text-[#1E4D38] bg-[#EAF4EF]'
                              : isChangesRequested
                              ? 'text-amber-800 bg-amber-50'
                              : isCompleted
                              ? 'text-blue-800 bg-blue-50'
                              : 'text-[#5C6B62] bg-zinc-100'
                          }`}
                        >
                          {isVerified ? '✓ Verified' : isChangesRequested ? '! Changes requested' : isCompleted ? 'Completed' : '○ Required'}
                        </span>
                      </td>

                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            site.evidenceStatus === 'VERIFIED'
                              ? 'text-[#1E4D38] bg-[#EAF4EF]'
                              : site.evidenceStatus === 'CHANGES_REQUESTED'
                              ? 'text-amber-800 bg-amber-50'
                              : site.evidenceStatus === 'SUBMITTED' || site.evidenceStatus === 'AWAITING_REVIEW'
                              ? 'text-blue-800 bg-blue-50'
                              : 'text-[#5C6B62] bg-zinc-100'
                          }`}
                        >
                          {site.evidenceStatus === 'VERIFIED'
                            ? 'Verified'
                            : site.evidenceStatus === 'CHANGES_REQUESTED'
                            ? 'Changes requested'
                            : site.evidenceStatus === 'SUBMITTED' || site.evidenceStatus === 'AWAITING_REVIEW'
                            ? 'Awaiting review'
                            : 'Required'}
                        </span>
                      </td>

                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            site.verificationStatus === 'VERIFIED'
                              ? 'text-[#1E4D38] bg-[#EAF4EF]'
                              : site.verificationStatus === 'CHANGES_REQUESTED'
                              ? 'text-amber-800 bg-amber-50'
                              : 'text-[#5C6B62] bg-zinc-100'
                          }`}
                        >
                          {site.verificationStatus === 'VERIFIED'
                            ? 'Verified'
                            : site.verificationStatus === 'CHANGES_REQUESTED'
                            ? 'Changes requested'
                            : 'Pending'}
                        </span>
                      </td>

                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* CRA Verify Button */}
                          {(isCRA || isAdmin) && site.trainingStatus === 'COMPLETED' && (
                            <button
                              onClick={() => handleVerifySite(site)}
                              disabled={siteActionPending === site.siteId}
                              className="px-2.5 py-1 rounded bg-[#1E4D38] hover:bg-[#163B2B] text-white text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                              Verify
                            </button>
                          )}

                          {/* CRA Request Changes Button */}
                          {(isCRA || isAdmin) && (site.trainingStatus === 'COMPLETED' || site.trainingStatus === 'VERIFIED') && (
                            <button
                              onClick={() => handleOpenRejectModal(site)}
                              disabled={siteActionPending === site.siteId}
                              className="px-2 py-1 rounded border border-amber-300 text-amber-900 hover:bg-amber-50 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Request changes
                            </button>
                          )}

                          {/* PI Complete / Resubmit Button */}
                          {(isPI || isAdmin) && (site.trainingStatus === 'REQUIRED' || site.trainingStatus === 'REJECTED') && (
                            <button
                              onClick={() => handleCompleteSite(site)}
                              disabled={siteActionPending === site.siteId}
                              className="px-2.5 py-1 rounded bg-[#1E4D38] hover:bg-[#163B2B] text-white text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                              {site.trainingStatus === 'REJECTED' ? 'Resubmit' : 'Complete training'}
                            </button>
                          )}

                          {isEthics && (
                            <span className="text-[11px] text-[#8C9B91] italic">Read-only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. RECENT GOVERNANCE ACTIVITY (IMMUTABLE AUDIT TRAIL) */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E5DC] pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#1E4D38]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E2922] font-mono">
              Recent Governance Activity
            </h2>
          </div>

          <button
            onClick={onOpenAudit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2DFD6] hover:bg-[#FAF9F4] text-xs font-semibold text-[#1E2922] transition-colors cursor-pointer"
          >
            <span>View full audit trail</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#5C6B62]" />
          </button>
        </div>

        {loadingAudit ? (
          <p className="text-xs text-[#5C6B62] py-2">Loading governance log...</p>
        ) : recentAudits.length === 0 ? (
          <p className="text-xs text-[#5C6B62] py-2">No activity logged yet.</p>
        ) : (
          <div className="divide-y divide-[#E8E5DC]">
            {recentAudits.map((item) => (
              <div key={item.id} className="py-2.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1E2922]">{item.title}</span>
                    <span className="text-[#8C9B91]">·</span>
                    <span className="text-[11px] text-[#5C6B62]">{item.actor}</span>
                  </div>
                  <p className="text-[11px] text-[#5C6B62]">{item.description}</p>
                </div>
                <span className="text-[10px] text-[#8C9B91] font-mono shrink-0">{item.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CRA REQUEST CHANGES MODAL */}
      {rejectSiteModalOpen && selectedRejectSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E2DFD6] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1E2922]">Request Training Changes</h3>
              <p className="text-xs text-[#5C6B62]">
                Provide feedback for {selectedRejectSite.siteName}. This will return the training evidence to the Site PI for resubmission.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1E2922]">Reason for Change Request</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-[#E2DFD6] focus:outline-none focus:ring-1 focus:ring-[#1E4D38]"
                placeholder="Specify the missing or incorrect training documentation..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectSiteModalOpen(false)}
                disabled={isRejecting}
                className="px-3.5 py-2 rounded-lg border border-[#E2DFD6] text-xs font-semibold text-[#5C6B62] hover:bg-[#FAF9F4] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectSite}
                disabled={isRejecting || !rejectReason.trim()}
                className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {isRejecting ? 'Submitting...' : 'Request Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
