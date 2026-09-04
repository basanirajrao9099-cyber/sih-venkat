import enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RuleDomain(str, enum.Enum):
    ETHICS = "Ethics"
    SAFETY = "Safety"
    REGULATORY = "Regulatory"
    DATA = "Data"
    OPERATIONS = "Operations"
    PARTICIPANT = "Participant"


class FindingLevel(str, enum.Enum):
    PASS = "PASS"
    WARNING = "WARNING"
    BLOCK = "BLOCK"


class RuleFinding(BaseModel):
    findingId: str = Field(..., description="Unique finding ID e.g. F-001")
    ruleCode: str = Field(..., description="Code of the triggering rule e.g. RULE-ETHICS-01")
    ruleTitle: str
    domain: RuleDomain
    level: FindingLevel
    title: str
    reason: str
    affectedEntity: str
    severity: str = Field("HIGH", description="HIGH | MEDIUM | LOW | CRITICAL")
    suggestedRemediation: str
    obligationId: Optional[str] = None
    isDemoFixture: bool = False
    source: str = "engine"


class RuleContext(BaseModel):
    changeSetId: str
    trialId: str
    type: str = "Protocol Amendment"
    previousState: str = "Day 25–31"
    newState: str = "Day 25–35"
    changeDescription: str
    affectedSitesCount: int = 3
    affectedParticipantsCount: int = 47
    
    # Evidence & Readiness flags
    hasIecEvidence: bool = False
    hasConsentAddendum: bool = False
    hasSiteTraining: bool = False
    hasEdcMapping: bool = True
    
    # Operational & Safety flags
    hasOpenSae: bool = False
    saeDaysPending: int = 0
    isSharedFormulation: bool = False
    sharedTrialIds: List[str] = []
    maxAllowableFlexDays: int = 5
    proposedFlexDays: int = 4
    unresolvedQueryRate: float = 4.2 # percent


class EvaluationReport(BaseModel):
    changeSetId: str
    trialId: str
    readinessStatus: str # 'READY' | 'BLOCKED'
    blockingCount: int
    warningCount: int
    passCount: int
    findings: List[RuleFinding] = []
    evaluatedRulesCount: int
