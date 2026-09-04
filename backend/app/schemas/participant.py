from typing import List, Optional
from pydantic import BaseModel


class TimelineStepSchema(BaseModel):
    step: str
    status: str
    date: Optional[str] = None
    notes: Optional[str] = None


class ParticipantOpsItemSchema(BaseModel):
    id: str
    participantId: str
    subjectCode: Optional[str] = None
    trialId: str
    site: Optional[str] = None
    siteId: str
    siteCode: Optional[str] = None
    siteName: Optional[str] = None
    enrollmentDate: str
    visitStatus: str
    consent: str
    safety: str
    protocolVersion: str
    cohortArm: str
    arm: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    prakriti: Optional[str] = None
    status: str = "active"
    currentVisit: Optional[str] = None
    adherenceRate: Optional[float] = None
    adverseEventsCount: Optional[int] = 0
    timeline: List[TimelineStepSchema] = []

    class Config:
        from_attributes = True
