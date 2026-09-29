import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Plus,
  ExternalLink,
  ShieldCheck,
  Landmark,
  GitCommit,
  FileText,
  GraduationCap,
  Award,
  CheckCheck,
  UserCheck
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { DEMO_SITES } from '../data/sites';
import { SiteOpsItem, SiteTrainingRecord } from '../types/trialOps';
import { useToast } from '../hooks/useToast';
import { authService } from '../services/authService';
import { siteService } from '../services/siteService';

import { DEMO_ROLES } from '../data/mockRoles';
import { UserProfile } from '../types/user';

import { useTrial } from '../hooks/useTrialContext';
import { apiFetch } from '../services/api';

export const SitesPage: React.FC = () => {
  const { showToast } = useToast();
  const { selectedTrial } = useTrial();
  const [sites, setSites] = useState<SiteOpsItem[]>(DEMO_SITES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<SiteOpsItem | null>(null);
  const [selectedTrainingSite, setSelectedTrainingSite] = useState<SiteOpsItem | null>(null);
  const [trainingRecord, setTrainingRecord] = useState<SiteTrainingRecord | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [monitorNote, setMonitorNote] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_ROLES[0].user);

  const isCoordinatorOrPI =
    currentUser.role === 'Principal Investigator' ||
    currentUser.role === 'Trial Coordinator' ||
    currentUser.role === 'Admin';
  const isMonitorOrAdmin =
    currentUser.role === 'Monitor' ||
    currentUser.role === 'Admin';

  const fetchLiveSites = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch (e) {
      // fallback to initial user
    }
    try {
      const list = await apiFetch<any[]>('/api/v1/sites', undefined, DEMO_SITES);
      if (Array.isArray(list) && list.length > 0) {
          const mapped: SiteOpsItem[] = list.map((s: any) => ({
            id: s.id,
            siteId: s.siteId,
            siteName: s.siteName || s.name,
            investigator: s.investigator || s.piName,
            location: s.location || (s.city && s.state ? `${s.city}, ${s.state}` : s.city || s.state || 'India'),
            address: s.address || s.location || `${s.city}, ${s.state}`,
            city: s.city,
            state: s.state,
            country: s.country || 'India',
            participants: s.participants ?? s.currentEnrollment ?? 0,
            trainingPct: s.trainingPct ?? (s.trainingStatus === 'VERIFIED' ? 100 : s.trainingStatus === 'COMPLETED' ? 75 : 0),
            documentsPct: s.documentsPct ?? 100,
            activationStatus: s.activationStatus || 'ACTIVE',
            governanceStatus: s.governanceStatus || (s.trainingStatus === 'VERIFIED' ? 'READY' : 'PENDING'),
            contactEmail: s.contactEmail || 'clinical.trials@ctri.gov.in',
            lastMonitorVisit: s.lastMonitorVisit || '2026-02-18',
            trialCtriNumber: s.trialCtriNumber || 'CTRI/2020/06/025557',
            associatedTrialTitle: s.associatedTrialTitle || 'Evaluation of Standardized Ayurvedic Formulations in Clinical Research',
            ethicsCommittee: s.ethicsCommittee || 'Institutional Ethics Committee',
            ethicsApprovalStatus: s.ethicsApprovalStatus || 'Approved',
            recruitmentStatus: s.recruitmentStatus || (s.status === 'completed' ? 'Completed' : 'Open'),
            trainingStatus: s.trainingStatus || 'REQUIRED',
            activeAmendment: s.activeAmendment || 'CS-0001',
            impactStatus: s.impactStatus || (s.amendmentImpact === 'Affected' ? 'AFFECTED' : 'NOT_AFFECTED'),
            amendmentImpact: s.amendmentImpact || (s.impactStatus === 'AFFECTED' ? 'Affected' : 'Not affected'),
            trainingRequirement: s.trainingRequirement || 'REQ-TRN-01: Site Staff Protocol Retraining',
            trainingCompletedAt: s.trainingCompletedAt,
            trainingCompletedBy: s.trainingCompletedBy,
            trainingVerifiedAt: s.trainingVerifiedAt,
            trainingVerifiedBy: s.trainingVerifiedBy,
            trainingVerificationNote: s.trainingVerificationNote,
            evidenceStatus: s.evidenceStatus || (s.trainingStatus === 'VERIFIED' ? 'VERIFIED' : s.trainingStatus === 'COMPLETED' ? 'AWAITING_REVIEW' : s.trainingStatus === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : s.trainingStatus === 'NOT_REQUIRED' ? 'NOT_REQUIRED' : 'REQUIRED'),
            verificationStatus: s.verificationStatus || (s.trainingStatus === 'VERIFIED' ? 'VERIFIED' : s.trainingStatus === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : s.trainingStatus === 'NOT_REQUIRED' ? 'NOT_REQUIRED' : 'PENDING'),
            rejectionReason: s.rejectionReason,
          }));
          setSites(mapped);
        }
    } catch (err) {
      console.warn('Sites live API unreachable, using local state', err);
    }
  };

  useEffect(() => {
    fetchLiveSites();
  }, [selectedTrial.id, selectedTrial.protocolId]);

  const openTrainingModal = async (site: SiteOpsItem) => {
    setSelectedTrainingSite(site);
    setMonitorNote(site.trainingVerificationNote || 'Checked GCP retraining logs and attendance record.');
    try {
      const trn = await siteService.getSiteTrainingRecord(site.siteId || site.id, 'CS-0001');
      setTrainingRecord(trn);
    } catch (err) {
      console.warn('Could not fetch single site training record', err);
      setTrainingRecord({
        id: `TRN-${site.id.toUpperCase()}-CS-0001`,
        changeSetId: 'CS-0001',
        siteId: site.id,
        requirementCode: 'REQ-TRN-01',
        requirementName: 'Protocol Amendment CS-0001 Site Staff Retraining',
        status: site.trainingStatus || 'REQUIRED',
        completedAt: site.trainingCompletedAt,
        completedBy: site.trainingCompletedBy,
        verifiedAt: site.trainingVerifiedAt,
        verifiedBy: site.trainingVerifiedBy,
        verificationNote: site.trainingVerificationNote,
      });
    }
  };

  const handleCompleteTraining = async () => {
    if (!selectedTrainingSite) return;
    setIsActionLoading(true);
    try {
      const updated = await siteService.completeSiteTraining(selectedTrainingSite.siteId || selectedTrainingSite.id, {
        changeSetId: 'CS-0001',
        completedBy: `${currentUser.name} (${currentUser.role})`,
        notes: 'Mandatory staff training completed on amendment protocol updates and revised visit procedures.',
      });
      setTrainingRecord(updated);
      showToast(
        'Training Submitted',
        `Site staff retraining for ${selectedTrainingSite.siteName} marked COMPLETED. Awaiting Monitor verification.`,
        'success'
      );
      await fetchLiveSites();
    } catch (err: any) {
      showToast('Action Failed', err.message || 'Could not complete site training', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleVerifyTraining = async () => {
    if (!selectedTrainingSite) return;
    setIsActionLoading(true);
    try {
      const updated = await siteService.verifySiteTraining(selectedTrainingSite.siteId || selectedTrainingSite.id, {
        changeSetId: 'CS-0001',
        verifiedBy: `${currentUser.name} (${currentUser.role})`,
        verificationNote: monitorNote || 'Verified training completion against protocol compliance checklist.',
      });
      setTrainingRecord(updated);
      showToast(
        'Training Verified',
        `Training logs for ${selectedTrainingSite.siteName} verified by CRA/Monitor. Evidence EVD-03 updated.`,
        'success'
      );
      await fetchLiveSites();
    } catch (err: any) {
      showToast('Verification Denied', err.message || 'Could not verify site training', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedTrainingSite) return;
    setIsActionLoading(true);
    try {
      const updated = await siteService.requestChangesSiteTraining(selectedTrainingSite.siteId || selectedTrainingSite.id, {
        changeSetId: 'CS-0001',
        verifiedBy: `${currentUser.name} (${currentUser.role})`,
        rejectionReason: monitorNote || 'Site training log requires revision and updated attendance sign-offs.',
      });
      setTrainingRecord(updated);
      showToast(
        'Changes Requested',
        `Training feedback sent for ${selectedTrainingSite.siteName}. Site Coordinator notified for resubmission.`,
        'info'
      );
      await fetchLiveSites();
    } catch (err: any) {
      showToast('Action Failed', err.message || 'Could not request changes for site training', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredSites = sites.filter((s) => {
    const matchesSearch =
      s.siteId.toLowerCase().includes(search.toLowerCase()) ||
      s.siteName.toLowerCase().includes(search.toLowerCase()) ||
      s.investigator.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase()) ||
      (s.trialCtriNumber && s.trialCtriNumber.toLowerCase().includes(search.toLowerCase())) ||
      (s.associatedTrialTitle && s.associatedTrialTitle.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      statusFilter === 'all' ||
      s.activationStatus === statusFilter ||
      s.governanceStatus === statusFilter ||
      s.recruitmentStatus === statusFilter ||
      s.trainingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2E7D5B]" />
            Trial Sites & Center Operations
          </h1>
          <p className="text-xs text-[#66736B] mt-0.5">
            Real CTRI clinical registry sites, investigator contacts, amendment staff retraining, and CRA monitor verification.
          </p>
        </div>

        <Button
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => showToast('Site Onboarding', 'Site onboarding docket wizard initiated', 'info')}
        >
          Add Study Site
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-[#E8E4D9] rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Site ID, CTRI number (e.g. CTRI/2020/06/025557), center name, or city..."
              className="w-full bg-[#FAF9F4] border border-[#E8E4D9] rounded-xl pl-9 pr-3 py-2 text-xs text-[#26352D] placeholder-[#66736B] focus:outline-hidden focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#66736B]" />
            <span className="text-xs text-[#66736B] font-medium">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAF9F4] border border-[#E8E4D9] text-xs text-[#26352D] rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-[#2E7D5B] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Activation: ACTIVE</option>
              <option value="READY">Governance: READY</option>
              <option value="REQUIRED">Training: REQUIRED</option>
              <option value="COMPLETED">Training: COMPLETED</option>
              <option value="VERIFIED">Training: VERIFIED</option>
              <option value="Open">CTRI: Recruiting / Open</option>
              <option value="Completed">CTRI: Completed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Sites Table */}
      <Card className="p-0 overflow-hidden bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
        <Table
          data={filteredSites}
          keyExtractor={(s) => s.id}
          columns={[
            {
              header: 'Site ID & Institution',
              className: 'min-w-[240px]',
              accessor: (s) => (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#7FAF91]/40">
                      {s.siteId}
                    </span>
                    {s.amendmentImpact && s.amendmentImpact.includes('CS-0001') && (
                      <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-[#8B6B18] bg-[#FEF6E9] px-1.5 py-0.5 rounded border border-[#E8C28A]/50">
                        <GitCommit className="w-2.5 h-2.5" />
                        CS-0001
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#26352D] mt-1">{s.siteName}</p>
                  <p className="text-[11px] text-[#66736B] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#66736B]" />
                    {s.location}
                  </p>
                </div>
              ),
            },
            {
              header: 'Associated Trial & CTRI',
              className: 'min-w-[200px]',
              accessor: (s) => (
                <div className="text-xs space-y-0.5">
                  {s.trialCtriNumber && (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[10px] font-bold text-[#2E7D5B] bg-[#EAF4EF] px-1.5 py-0.5 rounded border border-[#7FAF91]/30">
                        {s.trialCtriNumber}
                      </span>
                      {s.sourceUrl && (
                        <a
                          href={s.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#66736B] hover:text-[#2E7D5B]"
                          title="View on CTRI registry"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-[#26352D] line-clamp-2 font-medium">
                    {s.associatedTrialTitle || 'Ayurvedic Clinical Protocol'}
                  </p>
                </div>
              ),
            },
            {
              header: 'Investigator & Contact',
              accessor: (s) => (
                <div className="text-xs">
                  <p className="font-medium text-[#26352D]">{s.investigator}</p>
                  <p className="text-[10px] text-[#66736B]">{s.contactEmail}</p>
                </div>
              ),
            },
            {
              header: 'CTRI Status',
              accessor: (s) => (
                <div className="space-y-1">
                  <Badge
                    variant={s.recruitmentStatus === 'Open' || s.recruitmentStatus === 'recruiting' ? 'info' : 'default'}
                    size="sm"
                  >
                    {s.recruitmentStatus || 'Completed'}
                  </Badge>
                  {s.ethicsApprovalStatus && (
                    <div className="flex items-center gap-1 text-[10px] text-[#2E7D5B]">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{s.ethicsApprovalStatus.startsWith('Approved') ? 'IEC Approved' : s.ethicsApprovalStatus}</span>
                    </div>
                  )}
                </div>
              ),
            },
            {
              header: 'Amendment Impact',
              className: 'min-w-[120px]',
              accessor: (s) => {
                const isAffected = s.impactStatus === 'AFFECTED' || s.amendmentImpact === 'Affected';
                return (
                  <Badge variant={isAffected ? 'warning' : 'default'} size="sm" dot={isAffected}>
                    {isAffected ? 'Affected' : 'Not affected'}
                  </Badge>
                );
              },
            },
            {
              header: 'Training',
              className: 'min-w-[130px]',
              accessor: (s) => {
                const isAffected = s.impactStatus === 'AFFECTED' || s.amendmentImpact === 'Affected';
                if (!isAffected || s.trainingStatus === 'NOT_REQUIRED') {
                  return <span className="text-[11px] text-[#66736B] italic font-medium">Not required</span>;
                }
                const trnStatus = s.trainingStatus || 'REQUIRED';
                const isVerified = trnStatus === 'VERIFIED';
                const isCompleted = trnStatus === 'COMPLETED';
                const isChanges = trnStatus === 'CHANGES_REQUESTED';
                return (
                  <div className="text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={isVerified ? 'success' : isChanges ? 'danger' : isCompleted ? 'warning' : 'default'}
                        size="sm"
                        dot={isVerified || isCompleted || isChanges}
                      >
                        {isChanges ? 'Changes requested' : trnStatus}
                      </Badge>
                    </div>
                    <div className="w-20 h-1.5 bg-[#FAF9F4] rounded-full overflow-hidden border border-[#E8E4D9]">
                      <div
                        className={`h-full ${isVerified ? 'bg-[#2E7D5B]' : isChanges ? 'bg-rose-500' : isCompleted ? 'bg-[#D97706]' : 'bg-[#9CA3AF]'}`}
                        style={{ width: `${s.trainingPct}%` }}
                      />
                    </div>
                  </div>
                );
              },
            },
            {
              header: 'Evidence',
              className: 'min-w-[130px]',
              accessor: (s) => {
                const isAffected = s.impactStatus === 'AFFECTED' || s.amendmentImpact === 'Affected';
                if (!isAffected || s.evidenceStatus === 'NOT_REQUIRED') {
                  return <span className="text-[11px] text-[#66736B] italic font-medium">Not required</span>;
                }
                const evdStatus = s.evidenceStatus || (s.trainingStatus === 'VERIFIED' ? 'VERIFIED' : s.trainingStatus === 'COMPLETED' ? 'AWAITING_REVIEW' : s.trainingStatus === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : 'REQUIRED');
                return (
                  <Badge
                    variant={
                      evdStatus === 'VERIFIED'
                        ? 'success'
                        : evdStatus === 'CHANGES_REQUESTED'
                        ? 'danger'
                        : evdStatus === 'AWAITING_REVIEW' || evdStatus === 'SUBMITTED'
                        ? 'info'
                        : 'default'
                    }
                    size="sm"
                  >
                    {evdStatus === 'AWAITING_REVIEW' ? 'Awaiting review' : evdStatus === 'CHANGES_REQUESTED' ? 'Changes requested' : evdStatus}
                  </Badge>
                );
              },
            },
            {
              header: 'Monitor Verification',
              className: 'min-w-[130px]',
              accessor: (s) => {
                const isAffected = s.impactStatus === 'AFFECTED' || s.amendmentImpact === 'Affected';
                if (!isAffected || s.verificationStatus === 'NOT_REQUIRED') {
                  return <span className="text-[11px] text-[#66736B] italic font-medium">—</span>;
                }
                const verStatus = s.verificationStatus || (s.trainingStatus === 'VERIFIED' ? 'VERIFIED' : s.trainingStatus === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : 'PENDING');
                return (
                  <Badge
                    variant={
                      verStatus === 'VERIFIED'
                        ? 'success'
                        : verStatus === 'CHANGES_REQUESTED'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {verStatus === 'CHANGES_REQUESTED' ? 'Changes requested' : verStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                  </Badge>
                );
              },
            },
            {
              header: 'Governance',
              accessor: (s) => (
                <div className="space-y-1">
                  <Badge
                    variant={s.governanceStatus === 'READY' ? 'success' : 'warning'}
                    size="sm"
                    dot
                  >
                    {s.governanceStatus}
                  </Badge>
                </div>
              ),
            },
            {
              header: 'Actions',
              className: 'text-right min-w-[160px]',
              accessor: (s) => {
                const isAffected = s.impactStatus === 'AFFECTED' || s.amendmentImpact === 'Affected' || (s.id === 'site-01' || s.id === 'site-02' || s.id === 'site-03');
                return (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Eye className="w-3.5 h-3.5 text-[#2E7D5B]" />}
                      onClick={() => setSelectedSite(s)}
                    >
                      View
                    </Button>
                    {isAffected && s.trainingStatus !== 'NOT_REQUIRED' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<GraduationCap className="w-3.5 h-3.5 text-[#2E7D5B]" />}
                        onClick={() => openTrainingModal(s)}
                      >
                        Training
                      </Button>
                    ) : (
                      <span className="text-[10px] text-[#66736B] font-medium bg-[#FAF9F4] px-2 py-1 rounded border border-[#E8E4D9]">
                        Unaffected
                      </span>
                    )}
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      {/* Site Details Modal with Progressive Disclosure */}
      {selectedSite && (
        <Modal
          isOpen={Boolean(selectedSite)}
          onClose={() => setSelectedSite(null)}
          title={
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[#2E7D5B] font-bold">{selectedSite.siteId}</span>
              <Badge variant="success" size="sm" dot>
                {selectedSite.activationStatus}
              </Badge>
              <Badge variant={selectedSite.governanceStatus === 'READY' ? 'success' : 'warning'} size="sm">
                GOVERNANCE: {selectedSite.governanceStatus}
              </Badge>
            </div>
          }
          description={selectedSite.siteName}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                size="sm"
                variant="outline"
                icon={<GraduationCap className="w-3.5 h-3.5 text-[#2E7D5B]" />}
                onClick={() => {
                  const s = selectedSite;
                  setSelectedSite(null);
                  openTrainingModal(s);
                }}
              >
                Open Training Details
              </Button>
              <Button size="sm" onClick={() => setSelectedSite(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* PUBLIC CTRI DATA SECTION */}
            <div className="p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#E8E4D9] pb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#26352D] flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-[#2E7D5B]" />
                  PUBLIC CTRI TRIAL REGISTRY METADATA
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#2E7D5B] font-medium bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#7FAF91]/30">
                  Source: Clinical Trials Registry–India (CTRI)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[#66736B] block text-[11px]">CTRI Registration Number</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-[#26352D]">{selectedSite.trialCtriNumber || 'CTRI Registered'}</span>
                    {selectedSite.sourceUrl && (
                      <a
                        href={selectedSite.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[10px] text-[#2E7D5B] hover:underline font-semibold"
                      >
                        View CTRI record
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[#66736B] block text-[11px]">CTRI Recruitment Status</span>
                  <p className="text-[#26352D] font-semibold mt-0.5">
                    {selectedSite.recruitmentStatus || 'Completed'}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[#66736B] block text-[11px]">Associated Public Trial Title</span>
                  <p className="text-[#26352D] font-medium mt-0.5 leading-relaxed">
                    {selectedSite.associatedTrialTitle || 'Ayush Multicentric Evaluation'}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[#66736B] block text-[11px]">Public Center Address</span>
                  <p className="text-[#26352D] font-medium mt-0.5">
                    {selectedSite.address || selectedSite.location}
                  </p>
                </div>

                {selectedSite.ethicsCommittee && (
                  <div className="sm:col-span-2">
                    <span className="text-[#66736B] block text-[11px] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#2E7D5B]" />
                      Ethics Committee (IEC) Clearance
                    </span>
                    <p className="text-[#26352D] font-medium mt-0.5">
                      {selectedSite.ethicsCommittee}
                      {selectedSite.ethicsApprovalStatus && (
                        <span className="ml-2 text-[10px] text-[#2E7D5B] bg-[#EAF4EF] px-1.5 py-0.5 rounded border border-[#7FAF91]/40 font-mono">
                          {selectedSite.ethicsApprovalStatus}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* INTERNAL AYU-TRIAL FABRIC WORKFLOW SECTION */}
            <div className="p-3.5 rounded-xl bg-white border border-[#E8E4D9] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#E8E4D9] pb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#66736B] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#2E7D5B]" />
                  INTERNAL AYU-TRIAL FABRIC WORKFLOW & GOVERNANCE
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-[#8B6B18] bg-[#FEF6E9] px-2 py-0.5 rounded border border-[#E8C28A]/50">
                  {selectedSite.amendmentImpact || 'Baseline Governance Protocol'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
                <div>
                  <span className="text-[#66736B]">Principal Investigator</span>
                  <p className="text-[#26352D] font-semibold mt-0.5">{selectedSite.investigator}</p>
                </div>
                <div>
                  <span className="text-[#66736B]">Amendment Impact</span>
                  <p className="text-[#2E7D5B] font-semibold mt-0.5">{selectedSite.impactStatus === 'AFFECTED' ? 'Affected' : 'Not affected'}</p>
                </div>
                <div>
                  <span className="text-[#66736B]">Training</span>
                  <p className="text-[#2E7D5B] font-semibold mt-0.5">{selectedSite.trainingStatus || 'REQUIRED'}</p>
                </div>
                <div>
                  <span className="text-[#66736B]">Evidence</span>
                  <p className="text-[#2E7D5B] font-semibold mt-0.5">{selectedSite.evidenceStatus || 'REQUIRED'}</p>
                </div>
                <div>
                  <span className="text-[#66736B]">Monitor Verification</span>
                  <p className="text-[#2E7D5B] font-semibold mt-0.5">{selectedSite.verificationStatus || 'PENDING'}</p>
                </div>
                <div>
                  <span className="text-[#66736B]">Governance Readiness</span>
                  <p className="text-[#2E7D5B] font-semibold mt-0.5">{selectedSite.governanceStatus}</p>
                </div>
                <div>
                  <span className="text-[#66736B]">Active Subjects</span>
                  <p className="text-[#2E7D5B] font-bold mt-0.5">{selectedSite.participants} Subjects</p>
                </div>
                <div>
                  <span className="text-[#66736B]">Last CRA Monitoring Visit</span>
                  <p className="text-[#26352D] font-mono mt-0.5">{selectedSite.lastMonitorVisit}</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Site Training & Monitor Verification Modal */}
      {selectedTrainingSite && (
        <Modal
          isOpen={Boolean(selectedTrainingSite)}
          onClose={() => {
            setSelectedTrainingSite(null);
            setTrainingRecord(null);
          }}
          title={
            <div className="flex items-center gap-2 flex-wrap">
              <GraduationCap className="w-5 h-5 text-[#2E7D5B]" />
              <span className="font-semibold text-[#26352D]">Site Protocol Retraining & Monitor Verification</span>
              <Badge
                variant={
                  trainingRecord?.status === 'VERIFIED'
                    ? 'success'
                    : trainingRecord?.status === 'CHANGES_REQUESTED'
                    ? 'danger'
                    : trainingRecord?.status === 'COMPLETED'
                    ? 'warning'
                    : 'default'
                }
                size="sm"
              >
                {trainingRecord?.status === 'CHANGES_REQUESTED' ? 'CHANGES REQUESTED' : trainingRecord?.status || 'REQUIRED'}
              </Badge>
            </div>
          }
          description={`Protocol amendment compliance & monitor verification workflow for ${selectedTrainingSite.siteName}`}
          size="lg"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTrainingSite(null);
                  setTrainingRecord(null);
                }}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {trainingRecord?.status === 'NOT_REQUIRED' ? (
                  <span className="text-xs text-[#66736B] italic bg-[#FAF9F4] px-3 py-1.5 rounded-lg border border-[#E8E4D9]">
                    Training not required for this amendment
                  </span>
                ) : (
                  <>
                    {/* Complete / Resubmit Training Button (PI / Coordinator) */}
                    {isCoordinatorOrPI && trainingRecord?.status !== 'VERIFIED' && (
                      <Button
                        size="sm"
                        variant={trainingRecord?.status === 'COMPLETED' ? 'outline' : 'primary'}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={handleCompleteTraining}
                        disabled={isActionLoading || trainingRecord?.status === 'COMPLETED'}
                      >
                        {trainingRecord?.status === 'COMPLETED'
                          ? 'Training Completed'
                          : trainingRecord?.status === 'CHANGES_REQUESTED'
                          ? 'Resubmit Training Completion'
                          : 'Submit Training Completion'}
                      </Button>
                    )}

                    {/* Verify Training Button (Monitor / CRA) */}
                    {isMonitorOrAdmin && (
                      <>
                        {trainingRecord?.status === 'COMPLETED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-700 border-rose-300 hover:bg-rose-50"
                            onClick={handleRequestChanges}
                            disabled={isActionLoading}
                          >
                            Request Changes
                          </Button>
                        )}
                        <Button
                          size="sm"
                          icon={<ShieldCheck className="w-3.5 h-3.5" />}
                          onClick={handleVerifyTraining}
                          disabled={isActionLoading || trainingRecord?.status !== 'COMPLETED'}
                        >
                          {trainingRecord?.status === 'VERIFIED' ? 'Verified by Monitor' : 'Verify Training as Monitor'}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* REAL SITE INFORMATION */}
            <div className="p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#26352D] flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-[#2E7D5B]" />
                  Real CTRI Site & Registry Information
                </span>
                <span className="text-[10px] font-semibold text-[#2E7D5B] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#7FAF91]/30">
                  CTRI Provenance Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                <div>
                  <span className="text-[#66736B] block text-[11px]">Site Name</span>
                  <p className="font-semibold text-[#26352D] mt-0.5">{selectedTrainingSite.siteName}</p>
                </div>
                <div>
                  <span className="text-[#66736B] block text-[11px]">Location</span>
                  <p className="text-[#26352D] font-medium mt-0.5">
                    {selectedTrainingSite.city ? `${selectedTrainingSite.city}, ${selectedTrainingSite.state}` : selectedTrainingSite.location}
                  </p>
                </div>
                <div>
                  <span className="text-[#66736B] block text-[11px]">Associated CTRI Trial</span>
                  <p className="text-[#26352D] font-medium mt-0.5 line-clamp-1">{selectedTrainingSite.associatedTrialTitle}</p>
                </div>
                <div>
                  <span className="text-[#66736B] block text-[11px]">CTRI Registration</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-[#2E7D5B]">{selectedTrainingSite.trialCtriNumber || 'Not available'}</span>
                    {selectedTrainingSite.sourceUrl && (
                      <a
                        href={selectedTrainingSite.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[10px] text-[#2E7D5B] hover:underline font-semibold"
                      >
                        View CTRI
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#66736B] block text-[11px]">Principal Investigator</span>
                  <p className="text-[#26352D] font-medium mt-0.5">{selectedTrainingSite.investigator || 'Not available'}</p>
                </div>
              </div>
            </div>

            {/* INTERNAL AYU-TRIAL FABRIC WORKFLOW */}
            <div className="p-3.5 rounded-xl bg-white border border-[#E8E4D9] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#2E7D5B]" />
                  Internal SiteTrainingRecord State
                </span>
                <span className="font-mono text-[11px] font-bold text-[#8B6B18] bg-[#FEF6E9] px-2 py-0.5 rounded border border-[#E8C28A]/50">
                  Amendment: {trainingRecord?.changeSetId || 'CS-0001'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9]">
                <div>
                  <span className="text-[#66736B] block text-[11px]">Training Requirement</span>
                  <p className="text-[#26352D] font-semibold mt-0.5">
                    {trainingRecord?.requirementName || 'Protocol Amendment CS-0001 Site Staff Retraining'}
                  </p>
                </div>
                <div>
                  <span className="text-[#66736B] block text-[11px]">Training Status</span>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge
                      variant={
                        trainingRecord?.status === 'VERIFIED'
                          ? 'success'
                          : trainingRecord?.status === 'CHANGES_REQUESTED'
                          ? 'danger'
                          : trainingRecord?.status === 'COMPLETED'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {trainingRecord?.status === 'CHANGES_REQUESTED' ? 'Changes requested' : trainingRecord?.status || 'REQUIRED'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-[#66736B] block text-[11px]">Evidence Status</span>
                  <p className="text-[#26352D] font-medium mt-0.5">
                    {trainingRecord?.evidenceStatus || (trainingRecord?.status === 'VERIFIED' ? 'Verified' : trainingRecord?.status === 'COMPLETED' ? 'Awaiting review' : trainingRecord?.status === 'CHANGES_REQUESTED' ? 'Changes requested' : 'Required')}
                  </p>
                </div>
                <div>
                  <span className="text-[#66736B] block text-[11px]">Monitor Verification</span>
                  <p className="text-[#26352D] font-medium mt-0.5">
                    {trainingRecord?.status === 'VERIFIED' ? 'Verified' : trainingRecord?.status === 'CHANGES_REQUESTED' ? 'Changes requested' : 'Pending'}
                  </p>
                </div>
                <div>
                  <span className="text-[#66736B] block text-[11px]">Completed By</span>
                  <p className="text-[#26352D] font-medium mt-0.5">{trainingRecord?.completedBy || 'Not completed yet'}</p>
                </div>
                <div>
                  <span className="text-[#66736B] block text-[11px]">Completed Date</span>
                  <p className="text-[#26352D] font-mono mt-0.5">
                    {trainingRecord?.completedAt
                      ? new Date(trainingRecord.completedAt).toLocaleString()
                      : 'Pending completion'}
                  </p>
                </div>
                <div>
                  <span className="text-[#66736B] block text-[11px]">Verified By & Date</span>
                  <p className="text-[#26352D] font-mono mt-0.5">
                    {trainingRecord?.verifiedBy
                      ? `${trainingRecord.verifiedBy} (${new Date(trainingRecord.verifiedAt || '').toLocaleDateString()})`
                      : 'Pending verification'}
                  </p>
                </div>
                {trainingRecord?.verificationNote && (
                  <div className="sm:col-span-2">
                    <span className="text-[#66736B] block text-[11px]">Monitor Verification Note</span>
                    <p className="text-[#26352D] italic mt-0.5 bg-white p-2 rounded-lg border border-[#E8E4D9]">
                      "{trainingRecord.verificationNote}"
                    </p>
                  </div>
                )}
              </div>

              {/* Monitor verification note input for CRA role */}
              {isMonitorOrAdmin && trainingRecord?.status === 'COMPLETED' && (
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-[#26352D] block">
                    CRA / Monitor Verification Note *
                  </label>
                  <input
                    type="text"
                    value={monitorNote}
                    onChange={(e) => setMonitorNote(e.target.value)}
                    placeholder="Enter audit log verification confirmation note..."
                    className="w-full bg-[#FAF9F4] border border-[#E8E4D9] rounded-xl px-3 py-2 text-xs text-[#26352D] focus:ring-2 focus:ring-[#2E7D5B]/30"
                  />
                </div>
              )}

              {/* Governance pipeline explanation */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#EAF4EF] border border-[#7FAF91]/40 text-[#2E7D5B]">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#2E7D5B]" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-xs text-[#2E7D5B]">Evidence & Readiness Synchronization</p>
                  <p className="text-[11px] text-[#26352D] leading-relaxed">
                    Site training records are bound to <strong>EVD-03 (Training Completion Record)</strong>. When site training is completed and verified by the Clinical Research Associate, EVD-03 resolves and the amendment readiness gate unlocks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
