import { RecruitmentOpsData } from '../types/trialOps';

export const DEMO_RECRUITMENT: RecruitmentOpsData = {
  target: 400,
  enrolled: 284,
  remaining: 116,
  recruitmentPct: 71,
  trend: [
    { month: 'Oct 2025', target: 50, enrolled: 42 },
    { month: 'Nov 2025', target: 120, enrolled: 104 },
    { month: 'Dec 2025', target: 200, enrolled: 178 },
    { month: 'Jan 2026', target: 280, enrolled: 242 },
    { month: 'Feb 2026', target: 350, enrolled: 284 },
    { month: 'Mar 2026 (Est)', target: 400, enrolled: 350 },
  ],
  sites: [
    { siteId: 'SITE-001', siteName: 'Hyderabad Clinical Centre', target: 25, enrolled: 18, pct: 72 },
    { siteId: 'SITE-002', siteName: 'Delhi Apex Research Hospital (AIIA)', target: 70, enrolled: 54, pct: 77 },
    { siteId: 'SITE-003', siteName: 'Jaipur Ayurvedic Institute (NIA)', target: 55, enrolled: 41, pct: 75 },
    { siteId: 'SITE-004', siteName: 'Jamnagar Center of Excellence (ITRA)', target: 60, enrolled: 47, pct: 78 },
    { siteId: 'SITE-005', siteName: 'Mumbai KEM Hospital Unit', target: 50, enrolled: 38, pct: 76 },
    { siteId: 'SITE-006', siteName: 'Varanasi IMS Clinical Wing', target: 50, enrolled: 36, pct: 72 },
    { siteId: 'SITE-007', siteName: 'Bengaluru CARI Research Center', target: 45, enrolled: 32, pct: 71 },
    { siteId: 'SITE-008', siteName: 'Thiruvananthapuram GACH', target: 45, enrolled: 18, pct: 40 },
  ]
};
