import { RegulatoryFiling } from '../types/protocol';
import { MOCK_REGULATORY_FILINGS } from '../data/mockRegulatory';
import { mockFetch } from './api';

class RegulatoryService {
  async getRegulatoryFilings(): Promise<RegulatoryFiling[]> {
    return mockFetch(MOCK_REGULATORY_FILINGS);
  }
}

export const regulatoryService = new RegulatoryService();
