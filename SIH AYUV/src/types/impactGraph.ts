export type SeverityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
export type NodeCategory = 'Root' | 'Sites' | 'Participants' | 'Protocol' | 'Systems' | 'Governance';

export interface ImpactNode {
  id: string;
  label: string;
  entity: string; // e.g. "Visit 4"
  category: NodeCategory;
  severity: SeverityTier;
  reason: string; // e.g. "Visit schedule changed from Day 25–31 to Day 25–35."
  relationship: string; // e.g. "Direct Schedule Amendment"
  relatedChangeSet: string; // e.g. "CS-0001"
  parentId?: string;
  hasChildren?: boolean;
  meta?: {
    count?: number;
    code?: string;
    details?: string;
  };
}

export interface ImpactSummaryMetrics {
  sitesCount: number; // 3
  participantsCount: number; // 47
  visitsCount: number; // 1
  crfsCount: number; // 1
  edcMappingsCount: number; // 1
  ethicsAffected: boolean; // true
  trainingAffected: boolean; // true
  consentAffected: boolean; // true
}
