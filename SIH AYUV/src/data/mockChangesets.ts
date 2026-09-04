import { ProtocolChangeset } from '../types/protocol';

export const MOCK_CHANGESETS: ProtocolChangeset[] = [
  {
    id: 'cs-01',
    versionNumber: 'v2.1',
    previousVersion: 'v2.0',
    title: 'Expansion of Visit Window for Week 8 & Addition of Remote Tele-Consultation Option',
    changeType: 'Substantial Amendment',
    rationale: 'Mitigate patient travel fatigue reported across rural satellite clinics and widen visit window from ±2 to ±4 days to improve retention.',
    summaryOfChanges: [
      'Increased Week 8 visit window from ±2 to ±4 days.',
      'Allowed remote tele-health review for Visit 3 safety questionnaire where patients cannot travel.',
      'Updated patient information sheet (PIS) with Hindi & Marathi dialect adaptations.'
    ],
    impactScore: 'Medium',
    submissionDate: '2026-01-15',
    iecApprovalStatus: 'approved',
    cdscoApprovalStatus: 'approved',
    effectiveDate: '2026-02-01',
    affectedSitesCount: 8,
  },
  {
    id: 'cs-02',
    versionNumber: 'v2.2',
    previousVersion: 'v2.1',
    title: 'Addition of Exploratory Biomarker Sub-Study (Natural Killer Cell Cytotoxicity)',
    changeType: 'Substantial Amendment',
    rationale: 'Incorporate translational immunological endpoint following recent findings from the Ayush-CSIR integrative biology consortium.',
    summaryOfChanges: [
      'Added optional 5mL whole blood sample draw at Baseline and Week 12 for consented participants.',
      'Updated lab operations manual for cold chain logistics (-80°C biobanking).',
      'Added secondary ICF for genetic/biomarker bio-repository storage.'
    ],
    impactScore: 'High',
    submissionDate: '2026-02-20',
    iecApprovalStatus: 'under_review',
    cdscoApprovalStatus: 'pending',
    effectiveDate: 'Pending Clearance',
    affectedSitesCount: 4,
  },
  {
    id: 'cs-03',
    versionNumber: 'v2.0',
    previousVersion: 'v1.1',
    title: 'Clarification of Permitted Ayush Concomitant Therapies (Dinacharya & Diet)',
    changeType: 'Minor Amendment',
    rationale: 'Standardize dietary restrictions (Pathya-Apathya guidelines) to prevent confounding effects on herbal absorption.',
    summaryOfChanges: [
      'Specified non-permitted high-dose vitamin supplements.',
      'Standardized morning lukewarm water intake recommendation before investigational lehyam dose.',
      'Corrected typographical error in dosing frequency description table.'
    ],
    impactScore: 'Low',
    submissionDate: '2025-11-01',
    iecApprovalStatus: 'approved',
    cdscoApprovalStatus: 'not_required',
    effectiveDate: '2025-11-20',
    affectedSitesCount: 8,
  }
];
