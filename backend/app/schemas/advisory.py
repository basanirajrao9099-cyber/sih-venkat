"""
Ayu-Trial Fabric: Safe Advisory AI Layer Schemas.
Enforces isAdvisory: True and statutory regulatory grounding metadata across all advisory endpoints.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


MANDATORY_ADVISORY_DISCLAIMER = (
    "AI-generated clinical governance advisory. This content is strictly informational, non-binding, "
    "and does not constitute regulatory certification or live state mutation. Human investigator review required."
)


class AdvisorySummaryRequest(BaseModel):
    changeSetId: str = Field(default="CS-0001", description="ChangeSet identifier to summarize")
    trialId: Optional[str] = Field(default="ATF-001", description="Clinical trial identifier")
    detailLevel: Optional[str] = Field(default="comprehensive", description="'concise' or 'comprehensive'")


class AdvisorySummaryResponse(BaseModel):
    changeSetId: str
    trialId: str
    summaryText: str
    impactHighlights: List[str]
    keyBlockers: List[str]
    recommendedAction: str
    isAdvisory: bool = Field(default=True, description="Hardcoded advisory marker")
    disclaimer: str = Field(default=MANDATORY_ADVISORY_DISCLAIMER)
    sourceGrounding: str = Field(default="VERIFIED_RULE_CATALOG")
    regulatoryBasis: str = Field(default="STATUTORY_BINDING")
    generatedAt: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class AdvisoryFindingExplanationRequest(BaseModel):
    findingId: str = Field(..., description="Finding identifier, e.g. 'F-001'")
    changeSetId: Optional[str] = Field(default="CS-0001")


class AdvisoryFindingExplanationResponse(BaseModel):
    findingId: str
    ruleCode: str
    ruleTitle: str
    severity: str
    plainEnglishExplanation: str
    clinicalSafetyContext: str
    statutoryCitation: str
    secondaryCitation: Optional[str] = None
    regulatoryBody: str
    bindingLevel: str
    actionableRemediation: str
    requiredEvidenceDocument: str
    isAdvisory: bool = Field(default=True, description="Hardcoded advisory marker")
    disclaimer: str = Field(default=MANDATORY_ADVISORY_DISCLAIMER)
    sourceGrounding: str = Field(default="VERIFIED_RULE_CATALOG")
    regulatoryBasis: str = Field(default="STATUTORY_BINDING")
    generatedAt: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class AdvisoryMappingSuggestionRequest(BaseModel):
    changeParameter: str = Field(..., description="e.g. 'visit_window', 'dosage_regimen', 'inclusion_criteria'")
    oldValue: Optional[str] = None
    newValue: Optional[str] = None
    trialId: Optional[str] = Field(default="ATF-001")


class AdvisoryMappingSuggestionResponse(BaseModel):
    changeParameter: str
    suggestedCrfForms: List[str]
    suggestedEdcVariables: List[str]
    suggestedRegulatoryCheckpoints: List[str]
    suggestedEvidenceTypes: List[str]
    rationale: str
    isAdvisory: bool = Field(default=True, description="Hardcoded advisory marker")
    disclaimer: str = Field(default=MANDATORY_ADVISORY_DISCLAIMER)
    sourceGrounding: str = Field(default="VERIFIED_RULE_CATALOG")
    regulatoryBasis: str = Field(default="RECOMMENDED_GUIDANCE")
    generatedAt: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
