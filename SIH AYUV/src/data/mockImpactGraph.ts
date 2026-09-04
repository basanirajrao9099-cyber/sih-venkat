import { ImpactNode, ImpactSummaryMetrics } from '../types/impactGraph';

export const CS_0001_SUMMARY: ImpactSummaryMetrics = {
  sitesCount: 3,
  participantsCount: 47,
  visitsCount: 1,
  crfsCount: 1,
  edcMappingsCount: 1,
  ethicsAffected: true,
  trainingAffected: true,
  consentAffected: true,
};

export const CS_0001_NODES: ImpactNode[] = [
  // Root Node
  {
    id: 'node-root',
    label: 'CS-0001',
    entity: 'ChangeSet CS-0001',
    category: 'Root',
    severity: 'HIGH',
    reason: 'Protocol Amendment expanding Visit 4 schedule window from Day 25–31 to Day 25–35.',
    relationship: 'Root ChangeSet Docket',
    relatedChangeSet: 'CS-0001',
    hasChildren: true,
  },

  // Branch 1: Sites
  {
    id: 'node-sites',
    label: 'Sites',
    entity: 'Investigational Sites',
    category: 'Sites',
    severity: 'MEDIUM',
    reason: '3 trial centers have active subjects currently approaching the Day 25 milestone.',
    relationship: 'Impacted Trial Centers',
    relatedChangeSet: 'CS-0001',
    parentId: 'node-root',
    hasChildren: true,
    meta: { count: 3 },
  },
  {
    id: 'node-site-01',
    label: 'Site 01',
    entity: 'Site 01 (AIIA New Delhi)',
    category: 'Sites',
    severity: 'MEDIUM',
    reason: '18 active participants scheduled for Visit 4 within the next 10 calendar days.',
    relationship: 'Site Cluster Branch',
    relatedChangeSet: 'CS-0001',
    parentId: 'node-sites',
    meta: { count: 18, code: 'SITE-01-AIIA' },
  },
  {
    id: 'node-site-02',
    label: 'Site 02',
    entity: 'Site 02 (NIA Jaipur)',
    category: 'Sites',
    severity: 'MEDIUM',
    reason: '15 active participants eligible for the 4-day flex window dispensation.',
    relationship: 'Site Cluster Branch',
    relatedChangeSet: 'CS-0001',
    parentId: 'node-sites',
    meta: { count: 15, code: 'SITE-02-NIAJ' },
  },
  {
    id: 'node-site-03',
    label: 'Site 03',
    entity: 'Site 03 (ITRA Jamnagar)',
    category: 'Sites',
    severity: 'LOW',
    reason: '14 active participants scheduled for clinic visits with rural transit accommodations.',
    relationship: 'Site Cluster Branch',
    relatedChangeSet: 'CS-0001',
    parentId: 'node-sites',
    meta: { count: 14, code: 'SITE-03-IPGT' },
  },

  // Branch 2: Participants
  {
    id: 'node-participants',
    label: 'Participants',
    entity: 'Participants',
    category: 'Participants',
    severity: 'HIGH',
    reason: '47 enrolled subjects require re-synchronized appointment windows for Visit 4.',
    relationship: 'Subject Cohort Cohort Flow',
    relatedChangeSet: 'CS-0001',
    parentId: 'node-root',
    hasChildren: true,
    meta: { count: 47 },
  },
  {
    id: 'node-participants-sub',
    label: '47 Participants',
    entity: '47 Participants',
    category: 'Participants',
    severity: 'HIGH',
    reason: 'Subject clinic visit notifications must be updated with the expanded Day 25–35 window.',
    relationship: 'Active Patient Group in Window',
    relatedChangeSet: 'CS-0001',
    parentId: 'node-participants',
    meta: { count: 47 },
  },

  // Branch 3: Visit 4
  {
    id: 'node-visit-4',
    label: 'Visit 4',
    entity: 'Visit 4',
    category: 'Protocol',
    severity: 'HIGH',
    reason: 'Visit schedule changed from Day 25–31 to Day 25–35.',
    relationship: 'Direct Schedule Amendment',
    relatedChangeSet: 'CS-0001',
    parentId: 'node-root',
    meta: { code: 'V4 (Day 25–35)' },
  },

  // Branch 4: CRF
  {
    id: 'node-crf',
    label: 'CRF',
    entity: 'CRF',
    category: 'Systems',
    severity: 'MEDIUM',
    reason: 'Paper and digital Case Report Form module for Visit 4 requires updated window validation stamps.',
    relationship: 'Data Collection Instrument',
    relatedChangeSet: 'CS-0001',
    parentId: 'node-root',
    meta: { code: 'CRF-V4-v1.1' },
  },

  // Branch 5: EDC
  {
    id: 'node-edc',
    label: 'EDC',
    entity: 'EDC',
    category: 'Systems',
    severity: 'MEDIUM',
    reason: 'Electronic Data Capture rules in REDCap/OpenClinica must update allowable visit date logic to +35 days without flagging out-of-window queries.',
    relationship: 'EDC Validation Matrix',
    relatedChangeSet: 'CS-0001',
    parentId: 'node-root',
    meta: { code: 'EDC-RULE-V4' },
  },

  // Branch 6: Ethics
  {
    id: 'node-ethics',
    label: 'Ethics',
    entity: 'Ethics',
    category: 'Governance',
    severity: 'HIGH',
    reason: 'Institutional Ethics Committee (IEC/IRB) expedited amendment dossier submission and approval notice required.',
    relationship: 'Regulatory & Bioethics Clearance',
    relatedChangeSet: 'CS-0001',
    parentId: 'node-root',
    meta: { code: 'IEC-AMD-v1.1' },
  },

  // Branch 7: Training
  {
    id: 'node-training',
    label: 'Training',
    entity: 'Training',
    category: 'Governance',
    severity: 'LOW',
    reason: '15-minute briefing session for Site Clinical Research Coordinators (CRCs) on revised scheduling rules.',
    relationship: 'Site Staff Operations',
    relatedChangeSet: 'CS-0001',
    parentId: 'node-root',
    meta: { code: 'SOP-TR-004' },
  },

  // Branch 8: Consent
  {
    id: 'node-consent',
    label: 'Consent',
    entity: 'Consent',
    category: 'Governance',
    severity: 'MEDIUM',
    reason: 'Patient Information Sheet (PIS) addendum confirming patient agreement to flexible visit windows.',
    relationship: 'Participant Ethical Protection',
    relatedChangeSet: 'CS-0001',
    parentId: 'node-root',
    meta: { code: 'ICF-ADD-v1.1' },
  },
];
