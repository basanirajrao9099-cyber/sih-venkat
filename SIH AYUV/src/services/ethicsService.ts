import { EthicsSubmission } from '../types/protocol';
import { MOCK_ETHICS_SUBMISSIONS } from '../data/mockEthics';
import { mockFetch } from './api';

class EthicsService {
  async getEthicsSubmissions(): Promise<EthicsSubmission[]> {
    return mockFetch(MOCK_ETHICS_SUBMISSIONS);
  }
}

export const ethicsService = new EthicsService();
