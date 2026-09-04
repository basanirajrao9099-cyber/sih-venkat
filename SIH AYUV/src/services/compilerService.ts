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

export interface EvidenceItem {
  id: string;
  title: string;
  status: 'MISSING' | 'VERIFIED' | 'AVAILABLE';
  buttonText: string;
  fileHint?: string;
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

  verifyEvidence: async (
    evidenceId: string,
    decision: 'ACCEPT' | 'REJECT' = 'ACCEPT',
    changeSetId: string = 'CS-0001'
  ): Promise<any> => {
    const role = evidenceId === 'EVD-03' ? 'Monitor' : 'Ethics Reviewer';
    return apiFetch(
      `/api/v1/compiler/evidence/${encodeURIComponent(evidenceId)}/verify?changeSetId=${encodeURIComponent(changeSetId)}`,
      {
        method: 'POST',
        headers: { 'X-User-Role': role },
        body: JSON.stringify({ decision }),
      },
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

