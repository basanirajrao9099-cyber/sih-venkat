export interface Participant {
  id: string;
  subjectCode: string; // e.g. SUBJ-101-004
  trialId: string;
  siteCode: string;
  siteName: string;
  screeningDate: string;
  enrollmentDate: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  prakriti: 'Vata-Pitta' | 'Pitta-Kapha' | 'Vata-Kapha' | 'Tridosha' | 'Kapha-Vata'; // Ayush diagnostic phenotype
  arm: string; // e.g. "Arm A (Ayurveda + Standard Care)" or "Arm B (Active Comparator)"
  status: 'enrolled' | 'screening' | 'active' | 'completed' | 'withdrawn' | 'lost_to_follow_up';
  currentVisit: string; // e.g. "Week 8 (V4)"
  adherenceRate: number; // percentage e.g. 96.5%
  adverseEventsCount: number;
  lastVisitDate: string;
  nextScheduledVisit: string;
}

export interface RecruitmentMetrics {
  totalScreened: number;
  totalEligible: number;
  totalEnrolled: number;
  totalTarget: number;
  screenFailureRate: number;
  retentionRate: number;
  averageEnrollmentRatePerMonth: number;
  projectedCompletionDate: string;
}
