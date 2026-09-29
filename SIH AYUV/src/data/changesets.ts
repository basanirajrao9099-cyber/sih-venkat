export interface ChangeSetRecord {
  id: string; // e.g. "CS-0001"
  trialId: string; // e.g. "ATF-001"
  trialName: string; // e.g. "AYU-TRIAL FABRIC Demonstration Trial"
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

const STORAGE_KEY = 'ayu_trial_fabric_changesets_v2';

export const INITIAL_CHANGESETS: ChangeSetRecord[] = [
  {
    id: 'CS-0001',
    trialId: 'ATF-001',
    trialName: 'AYU-TRIAL FABRIC Demonstration Trial',
    protocol: 'v1.1',
    type: 'Protocol Amendment',
    previousState: 'Day 25–31',
    newState: 'Day 25–35',
    change: 'Visit 4 schedule: Day 25–31 → Day 25–35',
    affectedEntities: [
      'Sites (3)',
      'Participants (47)',
      'Visit 4',
      'CRF',
      'EDC Mapping',
      'Ethics',
      'Training',
      'Consent',
    ],
    effectiveDate: '2026-03-15',
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
        return parsed;
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
