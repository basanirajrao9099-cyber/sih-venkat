import { TrialSite } from '../types/trial';
import { MOCK_SITES } from '../data/mockSites';
import { apiFetch, mockFetch } from './api';

class SiteService {
  async getSites(): Promise<TrialSite[]> {
    return apiFetch<TrialSite[]>('/api/v1/sites', undefined, MOCK_SITES);
  }

  async getSiteById(id: string): Promise<TrialSite | undefined> {
    const fallback = MOCK_SITES.find((s) => s.id === id || s.siteCode === id);
    return apiFetch<TrialSite | undefined>(`/api/v1/sites/${id}`, undefined, fallback);
  }
}

export const siteService = new SiteService();

