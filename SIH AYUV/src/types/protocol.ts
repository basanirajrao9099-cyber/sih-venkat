export interface ProtocolEndpoint {
  id: string;
  type: 'Primary' | 'Secondary' | 'Exploratory';
  description: string;
  timeframe: string;
  measurementTool: string;
}

export interface ScheduleOfAssessment {
  visitId: string;
  visitName: string;
  dayOffset: string;
  windowDays: string;
  activities: {
    name: string;
    category: 'Safety' | 'Efficacy' | 'Ayush Dosha/Prakriti' | 'Biomarker' | 'Investigational Product';
    required: boolean;
  }[];
}

export interface ProtocolChangeset {
  id: string;
  versionNumber: string; // e.g. "v2.1"
  previousVersion: string; // e.g. "v2.0"
  title: string;
  changeType: 'Administrative' | 'Minor Amendment' | 'Substantial Amendment';
  rationale: string;
  summaryOfChanges: string[];
  impactScore: 'Low' | 'Medium' | 'High' | 'Critical';
  submissionDate: string;
  iecApprovalStatus: 'approved' | 'pending' | 'under_review';
  cdscoApprovalStatus: 'approved' | 'not_required' | 'pending';
  effectiveDate: string;
  affectedSitesCount: number;
}

export interface ImpactAnalysis {
  trialId: string;
  metric: string;
  baseline: number;
  projectedWithChanges: number;
  variancePct: number;
  unit: string;
  status: 'positive' | 'warning' | 'critical';
  details: string;
}

export interface EthicsSubmission {
  id: string;
  iecCode: string;
  siteName: string;
  committeeName: string;
  submissionType: string;
  submissionDate: string;
  meetingDate: string;
  decision: 'Approved' | 'Queries Raised' | 'Pending Review' | 'Rejected';
  validUntil: string;
  documentsCount: number;
}

export interface RegulatoryFiling {
  id: string;
  registrationNumber: string; // CTRI or CDSCO
  authority: 'CDSCO' | 'CTRI' | 'AYUSH Drug Controller' | 'ICMR';
  type: 'Clinical Trial Approval (CT-06)' | 'CTRI Registration' | 'Import License (CT-17)' | 'Periodic Safety Report';
  status: 'Approved' | 'Submitted' | 'Under Query' | 'Draft';
  filingDate: string;
  approvalDate: string;
  nextRenewalDate: string;
  complianceCheckpoints: {
    checkpoint: string;
    passed: boolean;
  }[];
}

export interface IntegrationConnector {
  id: string;
  name: string;
  category: 'EHR / Hospital System' | 'EDC (Electronic Data Capture)' | 'LIMS (Laboratory)' | 'Wearable / Sensor';
  provider: string; // e.g. "AHMIS - Ayush Hospital MIS", "REDCap Cloud", "Agappe Diagnostics LIMS"
  connectionStatus: 'connected' | 'syncing' | 'error' | 'disconnected';
  lastSyncTime: string;
  recordsSyncedToday: number;
  latencyMs: number;
  endpointUrl: string;
}

export interface CompilerCheck {
  id: string;
  code: string;
  category: 'ICH-GCP Compliance' | 'AYUSH Protocol Guidelines' | 'Visit Window Consistency' | 'Statistical Power & Arm Balance';
  severity: 'error' | 'warning' | 'info' | 'pass';
  message: string;
  field: string;
  suggestedFix: string;
}
