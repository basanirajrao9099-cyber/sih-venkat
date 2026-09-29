import { TrialSite } from '../types/trial';
import { SiteTrainingRecord } from '../types/trialOps';
import { MOCK_SITES } from '../data/mockSites';
import { apiFetch } from './api';

class SiteService {
  async getSites(changeSetId: string = 'CS-0001'): Promise<TrialSite[]> {
    return apiFetch<TrialSite[]>(`/api/v1/sites?changeSetId=${changeSetId}`, undefined, MOCK_SITES);
  }

  async getSiteById(id: string, changeSetId: string = 'CS-0001'): Promise<TrialSite | undefined> {
    const fallback = MOCK_SITES.find((s) => s.id === id || s.siteCode === id);
    return apiFetch<TrialSite | undefined>(`/api/v1/sites/${id}?changeSetId=${changeSetId}`, undefined, fallback);
  }

  async getSiteTrainingRecord(siteIdentifier: string, changeSetId: string = 'CS-0001'): Promise<SiteTrainingRecord> {
    return apiFetch<SiteTrainingRecord>(`/api/v1/sites/${siteIdentifier}/training?changeSetId=${changeSetId}`);
  }

  async completeSiteTraining(
    siteIdentifier: string,
    payload?: { changeSetId?: string; completedBy?: string; notes?: string }
  ): Promise<SiteTrainingRecord> {
    return apiFetch<SiteTrainingRecord>(`/api/v1/sites/${siteIdentifier}/training/complete`, {
      method: 'POST',
      body: JSON.stringify(payload || { changeSetId: 'CS-0001' }),
    });
  }

  async verifySiteTraining(
    siteIdentifier: string,
    payload?: { changeSetId?: string; verifiedBy?: string; verificationNote?: string }
  ): Promise<SiteTrainingRecord> {
    return apiFetch<SiteTrainingRecord>(`/api/v1/sites/${siteIdentifier}/training/verify`, {
      method: 'POST',
      body: JSON.stringify(payload || { changeSetId: 'CS-0001' }),
    });
  }

  async requestChangesSiteTraining(
    siteIdentifier: string,
    payload?: { changeSetId?: string; rejectionReason?: string; verifiedBy?: string }
  ): Promise<SiteTrainingRecord> {
    return apiFetch<SiteTrainingRecord>(`/api/v1/sites/${siteIdentifier}/training/request-changes`, {
      method: 'POST',
      body: JSON.stringify(payload || { changeSetId: 'CS-0001' }),
    });
  }
}

export const siteService = new SiteService();


