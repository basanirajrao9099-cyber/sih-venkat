import { AdverseEvent } from '../types/safety';
import { MOCK_SAFETY_EVENTS } from '../data/mockSafety';
import { mockFetch } from './api';

class SafetyService {
  private events: AdverseEvent[] = [...MOCK_SAFETY_EVENTS];

  async getSafetyEvents(): Promise<AdverseEvent[]> {
    return mockFetch(this.events);
  }

  async reportSafetyEvent(eventData: Omit<AdverseEvent, 'id' | 'caseId' | 'reportedDate'>): Promise<AdverseEvent> {
    const nextIndex = this.events.length + 1;
    const caseId = eventData.isSerious 
      ? `SAE-2026-${String(nextIndex).padStart(3, '0')}` 
      : `AE-2026-${String(nextIndex).padStart(3, '0')}`;

    const created: AdverseEvent = {
      ...eventData,
      id: `ae-${Date.now()}`,
      caseId,
      reportedDate: new Date().toISOString().split('T')[0],
    };

    this.events.unshift(created);
    return mockFetch(created, 350);
  }
}

export const safetyService = new SafetyService();
