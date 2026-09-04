import { TrialOpsItem } from '../types/trialOps';

export const DEMO_TRIALS: TrialOpsItem[] = [
  {
    trialId: 'ATF-001',
    trialName: 'AYU-TRIAL FABRIC Demonstration Trial',
    phase: 'Phase III',
    status: 'ACTIVE',
    protocolVersion: 'v1.0 (Active) / v1.1 (Proposed)',
    numberOfSites: 3,
    numberOfParticipants: 47,
    recruitmentPercentage: 72,
    leadInvestigator: 'Dr. V. Sharma, MD (Ayu), PhD',
    activeAmendment: 'CS-0001',
    description:
      'A multicenter randomized controlled demonstration study evaluating standardized Ayurvedic formulation efficacy and dynamic visit flex windows across clinical centers.',
  },
  {
    trialId: 'ATF-002',
    trialName: 'Polyherbal Formulation Efficacy Study',
    phase: 'Phase IIb',
    status: 'ACTIVE',
    protocolVersion: 'v2.1',
    numberOfSites: 8,
    numberOfParticipants: 140,
    recruitmentPercentage: 58,
    leadInvestigator: 'Dr. A. Joshi, PhD',
    description:
      'Randomized, double-blind study assessing therapeutic equivalence of multi-constituent herbal extract vs placebo.',
  },
  {
    trialId: 'ATF-003',
    trialName: 'Rasayana Metabolic Adjuvant Trial',
    phase: 'Phase IV',
    status: 'RECRUITING',
    protocolVersion: 'v1.2',
    numberOfSites: 6,
    numberOfParticipants: 96,
    recruitmentPercentage: 80,
    leadInvestigator: 'Dr. K. Thatte, MD',
    description:
      'Post-marketing real-world evidence trial studying metabolic health markers and biomarker safety trajectories.',
  },
];
