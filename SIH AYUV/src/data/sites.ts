import { SiteOpsItem } from '../types/trialOps';

export const DEMO_SITES: SiteOpsItem[] = [
  {
    id: 'site-ops-001',
    siteId: 'SITE-001',
    siteName: 'Hyderabad Clinical Centre',
    investigator: 'Dr. Rao',
    location: 'Hyderabad, Telangana',
    participants: 18,
    trainingPct: 92,
    documentsPct: 100,
    activationStatus: 'ACTIVE',
    governanceStatus: 'READY',
    contactEmail: 'dr.rao@hyderabad-trials.org',
    lastMonitorVisit: '2026-02-14'
  },
  {
    id: 'site-ops-002',
    siteId: 'SITE-002',
    siteName: 'Delhi Apex Research Hospital (AIIA)',
    investigator: 'Dr. Sharma',
    location: 'New Delhi, Delhi',
    participants: 54,
    trainingPct: 100,
    documentsPct: 100,
    activationStatus: 'ACTIVE',
    governanceStatus: 'READY',
    contactEmail: 'dr.sharma@aiia.gov.in',
    lastMonitorVisit: '2026-02-28'
  },
  {
    id: 'site-ops-003',
    siteId: 'SITE-003',
    siteName: 'Jaipur Ayurvedic Institute (NIA)',
    investigator: 'Dr. Joshi',
    location: 'Jaipur, Rajasthan',
    participants: 41,
    trainingPct: 95,
    documentsPct: 96,
    activationStatus: 'ACTIVE',
    governanceStatus: 'READY',
    contactEmail: 'dr.joshi@nia.nic.in',
    lastMonitorVisit: '2026-02-25'
  },
  {
    id: 'site-ops-004',
    siteId: 'SITE-004',
    siteName: 'Jamnagar Center of Excellence (ITRA)',
    investigator: 'Dr. Thakar',
    location: 'Jamnagar, Gujarat',
    participants: 47,
    trainingPct: 98,
    documentsPct: 100,
    activationStatus: 'ACTIVE',
    governanceStatus: 'READY',
    contactEmail: 'dr.thakar@itra.edu.in',
    lastMonitorVisit: '2026-03-01'
  },
  {
    id: 'site-ops-005',
    siteId: 'SITE-005',
    siteName: 'Mumbai KEM Hospital Clinical Research Unit',
    investigator: 'Dr. Thatte',
    location: 'Mumbai, Maharashtra',
    participants: 38,
    trainingPct: 88,
    documentsPct: 90,
    activationStatus: 'ACTIVE',
    governanceStatus: 'PENDING AUDIT',
    contactEmail: 'dr.thatte@kem.edu',
    lastMonitorVisit: '2026-02-10'
  },
  {
    id: 'site-ops-006',
    siteId: 'SITE-006',
    siteName: 'Varanasi IMS Clinical Study Wing',
    investigator: 'Dr. Tripathi',
    location: 'Varanasi, Uttar Pradesh',
    participants: 36,
    trainingPct: 91,
    documentsPct: 95,
    activationStatus: 'ACTIVE',
    governanceStatus: 'READY',
    contactEmail: 'dr.tripathi@bhu.ac.in',
    lastMonitorVisit: '2026-02-20'
  }
];
