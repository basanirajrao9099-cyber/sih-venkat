import { Participant, RecruitmentMetrics } from '../types/participant';
import { MOCK_PARTICIPANTS, MOCK_RECRUITMENT_METRICS } from '../data/mockParticipants';
import { apiFetch, mockFetch } from './api';

class ParticipantService {
  private participants: Participant[] = [...MOCK_PARTICIPANTS];

  async getParticipants(trialId?: string): Promise<Participant[]> {
    const fallback = trialId
      ? this.participants.filter((p) => p.trialId === trialId)
      : this.participants;
    const url = trialId
      ? `/api/v1/participants?trialId=${encodeURIComponent(trialId)}`
      : '/api/v1/participants';
    return apiFetch<Participant[]>(url, undefined, fallback);
  }

  async getRecruitmentMetrics(): Promise<RecruitmentMetrics> {
    return apiFetch<RecruitmentMetrics>(
      '/api/v1/participants/recruitment-metrics',
      undefined,
      MOCK_RECRUITMENT_METRICS
    );
  }

  async addParticipant(newParticipant: Omit<Participant, 'id'>): Promise<Participant> {
    const created: Participant = {
      ...newParticipant,
      id: `pt-${Date.now()}`,
    };
    this.participants.unshift(created);
    return mockFetch(created, 300);
  }
}

export const participantService = new ParticipantService();

