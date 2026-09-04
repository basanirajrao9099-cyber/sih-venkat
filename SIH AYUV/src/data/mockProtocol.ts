import { ProtocolEndpoint, ScheduleOfAssessment } from '../types/protocol';

export const MOCK_ENDPOINTS: ProtocolEndpoint[] = [
  {
    id: 'ep-01',
    type: 'Primary',
    description: 'Change in Chalder Fatigue Scale (CFS-11) score from Baseline to Week 12',
    timeframe: 'Baseline, Week 4, Week 8, Week 12',
    measurementTool: 'Validated CFS-11 Questionnaire (Hindi & English translations)',
  },
  {
    id: 'ep-02',
    type: 'Primary',
    description: 'Proportion of subjects achieving >= 50% reduction in fatigue score without relapse',
    timeframe: 'Week 12 and Week 16 (Follow-up)',
    measurementTool: 'Responder Analysis Algorithm',
  },
  {
    id: 'ep-03',
    type: 'Secondary',
    description: 'Serum Ojas/Immune markers (hs-CRP, IL-6, Natural Killer Cell Activity, Immunoglobulin IgG/IgM)',
    timeframe: 'Baseline, Week 12',
    measurementTool: 'Centralized CLIA Lab Automated Chemiluminescence',
  },
  {
    id: 'ep-04',
    type: 'Secondary',
    description: 'Standardized Ayush Dosha Prakriti balance index and Agni (Digestive Fire) score',
    timeframe: 'Baseline, Week 4, Week 8, Week 12',
    measurementTool: 'CCRAS Validated Prakriti & Agni Assessment Inventory (VPAI)',
  },
  {
    id: 'ep-05',
    type: 'Exploratory',
    description: 'Sleep quality improvement evaluated via Pittsburgh Sleep Quality Index (PSQI)',
    timeframe: 'Every 2 weeks through wearable sleep tracker',
    measurementTool: 'Continuous Actigraphy + Digital ePRO App',
  }
];

export const MOCK_SCHEDULE_OF_ASSESSMENTS: ScheduleOfAssessment[] = [
  {
    visitId: 'V1',
    visitName: 'Screening (Days -14 to 0)',
    dayOffset: '-14 to 0',
    windowDays: '±2 days',
    activities: [
      { name: 'Informed Consent & Prakriti Assessment', category: 'Ayush Dosha/Prakriti', required: true },
      { name: 'Inclusion/Exclusion Verification', category: 'Safety', required: true },
      { name: 'Vital Signs, ECG & CBC/LFT/RFT', category: 'Safety', required: true },
      { name: 'Baseline CFS-11 & PSQI Questionnaire', category: 'Efficacy', required: true },
    ]
  },
  {
    visitId: 'V2',
    visitName: 'Baseline & Randomization (Day 1)',
    dayOffset: 'Day 1',
    windowDays: '0 days',
    activities: [
      { name: 'Randomization Arm Allocation', category: 'Investigational Product', required: true },
      { name: 'Dispensation of Ashwagandha/Guduchi or Placebo', category: 'Investigational Product', required: true },
      { name: 'Dosing diary & Wearable sensor onboarding', category: 'Investigational Product', required: true },
      { name: 'Concomitant Medication Log', category: 'Safety', required: true },
    ]
  },
  {
    visitId: 'V3',
    visitName: 'Interim Assessment (Week 4)',
    dayOffset: 'Day 28',
    windowDays: '±3 days',
    activities: [
      { name: 'CFS-11 Fatigue Questionnaire', category: 'Efficacy', required: true },
      { name: 'Targeted Safety Labs (LFT/RFT)', category: 'Safety', required: true },
      { name: 'Drug Accountability & Compliance Check', category: 'Investigational Product', required: true },
      { name: 'Ayush Agni & Koshtha check', category: 'Ayush Dosha/Prakriti', required: true },
    ]
  },
  {
    visitId: 'V4',
    visitName: 'Mid-Point Evaluation (Week 8)',
    dayOffset: 'Day 56',
    windowDays: '±3 days',
    activities: [
      { name: 'Full Efficacy Battery & PSQI', category: 'Efficacy', required: true },
      { name: 'Adverse Event Monitoring & Grading', category: 'Safety', required: true },
      { name: 'Refill of Study Formulations', category: 'Investigational Product', required: true },
    ]
  },
  {
    visitId: 'V5',
    visitName: 'End of Treatment (Week 12)',
    dayOffset: 'Day 84',
    windowDays: '±4 days',
    activities: [
      { name: 'Primary Endpoint Assessment (CFS-11)', category: 'Efficacy', required: true },
      { name: 'Comprehensive Serum Biomarkers (IL-6, hs-CRP)', category: 'Biomarker', required: true },
      { name: 'Final Drug Accountability & Return', category: 'Investigational Product', required: true },
      { name: 'End-of-study Prakriti re-classification', category: 'Ayush Dosha/Prakriti', required: true },
    ]
  }
];
