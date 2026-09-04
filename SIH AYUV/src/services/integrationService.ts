import { IntegrationConnector } from '../types/protocol';
import { MOCK_INTEGRATIONS } from '../data/mockIntegrations';
import { mockFetch } from './api';

class IntegrationService {
  private connectors: IntegrationConnector[] = [...MOCK_INTEGRATIONS];

  async getIntegrations(): Promise<IntegrationConnector[]> {
    return mockFetch(this.connectors);
  }

  async triggerSync(id: string): Promise<IntegrationConnector | undefined> {
    const item = this.connectors.find((c) => c.id === id);
    if (item) {
      item.connectionStatus = 'syncing';
      await new Promise((r) => setTimeout(r, 600));
      item.connectionStatus = 'connected';
      item.lastSyncTime = 'Just now';
      item.recordsSyncedToday += Math.floor(Math.random() * 20) + 5;
    }
    return mockFetch(item);
  }
}

export const integrationService = new IntegrationService();
