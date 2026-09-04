export type TrialPhase = 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV' | 'Observational';
export type AyushSystem = 'Ayurveda' | 'Yoga & Naturopathy' | 'Unani' | 'Siddha' | 'Homeopathy' | 'Integrative';

export interface ClinicalTrial {
  id: string;
  protocolId: string; // e.g. AYU-CT-2026-042
  title: string;
  shortTitle: string;
  system: AyushSystem;
  phase: TrialPhase;
  status: 'recruiting' | 'active' | 'completed' | 'suspended' | 'draft';
  formulation: string; // e.g. Ashwagandha Lehyam + Guduchi Ghanvati
  indication: string; // e.g. Post-Viral Chronic Fatigue & Immune Restoration
  targetEnrollment: number;
  enrolledCount: number;
  activeSites: number;
  startDate: string;
  estimatedEndDate: string;
  sponsor: string;
  ctriNumber: string; // CTRI/2026/03/014920
  piName: string;
  budgetAllocated: number;
  budgetUtilized: number;
  saeCount: number;
}

export interface TrialSite {
  id: string;
  siteCode: string; // e.g. SITE-01-AIIA
  name: string;
  city: string;
  state: string;
  piName: string;
  contactEmail: string;
  status: 'active' | 'recruiting' | 'pending' | 'suspended';
  targetEnrollment: number;
  currentEnrollment: number;
  iecApprovalDate: string;
  lastMonitorVisit: string;
  openQueries: number;
  complianceRate: number; // percentage
}
