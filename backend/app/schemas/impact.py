from typing import List, Optional, Dict, Any
from pydantic import BaseModel, model_validator


class ImpactSummaryMetricsSchema(BaseModel):
    sitesCount: int
    participantsCount: int
    visitsCount: int
    crfsCount: int
    edcMappingsCount: int
    ethicsAffected: bool
    trainingAffected: bool
    consentAffected: bool
    crfCount: Optional[int] = None
    edcCount: Optional[int] = None

    @model_validator(mode="after")
    def populate_aliases(self):
        if self.crfCount is None:
            self.crfCount = self.crfsCount
        if self.edcCount is None:
            self.edcCount = self.edcMappingsCount
        return self


class ImpactNodeSchema(BaseModel):
    id: str
    label: str
    entity: str
    category: str # 'Root' | 'Sites' | 'Participants' | 'Protocol' | 'Systems' | 'Governance'
    severity: str # 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL'
    reason: str
    relationship: Optional[str] = None
    relatedChangeSet: str
    parentId: Optional[str] = None
    hasChildren: Optional[bool] = False
    meta: Optional[Dict[str, Any]] = None


class ImpactReportSchema(BaseModel):
    changeSetId: str
    trialId: str
    summary: ImpactSummaryMetricsSchema
    nodes: List[ImpactNodeSchema] = []
