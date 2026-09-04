export type AESeverity = 'Grade 1 (Mild)' | 'Grade 2 (Moderate)' | 'Grade 3 (Severe)' | 'Grade 4 (Life-threatening)' | 'Grade 5 (Death)';
export type CausalityType = 'Unrelated' | 'Unlikely' | 'Possible' | 'Probable' | 'Definite';
export type OutcomeType = 'Recovered' | 'Recovering' | 'Not Recovered' | 'Fatal' | 'Unknown';

export interface AdverseEvent {
  id: string;
  caseId: string; // e.g. SAE-2026-003
  participantCode: string;
  siteCode: string;
  isSerious: boolean;
  term: string; // e.g. "Transient Hepatic Transaminase Elevation"
  onsetDate: string;
  reportedDate: string;
  severity: AESeverity;
  causality: CausalityType;
  outcome: OutcomeType;
  actionTakenWithInvestigationalProduct: string;
  regulatoryReportingDeadline: string;
  cdscoReported: boolean;
  iecNotified: boolean;
  status: 'open' | 'under_investigation' | 'closed' | 'escalated';
}
