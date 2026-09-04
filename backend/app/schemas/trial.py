from typing import List, Optional
from pydantic import BaseModel


class ClinicalTrialSchema(BaseModel):
    id: str
    trialId: str
    protocolId: str
    title: str
    shortTitle: Optional[str] = None
    system: str = "Ayurveda"
    phase: str = "Phase III"
    status: str = "recruiting"
    formulation: Optional[str] = None
    indication: Optional[str] = None
    targetEnrollment: int
    enrolledCount: int
    activeSites: int
    numberOfSites: Optional[int] = None
    numberOfParticipants: Optional[int] = None
    recruitmentPercentage: Optional[float] = None
    protocolVersion: Optional[str] = None
    startDate: Optional[str] = None
    estimatedEndDate: Optional[str] = None
    sponsor: Optional[str] = None
    ctriNumber: Optional[str] = None
    piName: Optional[str] = None
    leadInvestigator: Optional[str] = None
    activeAmendment: Optional[str] = None
    budgetAllocated: Optional[float] = None
    budgetUtilized: Optional[float] = None
    saeCount: Optional[int] = 0
    description: Optional[str] = None

    class Config:
        from_attributes = True


class TrialSiteSchema(BaseModel):
    id: str
    siteId: str
    siteCode: str
    name: str
    siteName: Optional[str] = None
    city: str
    state: str
    location: Optional[str] = None
    piName: str
    investigator: Optional[str] = None
    contactEmail: str
    status: str = "active"
    activationStatus: str = "ACTIVE"
    governanceStatus: str = "READY"
    targetEnrollment: int
    currentEnrollment: int
    participants: int
    trainingPct: float
    documentsPct: float
    iecApprovalDate: Optional[str] = None
    lastMonitorVisit: Optional[str] = None
    openQueries: int = 0
    complianceRate: float = 98.0

    class Config:
        from_attributes = True


class ProtocolEndpointSchema(BaseModel):
    id: str
    type: str
    description: str
    timeframe: str
    measurementTool: str

    class Config:
        from_attributes = True


class ScheduleOfAssessmentSchema(BaseModel):
    visitId: str
    visitName: str
    dayOffset: str
    windowDays: str
    activities: List[dict] = []

    class Config:
        from_attributes = True


class FullTrialDetailSchema(ClinicalTrialSchema):
    sites: List[TrialSiteSchema] = []
    endpoints: List[ProtocolEndpointSchema] = []
    scheduleOfAssessments: List[ScheduleOfAssessmentSchema] = []
