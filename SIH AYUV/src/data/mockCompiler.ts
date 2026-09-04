import { CompilerCheck } from '../types/protocol';

export const MOCK_COMPILER_CHECKS: CompilerCheck[] = [
  {
    id: 'chk-01',
    code: 'ICH-GCP-E6(R2)-5.1',
    category: 'ICH-GCP Compliance',
    severity: 'pass',
    message: 'Investigator qualifications and signed CVs verified for all 8 active study sites.',
    field: 'Site Regulatory Binder',
    suggestedFix: 'None required.',
  },
  {
    id: 'chk-02',
    code: 'AYUSH-GCP-SEC-4.2',
    category: 'AYUSH Protocol Guidelines',
    severity: 'pass',
    message: 'Classical Ayurvedic reference citation and formulation standardization criteria validated against API (Ayurvedic Pharmacopoeia of India).',
    field: 'Section 3.1 Investigational Product Dossier',
    suggestedFix: 'None required.',
  },
  {
    id: 'chk-03',
    code: 'SOA-VISIT-WINDOW-09',
    category: 'Visit Window Consistency',
    severity: 'warning',
    message: 'Visit 3 (Week 4, ±3 days) overlaps with allowable boundary for Visit 2 late dispensation if drug distribution is delayed beyond day 3.',
    field: 'Protocol Schedule of Assessments Table 2',
    suggestedFix: 'Add explicit clause: "Minimum 25-day interval required between V2 baseline dose and V3 assessment."',
  },
  {
    id: 'chk-04',
    code: 'STAT-POWER-ARM-03',
    category: 'Statistical Power & Arm Balance',
    severity: 'pass',
    message: 'Sample size calculation: N=360 provides 92% power (alpha=0.05, 2-sided) assuming 15% attrition and 20% effect difference.',
    field: 'Section 8 Statistical Methodology',
    suggestedFix: 'None required.',
  },
  {
    id: 'chk-05',
    code: 'BIO-STORAGE-CHAIN-01',
    category: 'AYUSH Protocol Guidelines',
    severity: 'info',
    message: 'Proposed Amendment v2.2 requires -80°C ultracold freezers. Verify calibration certification for SITE-07 (Trivandrum) before activation.',
    field: 'Amendment v2.2 Section 6.4 Biobanking',
    suggestedFix: 'Request temperature log calibration certificate from Site 07 laboratory director.',
  }
];
