export interface TrialOpsItem {
  id?: string;
  trialId: string; // e.g. "ATF-001"
  trialName: string; // e.g. "AYU-TRIAL FABRIC Demonstration Trial"
  phase: 'Phase I' | 'Phase II' | 'Phase IIb' | 'Phase III' | 'Phase IV';
  status: 'ACTIVE' | 'RECRUITING' | 'COMPLETED' | 'SUSPENDED';
  protocolVersion: string; // e.g. "v1.0 (Active) / v1.1"
  siteCount?: number; // e.g. 3
  numberOfSites?: number;
  participantCount?: number; // e.g. 47
  numberOfParticipants?: number;
  recruitmentPercentage?: number;
  recruitmentPct?: number; // e.g. 72
  activeAmendment?: string; // e.g. "CS-0001"
  leadInvestigator?: string;
  indication?: string;
  sponsor?: string;
  description: string;
  startDate?: string;
  targetParticipants?: number;
}

export interface SiteOpsItem {
  id: string;
  siteId: string; // e.g. "SITE-001"
  siteName: string; // e.g. "Hyderabad Clinical Centre"
  investigator: string; // e.g. "Dr. Rao"
  location: string; // e.g. "Hyderabad, Telangana"
  participants: number; // e.g. 18
  trainingPct: number; // e.g. 92
  documentsPct: number; // e.g. 100
  activationStatus: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  governanceStatus: 'READY' | 'PENDING AUDIT' | 'UNDER REVIEW';
  contactEmail: string;
  lastMonitorVisit: string;
}

export type TimelineStepStatus = 'completed' | 'current' | 'upcoming';

export interface TimelineStep {
  step: 'Screening' | 'Enrollment' | 'Visit 1' | 'Visit 2' | 'Visit 3';
  status: TimelineStepStatus;
  date?: string;
  notes?: string;
}

export interface ParticipantOpsItem {
  id: string;
  participantId: string; // e.g. "PT-001" (Pseudonymized only)
  site: string; // e.g. "Hyderabad Clinical Centre (SITE-001)"
  siteId: string;
  enrollmentDate: string; // e.g. "2025-11-20"
  visitStatus: string; // e.g. "Visit 3 Complete", "Visit 1 Pending"
  consent: 'Signed (e-ICF v2.1)' | 'Pending Signature' | 'Re-consent Required';
  safety: 'No AE' | 'Mild AE (Resolved)' | 'Moderate AE (Under Follow-up)' | 'SAE Flagged';
  protocolVersion: string; // e.g. "Protocol v1.0"
  cohortArm: string; // e.g. "Arm A (Investigational)" or "Arm B (Active Comparator)"
  timeline: TimelineStep[];
}

export interface RecruitmentTrendPoint {
  month: string;
  target: number;
  enrolled: number;
}

export interface SiteRecruitmentBreakdown {
  siteId: string;
  siteName: string;
  target: number;
  enrolled: number;
  pct: number;
}

export interface RecruitmentOpsData {
  target: number; // 400
  enrolled: number; // 284
  remaining: number; // 116
  recruitmentPct: number; // 71
  trend: RecruitmentTrendPoint[];
  sites: SiteRecruitmentBreakdown[];
}

export interface RandomizationResult {
  participantId: string;
  eligible: boolean;
  treatmentArm: string;
  allocationCode: string;
  blockId: string;
  stratification: string;
  timestamp: string;
  formulationDetails: string;
}
