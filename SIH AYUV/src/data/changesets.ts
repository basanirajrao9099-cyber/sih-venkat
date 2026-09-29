export interface ChangeSetRecord {
  id: string; // e.g. "CS-0001"
  trialId: string; // e.g. "AYU-CT-2026-042"
  trialName: string; // e.g. "Ashwagandha & Guduchi Study"
  protocol?: string; // e.g. "v1.1"
  type: string; // e.g. "Visit schedule"
  title?: string; // e.g. "Visit 4 Schedule Amendment"
  reason?: string; // e.g. "Scheduling variation across multi-center research sites"
  section?: string; // e.g. "Visit Schedule"
  previousState: string; // e.g. "Day 25–31"
  newState: string; // e.g. "Day 25–35"
  change: string; // e.g. "Visit 4: Day 25–31 → Day 25–35"
  affectedEntities: string[]; // ["Sites", "Participants", "Visit", "CRF", "EDC", "Ethics", "Training", "Consent"]
  effectiveDate: string; // e.g. "2026-03-15"
  status:
    | 'Draft'
    | 'DRAFT'
    | 'Impact analyzed'
    | 'In review'
    | 'IN REVIEW'
    | 'Ready'
    | 'READY'
    | 'SUBMITTED'
    | 'APPROVED'
    | 'UNDER REVIEW';
  created: string; // e.g. "Today"
}

const STORAGE_KEY = 'ayu_trial_fabric_changesets_v3';

export const INITIAL_CHANGESETS: ChangeSetRecord[] = [
  {
    id: 'CS-0001',
    trialId: 'AYU-CT-2026-042',
    trialName: 'Ashwagandha & Guduchi in Post-Viral Fatigue Study',
    protocol: 'v1.1',
    type: 'Visit Schedule Modification',
    title: 'Visit 4 Assessment Window Flex Shift',
    reason: 'Scheduling variation across multi-center research sites while maintaining protocol-defined assessment timing.',
    section: 'Visit Schedule (Table 4.2)',
    previousState: 'Day 25–31',
    newState: 'Day 25–35',
    change: 'Visit 4 window: Day 25–31 → Day 25–35 (+4 Days)',
    affectedEntities: [
      'Sites (3 Centers)',
      'Participants (47 Subjects)',
      'Visit 4 Window',
      'eCRF Form 04',
      'EDC Schedule',
      'IEC Notification',
      'CRC Retraining',
      'Consent Addendum v1.1',
    ],
    effectiveDate: '2026-03-15',
    status: 'IN REVIEW',
    created: 'Today',
  },
  {
    id: 'CS-0002',
    trialId: 'AYU-CT-2026-088',
    trialName: 'Multicenter Efficacy of AYUSH-64 in Amavata (Rheumatoid Arthritis)',
    protocol: 'v1.2',
    type: 'Dosage & Administration',
    title: 'AYUSH-64 Dosage & Post-Meal Intake Optimization',
    reason: 'Optimizes anti-inflammatory bioavailability and joint symptom relief in moderate Amavata patients.',
    section: 'Dosage & Posology (Section 3.4)',
    previousState: 'AYUSH-64: 500mg 2x/day (BD)',
    newState: 'AYUSH-64: 500mg 3x/day (TDS) Post-Meal',
    change: 'Dosage: 500mg BD → 500mg TDS Post-Meal (+1 Dose)',
    affectedEntities: [
      'Sites (5 Centers)',
      'Participants (180 Subjects)',
      'Drug Accountability Log',
      'ACR-20 eCRF Form',
      'EDC Posology Rules',
      'DSMB Safety Clearance',
      'CRC Dosing Training',
      'Patient Dosage Leaflet',
    ],
    effectiveDate: '2026-04-01',
    status: 'IN REVIEW',
    created: 'Today',
  },
  {
    id: 'CS-0003',
    trialId: 'AYU-CT-2026-105',
    trialName: 'Curcumin-Boswellia Phytosome Formulation in Knee Osteoarthritis',
    protocol: 'v2.0',
    type: 'Inclusion Criteria & Scoring',
    title: 'WOMAC Score & Inclusion Age Expansion (45–75 yrs)',
    reason: 'Broadens real-world accessibility and accelerates participant accrual across geriatric cohorts.',
    section: 'Eligibility Criteria (Section 2.1)',
    previousState: 'Age: 50–65 yrs (WOMAC > 50)',
    newState: 'Age: 45–75 yrs (WOMAC > 40)',
    change: 'Inclusion: Age 50–65 (WOMAC >50) → Age 45–75 (WOMAC >40)',
    affectedEntities: [
      'Sites (6 Centers)',
      'Participants (240 Subjects)',
      'WOMAC Pain Questionnaire',
      'Radiology eCRF',
      'EDC Screening Engine',
      'IEC Age Addendum',
      'Investigator Briefing',
      'Informed Consent Form v1.2',
    ],
    effectiveDate: '2026-04-10',
    status: 'IN REVIEW',
    created: 'Today',
  },
  {
    id: 'CS-0004',
    trialId: 'AYU-CT-2026-121',
    trialName: 'Triphala Guggulu & Nishamalaki in T2D Metabolic Biomarker Study',
    protocol: 'v1.3',
    type: 'Lab Assessment Schedule',
    title: 'HbA1c & LFT Safety Diagnostic Window Adjustment',
    reason: 'Accommodates multi-center NABL lab batch testing logistics without generating non-compliance flags.',
    section: 'Schedule of Laboratory Evaluations',
    previousState: 'Testing: Every 30 Days (±2d)',
    newState: 'Testing: 45-Day Flex Schedule (±5d)',
    change: 'Biomarker Window: Every 30 Days → 45-Day Flex Window',
    affectedEntities: [
      'Sites (10 Centers)',
      'Participants (400 Subjects)',
      'Central Lab Transmittal Form',
      'Lipid & LFT eCRF',
      'EDC Validation Rules',
      'NABL Lab SOP Review',
      'Phlebotomy Training',
      'Patient Visit Card v2.0',
    ],
    effectiveDate: '2026-05-01',
    status: 'IN REVIEW',
    created: 'Today',
  },
  {
    id: 'CS-0005',
    trialId: 'AYU-CT-2026-149',
    trialName: 'Shirodhara with Brahmi Taila in Generalized Anxiety Disorder',
    protocol: 'v1.1',
    type: 'Procedure Window Tolerance',
    title: 'Shirodhara Procedure Session Duration Flexibility',
    reason: 'Allows panchakarma therapist calibration based on subject autonomic stabilization.',
    section: 'Panchakarma Procedure Manual',
    previousState: 'Procedure Duration: Strict 45 mins',
    newState: 'Procedure Duration: 40–50 mins flex',
    change: 'Procedure Tolerance: Strict 45m → 40–50m Tolerant Window',
    affectedEntities: [
      'Sites (3 Centers)',
      'Participants (120 Subjects)',
      'Panchakarma Session Log',
      'HAM-A Anxiety Scale',
      'EDC Procedure CRF',
      'IEC Protocol Addendum',
      'Therapist Calibration Log',
      'Subject Relaxation Diary',
    ],
    effectiveDate: '2026-05-15',
    status: 'IN REVIEW',
    created: 'Today',
  },
];

export function getStoredChangeSets(): ChangeSetRecord[] {
  if (typeof window === 'undefined') return INITIAL_CHANGESETS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure standard presets exist
        const merged = [...INITIAL_CHANGESETS];
        parsed.forEach((p) => {
          if (!merged.some((m) => m.id === p.id)) {
            merged.push(p);
          }
        });
        return merged;
      }
    }
  } catch (err) {
    console.error('Failed to parse changesets from localStorage', err);
  }
  return INITIAL_CHANGESETS;
}

export function saveStoredChangeSet(newChangeSet: ChangeSetRecord): ChangeSetRecord[] {
  const current = getStoredChangeSets();
  const index = current.findIndex((cs) => cs.id === newChangeSet.id);
  let updated: ChangeSetRecord[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = newChangeSet;
  } else {
    updated = [newChangeSet, ...current];
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save changeset to localStorage', err);
    }
  }
  return updated;
}
