import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Building2,
  Users,
  Calendar,
  FileCheck,
  ShieldCheck,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { getStoredChangeSets, ChangeSetRecord } from '../data/changesets';
import { useToast } from '../hooks/useToast';
import { useTrial } from '../hooks/useTrialContext';
import { apiFetch } from '../services/api';

interface TrialImpactProfile {
  scopeTitle: string;
  scopeSubtitle: string;
  sitesCount: number;
  totalSites: number;
  cohortCount: number;
  affectedParameterName: string;
  affectedParameterValue: string;
  crfCount: number;
  crfName: string;
  crfDetail: string;
  targetEntityTitle: string;
  currentValue: string;
  proposedValue: string;
  whySitesAffected: string;
  whyCohortAffected: string;
  whyParameterAffected: string;
  whyCrfAffected: string;
  consentTitle: string;
  consentDetail: string;
  trainingTitle: string;
  trainingDetail: string;
  ethicsTitle: string;
  ethicsDetail: string;
  sites: {
    siteId: string;
    name: string;
    location: string;
    investigator: string;
    participantsCount: number;
    impactStatus: string;
    trainingStatus: string;
  }[];
}

export const ImpactPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { selectedTrial } = useTrial();

  const [availableChangeSets, setAvailableChangeSets] = useState<ChangeSetRecord[]>([]);
  const [selectedCsId, setSelectedCsId] = useState<string>('CS-0001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expandable sections state (progressive disclosure)
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    sites: false,
    participants: false,
    visits: true, // Default open for primary change
    crfs: false,
    consent: false,
    training: false,
    ethics: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const loaded = getStoredChangeSets();
    if (loaded.length > 0) {
      setAvailableChangeSets(loaded);
      const matching = loaded.find(
        (c) => c.trialId === selectedTrial.protocolId || c.trialId === selectedTrial.id
      ) || (selectedTrial.protocolId.includes('088') ? loaded.find((c) => c.id === 'CS-0002') : null)
        || (selectedTrial.protocolId.includes('105') ? loaded.find((c) => c.id === 'CS-0003') : null)
        || (selectedTrial.protocolId.includes('121') ? loaded.find((c) => c.id === 'CS-0004') : null)
        || (selectedTrial.protocolId.includes('149') ? loaded.find((c) => c.id === 'CS-0005') : null)
        || loaded[0];

      if (matching) setSelectedCsId(matching.id);
    }
  }, [selectedTrial.id, selectedTrial.protocolId]);

  const selectedCs: ChangeSetRecord = availableChangeSets.find((c) => c.id === selectedCsId) || {
    id: 'CS-0001',
    trialId: selectedTrial.protocolId,
    trialName: selectedTrial.title,
    protocol: 'v1.1',
    type: 'Visit schedule',
    title: 'Visit 4 Schedule Window Modification',
    reason: 'Scheduling variation across multi-center research sites while maintaining protocol compliance',
    section: 'Visit Schedule (Table 4.2)',
    previousState: 'Visit 4: Day 25–31',
    newState: 'Visit 4: Day 25–35',
    change: 'Day 25–31 → Day 25–35',
    affectedEntities: ['Sites', 'Participants', 'Visits', 'CRF'],
    effectiveDate: '2026-03-15',
    status: 'IN REVIEW',
    created: 'Today',
  };

  // Generate dynamic, rich profile for the active trial and changeset
  const getImpactProfile = (): TrialImpactProfile => {
    const isAyush64 = selectedTrial.protocolId.includes('088') || selectedCs.id === 'CS-0002';
    const isCurcumin = selectedTrial.protocolId.includes('105') || selectedCs.id === 'CS-0003';
    const isTriphala = selectedTrial.protocolId.includes('121') || selectedCs.id === 'CS-0004';
    const isBrahmi = selectedTrial.protocolId.includes('149') || selectedCs.id === 'CS-0005';

    if (isAyush64) {
      return {
        scopeTitle: 'Dosage & Posology Optimization Amendment',
        scopeSubtitle: 'Posology increase to 500mg TDS post-meal across moderate Amavata patient cohorts',
        sitesCount: 5,
        totalSites: 5,
        cohortCount: selectedTrial.enrolledCount || 172,
        affectedParameterName: 'Dosage Schedule',
        affectedParameterValue: '500mg TDS',
        crfCount: 2,
        crfName: 'CRF-03: Drug Accountability & ACR-20 Form',
        crfDetail: 'REDCap Instrument ID: crf_posology_v1.2 · Parameter: 500mg TDS Post-Meal Intake',
        targetEntityTitle: 'Investigational Product Dosing Regimen',
        currentValue: 'AYUSH-64: 500mg 2x/day (BD)',
        proposedValue: 'AYUSH-64: 500mg 3x/day (TDS) Post-Meal (+1 Dose)',
        whySitesAffected: 'All participating rheumatoid research centers must receive updated blister packaging and log sheets.',
        whyCohortAffected: `${selectedTrial.enrolledCount || 172} enrolled active subjects require updated posology compliance instructions.`,
        whyParameterAffected: 'The amendment optimizes anti-inflammatory bioavailability by adding a post-meal midday dose.',
        whyCrfAffected: 'Drug dispensation and ACR-20 symptom score forms require updated morning/afternoon/evening timestamps.',
        consentTitle: 'Patient Information Leaflet (PIL v1.2 Posology Addendum)',
        consentDetail: 'Must be distributed to all subjects to explain the 3x/day administration schedule and digestive safety monitoring.',
        trainingTitle: 'Site Pharmacy & CRC Dispensation Retraining',
        trainingDetail: 'Clinical research coordinators across CARI Delhi, NIMHANS Bengaluru, and AIIA New Delhi must complete posology protocol calibration.',
        ethicsTitle: 'Institutional Ethics Committee (IEC) Expedited Review',
        ethicsDetail: 'Submitted under NDCT 2019 Rule 26 for expedited approval of optimized posology and safety documentation.',
        sites: [
          { siteId: 'SITE-01', name: 'Central Ayurveda Research Institute (CARI)', location: 'New Delhi', investigator: 'Dr. Devendra Triguna', participantsCount: 42, impactStatus: 'AFFECTED', trainingStatus: 'VERIFIED' },
          { siteId: 'SITE-02', name: 'NIMHANS Integrative Medicine Wing', location: 'Bengaluru', investigator: 'Dr. S. K. Prajapati', participantsCount: 38, impactStatus: 'AFFECTED', trainingStatus: 'COMPLETED' },
          { siteId: 'SITE-03', name: 'All India Institute of Ayurveda (AIIA)', location: 'New Delhi', investigator: 'Prof. Dr. Anandita Sharma', participantsCount: 36, impactStatus: 'AFFECTED', trainingStatus: 'REQUIRED' },
          { siteId: 'SITE-04', name: 'National Institute of Ayurveda (NIA)', location: 'Jaipur', investigator: 'Dr. Rajeshwar Varma', participantsCount: 30, impactStatus: 'AFFECTED', trainingStatus: 'REQUIRED' },
          { siteId: 'SITE-05', name: 'Banaras Hindu University (BHU) Faculty of Ayurveda', location: 'Varanasi', investigator: 'Dr. K. N. Dwivedi', participantsCount: 26, impactStatus: 'AFFECTED', trainingStatus: 'REQUIRED' },
        ],
      };
    }

    if (isCurcumin) {
      return {
        scopeTitle: 'Inclusion Criteria & WOMAC Score Scope Expansion',
        scopeSubtitle: 'Broadening eligibility age to 45–75 years and WOMAC pain cutoff to >40 points',
        sitesCount: 6,
        totalSites: 6,
        cohortCount: selectedTrial.enrolledCount || 148,
        affectedParameterName: 'Eligibility Criteria',
        affectedParameterValue: 'Age 45–75 (WOMAC >40)',
        crfCount: 1,
        crfName: 'CRF-01: Eligibility Screening & Baseline Radiography',
        crfDetail: 'REDCap Instrument ID: crf_screening_v2.0 · Parameter: Age 45–75 & Kellgren-Lawrence Grade II/III',
        targetEntityTitle: 'Subject Inclusion & Stratification Criteria',
        currentValue: 'Age: 50–65 yrs (WOMAC Pain Index > 50)',
        proposedValue: 'Age: 45–75 yrs (WOMAC Pain Index > 40 Expanded)',
        whySitesAffected: 'All 6 investigational centers must recalibrate screening filters to enroll expanded geriatric cohorts.',
        whyCohortAffected: `${selectedTrial.enrolledCount || 148} active participants currently enrolled + new recruitment tier opened immediately.`,
        whyParameterAffected: 'Protocol amendment accelerates recruitment accrual across senior osteoarthritis patient demographics.',
        whyCrfAffected: 'Screening validation script bounds updated from 50–65 to 45–75 years in the Electronic Data Capture engine.',
        consentTitle: 'Informed Consent Form (ICF v2.0 Geriatric Addendum)',
        consentDetail: 'Updated informed consent document approved for subjects aged 45–75 with localized knee osteoarthritic symptoms.',
        trainingTitle: 'Radiography & WOMAC Assessment Standardization Briefing',
        trainingDetail: 'Principal investigators at NIA Jaipur, AIIMS New Delhi, and IPGT Jamnagar must verify updated inclusion criteria.',
        ethicsTitle: 'Multi-Center IEC Sub-Committee Acknowledgment',
        ethicsDetail: 'Notified to central and institutional ethics committees in accordance with ICMR 2017 Section 5 ethical guidelines.',
        sites: [
          { siteId: 'SITE-01', name: 'National Institute of Ayurveda (NIA)', location: 'Jaipur', investigator: 'Prof. Sanjeev Sharma', participantsCount: 38, impactStatus: 'AFFECTED', trainingStatus: 'VERIFIED' },
          { siteId: 'SITE-02', name: 'AIIMS Department of Integrative Medicine', location: 'New Delhi', investigator: 'Dr. R. M. Pandey', participantsCount: 32, impactStatus: 'AFFECTED', trainingStatus: 'VERIFIED' },
          { siteId: 'SITE-03', name: 'Government Ayurvedic College', location: 'Guwahati', investigator: 'Dr. B. K. Goswami', participantsCount: 24, impactStatus: 'AFFECTED', trainingStatus: 'COMPLETED' },
          { siteId: 'SITE-04', name: 'Institute of Teaching & Research in Ayurveda (ITRA)', location: 'Jamnagar', investigator: 'Dr. Meenakshi Bhatt', participantsCount: 22, impactStatus: 'AFFECTED', trainingStatus: 'REQUIRED' },
          { siteId: 'SITE-05', name: 'SDM College of Ayurveda & Hospital', location: 'Udupi', investigator: 'Dr. Prasanna Rao', participantsCount: 18, impactStatus: 'AFFECTED', trainingStatus: 'REQUIRED' },
          { siteId: 'SITE-06', name: 'IMS Banaras Hindu University', location: 'Varanasi', investigator: 'Dr. V. K. Joshi', participantsCount: 14, impactStatus: 'AFFECTED', trainingStatus: 'REQUIRED' },
        ],
      };
    }

    if (isTriphala) {
      return {
        scopeTitle: 'Central NABL Lab Diagnostic Window Calibration',
        scopeSubtitle: 'Flexibility adjustment for HbA1c, fasting glucose, and LFT panel batch laboratory evaluations',
        sitesCount: selectedTrial.activeSites || 10,
        totalSites: selectedTrial.activeSites || 10,
        cohortCount: selectedTrial.enrolledCount || 395,
        affectedParameterName: 'Lab Evaluation Window',
        affectedParameterValue: '45-Day Flex Schedule',
        crfCount: 2,
        crfName: 'CRF-05: Central Lab Transmittal & Metabolic Panel',
        crfDetail: 'REDCap Instrument ID: crf_lab_metabolic_v1.3 · Parameter: 45-Day Window (±5 Days)',
        targetEntityTitle: 'Safety Biomarker & Metabolic Evaluation Window',
        currentValue: 'Testing: Every 30 Days (±2 Days Strict)',
        proposedValue: 'Testing: 45-Day Flex Schedule (±5 Days Tolerance)',
        whySitesAffected: 'All 10 research centers shipping blood draws to the central NABL accredited laboratory are synchronized.',
        whyCohortAffected: `${selectedTrial.enrolledCount || 395} enrolled T2DM participants transition to the calibrated 45-day testing interval.`,
        whyParameterAffected: 'Prevents logistical batch testing delays from generating false protocol deviation compliance flags.',
        whyCrfAffected: 'Electronic Data Capture logic updated to accept sample submissions up to Day 45 (±5d flex tolerance).',
        consentTitle: 'Participant Follow-up & Lab Schedule Notice Card',
        consentDetail: 'Clear schedule card handed to patients detailing the 45-day follow-up interval for blood draws and dietary logs.',
        trainingTitle: 'Phlebotomy & Cold-Chain Shipping Protocol Briefing',
        trainingDetail: 'Clinical research coordinators and lab technicians across all participating sites re-certified for batch packaging.',
        ethicsTitle: 'Ethics Committee Administrative Amendment Acceptance',
        ethicsDetail: 'Submitted as a non-significant risk procedural optimization under NDCT 2019 Rule 26.',
        sites: [
          { siteId: 'SITE-01', name: 'IPGT&RA Gujarat Ayurved University', location: 'Jamnagar', investigator: 'Dr. Vaidya K.S. Dhiman', participantsCount: 65, impactStatus: 'AFFECTED', trainingStatus: 'VERIFIED' },
          { siteId: 'SITE-02', name: 'All India Institute of Ayurveda (AIIA)', location: 'New Delhi', investigator: 'Prof. Dr. Anandita Sharma', participantsCount: 52, impactStatus: 'AFFECTED', trainingStatus: 'VERIFIED' },
          { siteId: 'SITE-03', name: 'National Institute of Ayurveda (NIA)', location: 'Jaipur', investigator: 'Dr. Rajeshwar Varma', participantsCount: 48, impactStatus: 'AFFECTED', trainingStatus: 'COMPLETED' },
          { siteId: 'SITE-04', name: 'Government Ayurveda College', location: 'Thiruvananthapuram', investigator: 'Dr. G. S. Pillai', participantsCount: 45, impactStatus: 'AFFECTED', trainingStatus: 'REQUIRED' },
          { siteId: 'SITE-05', name: 'State Ayurvedic College & Hospital', location: 'Lucknow', investigator: 'Dr. P. C. Saxena', participantsCount: 42, impactStatus: 'AFFECTED', trainingStatus: 'REQUIRED' },
        ],
      };
    }

    if (isBrahmi) {
      return {
        scopeTitle: 'Panchakarma Procedure Tolerance Window Adjustment',
        scopeSubtitle: 'Shirodhara therapy session duration window adjusted from strict 45m to 40–50m flex',
        sitesCount: 3,
        totalSites: 3,
        cohortCount: selectedTrial.enrolledCount || 120,
        affectedParameterName: 'Procedure Window',
        affectedParameterValue: '40–50 mins flex',
        crfCount: 1,
        crfName: 'CRF-02: Shirodhara Procedure & HAM-A Anxiety Log',
        crfDetail: 'REDCap Instrument ID: crf_shirodhara_proc_v1.1 · Parameter: 40–50 min session log',
        targetEntityTitle: 'Panchakarma Procedure Duration & Tolerability',
        currentValue: 'Procedure Duration: Strict 45 mins',
        proposedValue: 'Procedure Duration: 40–50 mins flex window (+5m tolerance)',
        whySitesAffected: 'Panchakarma therapy units across NIMHANS and partner Ayurvedic centers must calibrate flow timing.',
        whyCohortAffected: `${selectedTrial.enrolledCount || 120} participants with Generalized Anxiety Disorder benefit from personalized autonomic stabilization.`,
        whyParameterAffected: 'Allows therapist calibration based on real-time blood pressure and pulse autonomic stabilization.',
        whyCrfAffected: 'Procedure logging form updated to accept start/end timestamps within the 40–50 minute tolerance range.',
        consentTitle: 'Therapy Procedure Information Addendum',
        consentDetail: 'Informs subjects of personalized therapy duration tolerances to enhance clinical comfort and safety.',
        trainingTitle: 'Panchakarma Therapist & CRC Flow Rate Training',
        trainingDetail: 'Therapy teams briefed on temperature regulation, standardized taila flow, and electronic logging protocol.',
        ethicsTitle: 'IEC Protocol Optimization Notification',
        ethicsDetail: 'Administrative protocol clarification filed with institutional ethics committees per NDCT 2019.',
        sites: [
          { siteId: 'SITE-01', name: 'NIMHANS Integrative Brain Health Wing', location: 'Bengaluru', investigator: 'Dr. B.R. Ramakrishna', participantsCount: 48, impactStatus: 'AFFECTED', trainingStatus: 'VERIFIED' },
          { siteId: 'SITE-02', name: 'All India Institute of Ayurveda (AIIA)', location: 'New Delhi', investigator: 'Prof. Dr. Anandita Sharma', participantsCount: 40, impactStatus: 'AFFECTED', trainingStatus: 'COMPLETED' },
          { siteId: 'SITE-03', name: 'Institute of Teaching & Research in Ayurveda (ITRA)', location: 'Jamnagar', investigator: 'Dr. Meenakshi Bhatt', participantsCount: 32, impactStatus: 'AFFECTED', trainingStatus: 'REQUIRED' },
        ],
      };
    }

    // Default Ashwagandha / Custom trial
    return {
      scopeTitle: selectedCs.title || 'Visit 4 Schedule Window Modification',
      scopeSubtitle: selectedCs.reason || 'Scheduling variation across multi-center research sites while maintaining protocol compliance',
      sitesCount: selectedTrial.activeSites || 3,
      totalSites: selectedTrial.activeSites || 8,
      cohortCount: selectedTrial.enrolledCount ? Math.min(selectedTrial.enrolledCount, 47) : 47,
      affectedParameterName: 'Visit 4 Window',
      affectedParameterValue: selectedCs.change || 'Day 25–35 (+4 Days)',
      crfCount: 1,
      crfName: 'CRF-04: Visit 4 Clinical Assessment Form',
      crfDetail: 'REDCap Instrument ID: crf_visit_04_v1 · Parameter Parity: Day 25–35',
      targetEntityTitle: 'Visit 4 (Mid-Treatment Assessment)',
      currentValue: selectedCs.previousState || 'Day 25–31 (7 Days)',
      proposedValue: selectedCs.newState || 'Day 25–35 (11 Days, +4 Days Flex)',
      whySitesAffected: 'Only these investigational centers have active patient cohorts approaching the Visit 4 window milestone.',
      whyCohortAffected: 'Active participants currently enrolled in the schedule timeline approaching the Visit 4 milestone.',
      whyParameterAffected: 'The amendment explicitly modifies the assessment window bounds for Visit 4 to prevent scheduling dropouts.',
      whyCrfAffected: 'Electronic Case Report Form validation logic must match physical protocol window bounds.',
      consentTitle: 'Patient Information Sheet (PIS v1.1 Addendum)',
      consentDetail: 'Must be provided to all ongoing participants to notify them of the 4-day flex window for their Day 25–35 clinical follow-up appointment.',
      trainingTitle: 'Site CRC Protocol Briefing Sign-Off',
      trainingDetail: `All research coordinators across ${selectedTrial.sponsor || 'participating study centers'} must complete a 15-minute briefing on the new window and submit training logs.`,
      ethicsTitle: 'Institutional Ethics Committee (IEC) Notification Required',
      ethicsDetail: 'Expedited ethics notification dossier must be acknowledged by the Institutional Ethics Committee prior to deploying the amendment.',
      sites: [
        { siteId: 'SITE-01', name: 'All India Institute of Ayurveda (AIIA)', location: 'New Delhi', investigator: selectedTrial.piName || 'Prof. Dr. Anandita Sharma', participantsCount: 18, impactStatus: 'AFFECTED', trainingStatus: 'VERIFIED' },
        { siteId: 'SITE-02', name: 'National Institute of Ayurveda (NIA)', location: 'Jaipur', investigator: 'Dr. Rajeshwar Varma', participantsCount: 15, impactStatus: 'AFFECTED', trainingStatus: 'COMPLETED' },
        { siteId: 'SITE-03', name: 'Institute of Teaching & Research in Ayurveda (ITRA)', location: 'Jamnagar', investigator: 'Dr. Meenakshi Bhatt', participantsCount: 14, impactStatus: 'AFFECTED', trainingStatus: 'REQUIRED' },
      ],
    };
  };

  const profile = getImpactProfile();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* 1. HEADER & AMENDMENT SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E5DC] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs font-bold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2]">
              {selectedCs.id}
            </span>
            <span className="text-xs text-[#5C6B62] font-medium">• {selectedTrial.shortTitle || selectedTrial.title}</span>
            <span className="text-[10px] font-mono text-[#8B6B18] bg-[#FEF6E9] px-2 py-0.5 rounded border border-[#E8C28A]/50">
              {selectedTrial.protocolId}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E2922]">
            Operational Impact Analysis
          </h1>
          <p className="text-xs text-[#5C6B62] mt-0.5">
            Automatic dependency analysis across clinical trial operations, participants, CRFs, and ethics mandates.
          </p>
        </div>

        {/* ChangeSet Dropdown */}
        {availableChangeSets.length > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-semibold text-[#5C6B62]">Docket:</label>
            <select
              value={selectedCsId}
              onChange={(e) => setSelectedCsId(e.target.value)}
              className="bg-[#FAF9F4] border border-[#E2DFD6] rounded-lg p-2 text-xs font-semibold text-[#1E2922] focus:outline-none focus:bg-white focus:border-[#1E4D38]"
            >
              {availableChangeSets.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.id} — {cs.type} ({cs.change})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. SUMMARY STRIP */}
      <section className="bg-white border border-[#E2DFD6] rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E5DC] pb-4 mb-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B62] font-mono">
              Blast Radius Scope
            </span>
            <p className="text-sm font-bold text-[#1E2922]">
              {profile.scopeTitle}
            </p>
            <p className="text-xs text-[#5C6B62]">
              {profile.scopeSubtitle}
            </p>
          </div>

          <button
            onClick={() => navigate('/changesets')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4D38] hover:underline cursor-pointer shrink-0"
          >
            <span>Return to amendment workflow →</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg">
            <span className="text-[10px] text-[#5C6B62] block font-medium">Impacted Sites</span>
            <span className="font-bold text-[#1E2922] text-sm">{profile.sitesCount} Sites</span>
            <span className="text-[10px] text-[#5C6B62] block mt-0.5">of {profile.totalSites} active</span>
          </div>
          <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg">
            <span className="text-[10px] text-[#5C6B62] block font-medium">Cohort Affected</span>
            <span className="font-bold text-[#1E2922] text-sm">{profile.cohortCount} Participants</span>
            <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">Flagged for review</span>
          </div>
          <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg">
            <span className="text-[10px] text-[#5C6B62] block font-medium">Parameter</span>
            <span className="font-bold text-[#1E2922] text-sm truncate block">{profile.affectedParameterName}</span>
            <span className="text-[10px] text-[#1E4D38] block mt-0.5 font-mono truncate">{profile.affectedParameterValue}</span>
          </div>
          <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg">
            <span className="text-[10px] text-[#5C6B62] block font-medium">Case Report Forms</span>
            <span className="font-bold text-[#1E2922] text-sm">{profile.crfCount} CRF {profile.crfCount > 1 ? 'Forms' : 'Form'}</span>
            <span className="text-[10px] text-amber-700 block mt-0.5 font-medium">Schema update</span>
          </div>
        </div>
      </section>

      {/* 3. SEVEN EXPANDABLE PROGRESSIVE DISCLOSURE SECTIONS */}
      <div className="space-y-4">
        {/* SECTION 1: AFFECTED SITES */}
        <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('sites')}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1E2922]">
                  Affected Research Sites ({profile.sites.length} of {profile.totalSites} Participating Centers)
                </h3>
                <p className="text-[11px] text-[#5C6B62] mt-0.5">
                  <strong>Why affected:</strong> {profile.whySitesAffected}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38] shrink-0">
              <span>{expandedSections.sites ? 'Hide sites' : 'View affected sites'}</span>
              {expandedSections.sites ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expandedSections.sites && (
            <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-2.5 text-xs animate-fade-in">
              {profile.sites.map((s) => (
                <div
                  key={s.siteId}
                  className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2]">
                        {s.siteId}
                      </span>
                      <span className="text-xs font-bold text-[#1E2922]">{s.name}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8B6B18] bg-[#FEF6E9] px-1.5 py-0.5 rounded border border-[#E8C28A]/50 font-mono">
                        {s.impactStatus}
                      </span>
                    </div>
                    <p className="text-[#5C6B62] text-[11px] flex items-center gap-1.5">
                      <span>{s.location}</span>
                      <span>•</span>
                      <span>PI: {s.investigator}</span>
                      <span>•</span>
                      <span className="font-semibold text-[#1E4D38]">{s.participantsCount} Patients</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-[#5C6B62] block">Staff Retraining</span>
                      <span
                        className={`text-[11px] font-semibold ${
                          s.trainingStatus === 'VERIFIED'
                            ? 'text-[#1E4D38]'
                            : s.trainingStatus === 'COMPLETED'
                            ? 'text-[#D97706]'
                            : 'text-[#5C6B62]'
                        }`}
                      >
                        {s.trainingStatus}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate('/sites')}
                      className="px-2.5 py-1 rounded-lg border border-[#E2DFD6] hover:bg-white text-[11px] font-semibold text-[#1E4D38] cursor-pointer"
                    >
                      Site Workflow →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: PARTICIPANTS */}
        <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('participants')}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1E2922]">
                  {profile.cohortCount} Enrolled Participants Affected
                </h3>
                <p className="text-[11px] text-[#5C6B62] mt-0.5">
                  <strong>Why affected:</strong> {profile.whyCohortAffected}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38] shrink-0">
              <span>{expandedSections.participants ? 'Hide cohort' : 'View participants'}</span>
              {expandedSections.participants ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expandedSections.participants && (
            <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-3 text-xs animate-fade-in">
              {profile.sites.map((s, sIdx) => {
                const pList = Array.from({ length: Math.min(s.participantsCount, 16) }, (_, i) => 
                  `P-${(sIdx * 25 + i + 1).toString().padStart(3, '0')}`
                );
                return (
                  <div key={s.siteId} className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B62]">
                        {s.name} ({s.participantsCount} Cohort Subjects)
                      </span>
                      <span className="text-[10px] font-mono text-[#1E4D38] font-bold">PI: {s.investigator}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pList.map((pid) => (
                        <span key={pid} className="px-2 py-0.5 bg-white border border-[#E2DFD6] rounded font-mono text-[11px] text-[#1E2922]">
                          {pid}
                        </span>
                      ))}
                      {s.participantsCount > 16 && (
                        <span className="px-2 py-0.5 bg-[#EAF4EF] border border-[#C5DFD2] rounded font-mono text-[10px] text-[#1E4D38] font-semibold">
                          +{s.participantsCount - 16} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: VISITS / PARAMETER */}
        <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('visits')}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1E2922]">
                  Target Parameter Specification Diff
                </h3>
                <p className="text-[11px] text-[#5C6B62] mt-0.5">
                  <strong>Why affected:</strong> {profile.whyParameterAffected}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38] shrink-0">
              <span>{expandedSections.visits ? 'Hide details' : 'View details'}</span>
              {expandedSections.visits ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expandedSections.visits && (
            <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-2 text-xs animate-fade-in">
              <div className="p-3.5 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-[#5C6B62] block font-medium">Target Specification</span>
                  <span className="font-bold text-[#1E2922]">{profile.targetEntityTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-700 block font-semibold">Current Protocol Baseline</span>
                  <span className="font-mono font-bold text-rose-700">{profile.currentValue}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#1E4D38] block font-semibold">Proposed Amendment</span>
                  <span className="font-mono font-bold text-[#1E4D38]">{profile.proposedValue}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: CRFS */}
        <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('crfs')}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1E2922]">
                  {profile.crfCount} Case Report Form (CRF) Schema Modified
                </h3>
                <p className="text-[11px] text-[#5C6B62] mt-0.5">
                  <strong>Why affected:</strong> {profile.whyCrfAffected}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38] shrink-0">
              <span>{expandedSections.crfs ? 'Hide CRF' : 'View CRF details'}</span>
              {expandedSections.crfs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expandedSections.crfs && (
            <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-2 text-xs animate-fade-in">
              <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-[#1E2922] block">{profile.crfName}</span>
                  <span className="text-[#5C6B62] text-[11px]">{profile.crfDetail}</span>
                </div>
                <span className="text-[10px] font-semibold text-[#1E4D38] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#C5DFD2] self-start sm:self-auto">
                  Schema v1.2 Update Required
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: CONSENT */}
        <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('consent')}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1E2922]">
                  Informed Consent Addendum Required
                </h3>
                <p className="text-[11px] text-[#5C6B62] mt-0.5">
                  <strong>Why affected:</strong> ICMR 2017 Section 5 & NDCT 2019 mandate updated subject information sheets for protocol modifications.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38] shrink-0">
              <span>{expandedSections.consent ? 'Hide consent' : 'View implications'}</span>
              {expandedSections.consent ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expandedSections.consent && (
            <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-2 text-xs animate-fade-in">
              <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-1">
                <span className="font-bold text-[#1E2922] block">{profile.consentTitle}</span>
                <p className="text-[#5C6B62] text-[11px] leading-relaxed">
                  {profile.consentDetail}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 6: TRAINING */}
        <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('training')}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1E2922]">
                  Multi-Site Investigator & CRC Training Required
                </h3>
                <p className="text-[11px] text-[#5C6B62] mt-0.5">
                  <strong>Why affected:</strong> Clinical Research Coordinators across investigational centers must be briefed on revised protocol tolerances.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38] shrink-0">
              <span>{expandedSections.training ? 'Hide training' : 'View requirements'}</span>
              {expandedSections.training ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expandedSections.training && (
            <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-2 text-xs animate-fade-in">
              <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-1">
                <span className="font-bold text-[#1E2922] block">{profile.trainingTitle}</span>
                <p className="text-[#5C6B62] text-[11px] leading-relaxed">
                  {profile.trainingDetail}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 7: ETHICS */}
        <div className="bg-white border border-[#E2DFD6] rounded-xl shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('ethics')}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF9F4]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#EAF4EF] text-[#1E4D38]">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1E2922]">
                  {profile.ethicsTitle}
                </h3>
                <p className="text-[11px] text-[#5C6B62] mt-0.5">
                  <strong>Why affected:</strong> NDCT Rules 2019 Rule 26 requires prior ethics notification and acknowledgment before operational rollout.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4D38] shrink-0">
              <span>{expandedSections.ethics ? 'Hide ethics' : 'View compliance details'}</span>
              {expandedSections.ethics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expandedSections.ethics && (
            <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DC] space-y-2 text-xs animate-fade-in">
              <div className="p-3 bg-[#FAF9F4] border border-[#E8E5DC] rounded-lg space-y-1">
                <span className="font-bold text-[#1E2922] block">Ethics Notification Dossier Submission</span>
                <p className="text-[#5C6B62] text-[11px] leading-relaxed">
                  {profile.ethicsDetail}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
