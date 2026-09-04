import { ClinicalTrial } from '../types/trial';
import { MOCK_TRIALS } from '../data/mockTrials';
import { apiFetch, mockFetch } from './api';

export interface TrialStats {
  totalTrials: number;
  activeTrials: number;
  totalParticipantsEnrolled: number;
  totalParticipantsTarget: number;
  activeSites: number;
  totalSaeCount: number;
  overallRecruitmentRate: number;
}

class TrialService {
  async getTrials(): Promise<ClinicalTrial[]> {
    return apiFetch<ClinicalTrial[]>('/api/v1/trials', undefined, MOCK_TRIALS);
  }

  async getTrialById(id: string): Promise<ClinicalTrial | undefined> {
    const fallback = MOCK_TRIALS.find((t) => t.id === id || t.protocolId === id);
    return apiFetch<ClinicalTrial | undefined>(`/api/v1/trials/${id}`, undefined, fallback);
  }

  async getTrialStats(): Promise<TrialStats> {
    const totalTrials = MOCK_TRIALS.length;
    const activeTrials = MOCK_TRIALS.filter((t) => t.status === 'active' || t.status === 'recruiting').length;
    const totalParticipantsEnrolled = MOCK_TRIALS.reduce((acc, t) => acc + t.enrolledCount, 0);
    const totalParticipantsTarget = MOCK_TRIALS.reduce((acc, t) => acc + t.targetEnrollment, 0);
    const activeSites = MOCK_TRIALS.reduce((acc, t) => acc + t.activeSites, 0);
    const totalSaeCount = MOCK_TRIALS.reduce((acc, t) => acc + t.saeCount, 0);
    const overallRecruitmentRate = (totalParticipantsEnrolled / (totalParticipantsTarget || 1)) * 100;

    const fallback: TrialStats = {
      totalTrials,
      activeTrials,
      totalParticipantsEnrolled,
      totalParticipantsTarget,
      activeSites,
      totalSaeCount,
      overallRecruitmentRate,
    };

    return apiFetch<TrialStats>('/api/v1/trials/stats', undefined, fallback);
  }
}

export const trialService = new TrialService();
