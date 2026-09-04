from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class AuditTimelineEventSchema(BaseModel):
    id: str
    step: str
    title: str
    timestamp: str  # e.g. "Today, 10:14:02 IST"
    actor: str
    description: str
    status: str
    hash: Optional[str] = None  # Truncated or display hash e.g. "0x9F4C2A7B...8E3D"
    
    # Extended Phase 5 Provenance & Hash Chain attributes
    who: Optional[str] = None
    what: Optional[str] = None
    when: Optional[str] = None
    why: Optional[str] = None
    evidence: Optional[str] = None
    outcome: Optional[str] = None
    parentHash: Optional[str] = None
    fullHash: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class TamperDetail(BaseModel):
    recordId: str
    step: str
    action: str
    fieldCompromised: str
    expectedHash: str
    actualHash: str
    detail: str


class AuditVerificationResponse(BaseModel):
    changeSetId: str
    totalRecords: int
    chainValid: bool
    tamperDetected: bool
    genesisHash: Optional[str] = None
    headHash: Optional[str] = None
    verifiedAt: str
    tamperDetails: Optional[List[TamperDetail]] = None
    message: str
