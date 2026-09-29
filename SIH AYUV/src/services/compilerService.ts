import { apiFetch } from './api';

export type PipelineStepName =
  | 'CHANGESET'
  | 'IMPACT'
  | 'COMPILE'
  | 'RULES'
  | 'FINDINGS'
  | 'OBLIGATIONS'
  | 'EVIDENCE'
  | 'VERIFICATION'
  | 'READY';

export type PipelineStepStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';

export interface Finding {
  id: string; // e.g. "F-001"
  type: 'BLOCK' | 'WARNING';
  title: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'RESOLVED';
}

export interface Obligation {
  id: string;
  obligation: string;
  owner: string;
  status: 'OPEN' | 'COMPLETED' | 'IN PROGRESS';
}

import { SiteTrainingEvidence } from '../types/trialOps';

export interface EvidenceItem {
  id: string;
  title: string;
  status: 'MISSING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'AVAILABLE';
  buttonText: string;
  fileHint?: string;
  fileUrl?: string;
  documentType?: string;
  uploadedBy?: string;
  uploaderRole?: string;
  fileName?: string;
  fileSizeBytes?: number;
  checksumSha256?: string;
  submittedAt?: string;
  verifiedBy?: string;
  reviewerRole?: string;
  verificationHash?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  description?: string;
  affectedSitesCount?: number;
  verifiedSitesCount?: number;
  siteEvidence?: SiteTrainingEvidence[];
  isDemoFixture?: boolean;
  source?: string;
}

export interface ReadinessBlocker {
  id: string;
  title: string;
  requirementName: string;
  category: 'TRAINING' | 'EVIDENCE' | 'ETHICS' | 'COMPLIANCE' | 'REGULATORY' | string;
  siteId?: string;
  siteName?: string;
  status: string; // 'Changes requested' | 'Required' | 'Awaiting review' | 'Open' | string
  explanation: string;
  suggestedAction?: string;
  allowedRoles?: string[];
}

export interface ReadinessDimension {
  name: string;
  status: 'COMPLETE' | 'PENDING' | 'IN_PROGRESS';
  details?: string;
  isComplete: boolean;
}

export interface ReadinessSummary {
  protocol: string;
  changeSet: string;
  sites: number;
  participants: number;
  blockingFindings: number;
  warnings: number;
  evidence: string;
  status: 'BLOCKED' | 'READY';
  overallState?: 'READY' | 'NOT READY';
  readinessStage?: 'NOT_READY' | 'REQUIREMENTS_IN_PROGRESS' | 'READY_FOR_IMPLEMENTATION' | 'VALIDATING' | 'READY';
  remainingRequirementsCount?: number;
  remainingRequirements?: string[];
  dimensions?: ReadinessDimension[];
  blockers?: ReadinessBlocker[];
  isImpactComplete?: boolean;
  isEvidenceSubmitted?: boolean;
  isEvidenceVerified?: boolean;
  isEthicsApproved?: boolean;
  isTrainingCompleted?: boolean;
  isComplianceResolved?: boolean;
}

export const INITIAL_FINDINGS: Finding[] = [
  {
    id: 'F-001',
    type: 'BLOCK',
    title: 'IEC notification required',
    description: 'Protocol amendment affects Visit 4 timing and requires ethics notification.',
    severity: 'HIGH',
    status: 'OPEN',
  },
  {
    id: 'F-002',
    type: 'BLOCK',
    title: 'Consent document update required',
    description: 'Patient Information Sheet addendum is required before implementation.',
    severity: 'HIGH',
    status: 'OPEN',
  },
  {
    id: 'F-003',
    type: 'BLOCK',
    title: 'Site training required',
    description: 'CRC operational briefing must be completed for affected sites.',
    severity: 'MEDIUM',
    status: 'OPEN',
  },
  {
    id: 'F-004',
    type: 'WARNING',
    title: 'EDC mapping review',
    description: 'REDCap eCRF visit-window mapping should be reviewed.',
    severity: 'MEDIUM',
    status: 'OPEN',
  },
];

export const INITIAL_OBLIGATIONS: Obligation[] = [
  { id: 'OBL-01', obligation: 'IEC notification', owner: 'Regulatory', status: 'OPEN' },
  { id: 'OBL-02', obligation: 'Consent addendum', owner: 'Ethics', status: 'OPEN' },
  { id: 'OBL-03', obligation: 'CRC training', owner: 'Trial Operations', status: 'OPEN' },
  { id: 'OBL-04', obligation: 'EDC mapping review', owner: 'Data Management', status: 'OPEN' },
];

export const INITIAL_EVIDENCE: EvidenceItem[] = [
  {
    id: 'EVD-01',
    title: 'IEC Notification Letter',
    status: 'MISSING',
    buttonText: 'ADD EVIDENCE',
    fileHint: 'Dossier acknowledgement receipt from Central Ethics Board',
  },
  {
    id: 'EVD-02',
    title: 'Consent Addendum',
    status: 'MISSING',
    buttonText: 'ADD EVIDENCE',
    fileHint: 'Patient Information Sheet v1.1 addendum approved',
  },
  {
    id: 'EVD-03',
    title: 'Training Completion Record',
    status: 'MISSING',
    buttonText: 'ADD EVIDENCE',
    fileHint: 'Site CRC sign-off certificates across 3 centers',
  },
  {
    id: 'EVD-04',
    title: 'EDC Mapping Verification',
    status: 'AVAILABLE',
    buttonText: 'VIEW',
    fileHint: 'REDCap visit window schema validation hash: 0x8F9C2B',
  },
];

const COMPILER_STORAGE_KEY = 'ayu_compiler_status_v1';

export const compilerService = {
  getInitialFindings: (): Finding[] => JSON.parse(JSON.stringify(INITIAL_FINDINGS)),
  getInitialObligations: (): Obligation[] => JSON.parse(JSON.stringify(INITIAL_OBLIGATIONS)),
  getInitialEvidence: (): EvidenceItem[] => JSON.parse(JSON.stringify(INITIAL_EVIDENCE)),

  getCompilerStatus: (): 'BLOCKED' | 'READY' => {
    if (typeof window === 'undefined') return 'BLOCKED';
    return (localStorage.getItem(COMPILER_STORAGE_KEY) as 'READY') || 'BLOCKED';
  },

  setCompilerStatus: (status: 'BLOCKED' | 'READY'): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COMPILER_STORAGE_KEY, status);
    }
  },

  resetDemoState: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COMPILER_STORAGE_KEY, 'BLOCKED');
    }
  },

  getReadiness: (isReady?: boolean): ReadinessSummary => {
    const ready = isReady !== undefined ? isReady : compilerService.getCompilerStatus() === 'READY';
    return {
      protocol: 'v1.1',
      changeSet: 'CS-0001',
      sites: 3,
      participants: 47,
      blockingFindings: ready ? 0 : 3,
      warnings: 1,
      evidence: ready ? '4 / 4' : '1 / 4',
      status: ready ? 'READY' : 'BLOCKED',
      readinessStage: ready ? 'READY' : 'NOT_READY',
      remainingRequirementsCount: ready ? 0 : 2,
      remainingRequirements: ready ? [] : ['IEC approval', 'Site retraining'],
      dimensions: [
        { name: 'Impact', status: 'COMPLETE', details: 'Complete (3 sites, 47 participants, 1 visit, 1 CRF)', isComplete: true },
        { name: 'Evidence', status: ready ? 'COMPLETE' : 'IN_PROGRESS', details: ready ? '4 of 4 verified' : '1 of 4 verified', isComplete: ready },
        { name: 'Ethics review', status: ready ? 'COMPLETE' : 'PENDING', details: ready ? 'Approved' : 'IEC approval pending', isComplete: ready },
        { name: 'Training', status: ready ? 'COMPLETE' : 'PENDING', details: ready ? '3 of 3 sites completed' : 'Site retraining pending', isComplete: ready },
        { name: 'Compliance', status: ready ? 'COMPLETE' : 'PENDING', details: ready ? '0 blocking findings' : '3 open blockers', isComplete: ready },
      ],
      isImpactComplete: true,
      isEvidenceSubmitted: ready,
      isEvidenceVerified: ready,
      isEthicsApproved: ready,
      isTrainingCompleted: ready,
      isComplianceResolved: ready,
    };
  },

  // Real Backend API Methods
  fetchFindings: async (changeSetId: string = 'CS-0001'): Promise<Finding[]> => {
    return apiFetch<Finding[]>(
      `/api/v1/compiler/findings?changeSetId=${encodeURIComponent(changeSetId)}`,
      undefined,
      INITIAL_FINDINGS
    );
  },

  fetchObligations: async (changeSetId: string = 'CS-0001'): Promise<Obligation[]> => {
    return apiFetch<Obligation[]>(
      `/api/v1/compiler/obligations?changeSetId=${encodeURIComponent(changeSetId)}`,
      undefined,
      INITIAL_OBLIGATIONS
    );
  },

  fetchEvidence: async (changeSetId: string = 'CS-0001'): Promise<EvidenceItem[]> => {
    return apiFetch<EvidenceItem[]>(
      `/api/v1/compiler/evidence?changeSetId=${encodeURIComponent(changeSetId)}`,
      undefined,
      INITIAL_EVIDENCE
    );
  },

  fetchReadiness: async (changeSetId: string = 'CS-0001'): Promise<ReadinessSummary> => {
    const fallback = compilerService.getReadiness();
    return apiFetch<ReadinessSummary>(
      `/api/v1/compiler/readiness?changeSetId=${encodeURIComponent(changeSetId)}`,
      undefined,
      fallback
    );
  },

  runCompile: async (
    changeSetId: string = 'CS-0001',
    trialId: string = 'AYU-2026-0001'
  ): Promise<any> => {
    return apiFetch(
      '/api/v1/compiler/run',
      {
        method: 'POST',
        body: JSON.stringify({ changeSetId, trialId }),
      },
      null
    );
  },

  submitEvidence: async (payload: {
    evidenceId: string;
    changeSetId?: string;
    title?: string;
    documentType?: string;
    uploadedBy?: string;
    uploaderRole?: string;
    fileName?: string;
    fileSizeBytes?: number;
    checksumSha256?: string;
    description?: string;
    fileHint?: string;
  }): Promise<EvidenceItem> => {
    return apiFetch<EvidenceItem>(
      '/api/v1/compiler/evidence/submit',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': payload.uploaderRole || 'Principal Investigator',
        },
        body: JSON.stringify({
          evidenceId: payload.evidenceId,
          changeSetId: payload.changeSetId || 'CS-0001',
          title: payload.title,
          documentType: payload.documentType || 'Regulatory Dossier',
          uploadedBy: payload.uploadedBy || 'Dr. V. Sharma (Lead PI)',
          uploaderRole: payload.uploaderRole || 'Principal Investigator',
          fileName: payload.fileName || 'evidence_document.pdf',
          fileSizeBytes: payload.fileSizeBytes || 1048576,
          checksumSha256: payload.checksumSha256 || '0x7F9B2C1A8E3D',
          fileHint: payload.description || payload.fileHint,
          description: payload.description || payload.fileHint,
        }),
      }
    );
  },

  verifyEvidence: async (
    evidenceId: string,
    decision: 'ACCEPT' | 'REJECT' = 'ACCEPT',
    changeSetId: string = 'CS-0001',
    comments?: string,
    rejectionReason?: string,
    verifiedBy?: string,
    reviewerRole?: string
  ): Promise<any> => {
    const defaultRole = evidenceId === 'EVD-03' ? 'Monitor' : 'Ethics Reviewer';
    const role = reviewerRole || defaultRole;
    return apiFetch(
      `/api/v1/compiler/evidence/${encodeURIComponent(evidenceId)}/verify?changeSetId=${encodeURIComponent(changeSetId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': role,
        },
        body: JSON.stringify({
          decision,
          comments: comments || rejectionReason,
          rejectionReason: rejectionReason || comments,
          verifiedBy: verifiedBy || (role === 'Monitor' ? 'Clinical Research Associate / Monitor' : 'Central Ethics Committee Chair'),
          reviewerRole: role,
        }),
      },
      null
    );
  },

  uploadEvidenceArtifact: async (
    evidenceId: string,
    fileName: string = 'dossier_signed.pdf',
    changeSetId: string = 'CS-0001',
    actor: string = 'Principal Investigator'
  ): Promise<any> => {
    return apiFetch(
      '/api/v1/compiler/evidence/submit',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': actor,
        },
        body: JSON.stringify({
          evidenceId,
          changeSetId,
          fileName,
          uploadedBy: actor,
          uploaderRole: actor,
          checksumSha256: '0x7F9B2C1A8E3D',
        }),
      },
      null
    );
  },

  fetchAuditTrail: async (changeSetId: string = 'CS-0001'): Promise<any[]> => {
    return apiFetch<any[]>(
      `/api/v1/audit/trail?changeSetId=${encodeURIComponent(changeSetId)}`,
      undefined,
      []
    );
  },

  fetchSites: async (): Promise<any[]> => {
    return apiFetch<any[]>('/api/v1/sites', undefined, []);
  },

  fetchParticipants: async (trialId: string = 'AYU-2026-0001'): Promise<any[]> => {
    return apiFetch<any[]>(
      `/api/v1/participants?trialId=${encodeURIComponent(trialId)}`,
      undefined,
      []
    );
  },

  fetchChangeSets: async (): Promise<any[]> => {
    return apiFetch<any[]>('/api/v1/changesets', undefined, []);
  },

  fetchChangeSetById: async (id: string): Promise<any> => {
    return apiFetch<any>(`/api/v1/changesets/${encodeURIComponent(id)}`, undefined, null);
  },

  createChangeSet: async (payload: any): Promise<any> => {
    return apiFetch<any>(
      '/api/v1/changesets',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      null
    );
  },

  updateChangeSet: async (id: string, payload: any): Promise<any> => {
    return apiFetch<any>(
      `/api/v1/changesets/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      null
    );
  },

  fetchImpactReport: async (changeSetId: string = 'CS-0001'): Promise<any> => {
    return apiFetch<any>(
      `/api/v1/changesets/${encodeURIComponent(changeSetId)}/impact`,
      undefined,
      null
    );
  },

  resetBackendState: async (changeSetId: string = 'CS-0001'): Promise<any> => {
    return apiFetch(
      `/api/v1/compiler/reset?changeSetId=${encodeURIComponent(changeSetId)}`,
      { method: 'POST' },
      null
    );
  },
};

