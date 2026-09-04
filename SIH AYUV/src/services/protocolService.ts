import { ProtocolEndpoint, ScheduleOfAssessment, ProtocolChangeset, ImpactAnalysis, CompilerCheck } from '../types/protocol';
import { MOCK_ENDPOINTS, MOCK_SCHEDULE_OF_ASSESSMENTS } from '../data/mockProtocol';
import { MOCK_CHANGESETS } from '../data/mockChangesets';
import { MOCK_IMPACT_METRICS } from '../data/mockImpact';
import { MOCK_COMPILER_CHECKS } from '../data/mockCompiler';
import { mockFetch } from './api';

class ProtocolService {
  async getEndpoints(): Promise<ProtocolEndpoint[]> {
    return mockFetch(MOCK_ENDPOINTS);
  }

  async getScheduleOfAssessments(): Promise<ScheduleOfAssessment[]> {
    return mockFetch(MOCK_SCHEDULE_OF_ASSESSMENTS);
  }

  async getChangesets(): Promise<ProtocolChangeset[]> {
    return mockFetch(MOCK_CHANGESETS);
  }

  async getImpactMetrics(): Promise<ImpactAnalysis[]> {
    return mockFetch(MOCK_IMPACT_METRICS);
  }

  async getCompilerChecks(): Promise<CompilerCheck[]> {
    return mockFetch(MOCK_COMPILER_CHECKS);
  }
}

export const protocolService = new ProtocolService();
