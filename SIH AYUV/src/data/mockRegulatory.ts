import { RegulatoryFiling } from '../types/protocol';

export const MOCK_REGULATORY_FILINGS: RegulatoryFiling[] = [
  {
    id: 'reg-01',
    registrationNumber: 'CTRI/2025/11/059341',
    authority: 'CTRI',
    type: 'CTRI Registration',
    status: 'Approved',
    filingDate: '2025-10-15',
    approvalDate: '2025-11-12',
    nextRenewalDate: '2026-11-12',
    complianceCheckpoints: [
      { checkpoint: 'Full Protocol synopsis uploaded and verified', passed: true },
      { checkpoint: 'Informed Consent Form versions in regional languages registered', passed: true },
      { checkpoint: 'Ethics committee approval letters validated', passed: true },
      { checkpoint: 'Quarterly participant recruitment audit updated', passed: true },
    ]
  },
  {
    id: 'reg-02',
    registrationNumber: 'CT/ND/104/2025',
    authority: 'CDSCO',
    type: 'Clinical Trial Approval (CT-06)',
    status: 'Approved',
    filingDate: '2025-08-20',
    approvalDate: '2025-10-02',
    nextRenewalDate: '2027-10-01',
    complianceCheckpoints: [
      { checkpoint: 'GMP certificate of investigational Ayurvedic product', passed: true },
      { checkpoint: 'Certificate of Analysis (Heavy metals, pesticides, microbial limit)', passed: true },
      { checkpoint: 'Pre-clinical toxicity data dossier approved', passed: true },
      { checkpoint: 'Investigator brochure (IB v3.0) cleared by NDAC', passed: true },
    ]
  },
  {
    id: 'reg-03',
    registrationNumber: 'AMD-AYU-2026-01',
    authority: 'CDSCO',
    type: 'Periodic Safety Report',
    status: 'Submitted',
    filingDate: '2026-02-16',
    approvalDate: 'Under Review',
    nextRenewalDate: '2026-08-16',
    complianceCheckpoints: [
      { checkpoint: 'SAE-2026-003 14-day detailed causality report submitted', passed: true },
      { checkpoint: 'Cumulative DSUR (Development Safety Update Report)', passed: true },
      { checkpoint: 'Independent Data Safety Monitoring Board (DSMB) meeting minutes', passed: true },
    ]
  }
];
