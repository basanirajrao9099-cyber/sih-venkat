import { UserProfile, RoleName } from '../types/user';

export const DEMO_ROLES: { role: RoleName; user: UserProfile }[] = [
  {
    role: 'Principal Investigator',
    user: {
      id: 'usr-pi-01',
      name: 'Prof. Dr. Anandita Sharma, MD (Ayurveda)',
      email: 'a.sharma@aiia.gov.in',
      role: 'Principal Investigator',
      institution: 'All India Institute of Ayurveda (AIIA), New Delhi',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
      permissions: ['view_trials', 'edit_protocol', 'approve_amendments', 'sign_case_reports', 'export_data']
    }
  },
  {
    role: 'Trial Coordinator',
    user: {
      id: 'usr-tc-02',
      name: 'Rajesh Nair, M.Pharm (ClinRes)',
      email: 'r.nair@trialfabric.org',
      role: 'Trial Coordinator',
      institution: 'Central Coordinating Office — Ayush Trials Unit',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
      permissions: ['view_trials', 'manage_participants', 'schedule_visits', 'log_queries', 'site_operations']
    }
  },
  {
    role: 'Monitor',
    user: {
      id: 'usr-cra-03',
      name: 'Sunita Deshmukh, Lead CRA',
      email: 's.deshmukh@cro-partners.in',
      role: 'Monitor',
      institution: 'Quality & Clinical Monitoring Services',
      avatar: 'https://images.unsplash.com/photo-1594824813591-49fa5226462c?auto=format&fit=crop&q=80&w=200',
      permissions: ['view_trials', 'audit_sites', 'verify_source_data', 'issue_deviation_notices']
    }
  },
  {
    role: 'Ethics Reviewer',
    user: {
      id: 'usr-iec-04',
      name: 'Dr. Vikramaditya Joshi, MBBS, PhD (Bioethics)',
      email: 'ethics.chair@ccras.nic.in',
      role: 'Ethics Reviewer',
      institution: 'Institutional Ethics Committee (IEC-Central)',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
      permissions: ['review_ethics', 'vote_amendments', 'inspect_icfs', 'request_protocol_clarification']
    }
  },
  {
    role: 'Pharmacovigilance',
    user: {
      id: 'usr-pv-05',
      name: 'Dr. Meera Nambiar, MD (Pharmacology)',
      email: 'pv.safety@cdsco-ayush.gov.in',
      role: 'Pharmacovigilance',
      institution: 'National Pharmacovigilance Centre for Ayush',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      permissions: ['view_trials', 'adverse_event_triage', 'cdsco_reporting', 'safety_advisory_alerts']
    }
  },
  {
    role: 'Admin',
    user: {
      id: 'usr-adm-06',
      name: 'Kavita Sundaram',
      email: 'admin@trialfabric.org',
      role: 'Admin',
      institution: 'AYU-TRIAL FABRIC Core Platform Administration',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
      permissions: ['full_platform_access', 'user_provisioning', 'integration_orchestration', 'audit_logs']
    }
  }
];
