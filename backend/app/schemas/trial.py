from typing import List, Optional
from pydantic import BaseModel


class ClinicalTrialSchema(BaseModel):
    id: str
    trialId: str
    protocolId: str
    title: str
    shortTitle: Optional[str] = None
    scientificTitle: Optional[str] = None
    system: str = "Ayurveda"
    phase: str = "Phase III"
    status: str = "recruiting"
    studyType: Optional[str] = "Interventional"
    studyDesign: Optional[str] = None
    healthCondition: Optional[str] = None
    intervention: Optional[str] = None
    comparator: Optional[str] = None
    primarySponsor: Optional[str] = None
    secondarySponsor: Optional[str] = None
    recruitmentStatus: Optional[str] = None
    firstEnrollmentDate: Optional[str] = None
    studyDuration: Optional[str] = None
    targetSampleSize: Optional[int] = None
    finalEnrollment: Optional[int] = None
    country: Optional[str] = "India"
    sourceRegistry: Optional[str] = "CTRI"
    sourceUrl: Optional[str] = None
    sourceFetchedAt: Optional[str] = None
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
    address: Optional[str] = None
    city: str
    state: str
    country: Optional[str] = "India"
    location: Optional[str] = None
    piName: str
    investigator: Optional[str] = None
    contactEmail: str
    ethicsCommittee: Optional[str] = None
    ethicsApprovalStatus: Optional[str] = None
    recruitmentStatus: Optional[str] = None
    associatedTrialTitle: Optional[str] = None
    trialCtriNumber: Optional[str] = None
    sourceRegistry: Optional[str] = "CTRI"
    sourceUrl: Optional[str] = None
    sourceFetchedAt: Optional[str] = None
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
    trainingStatus: Optional[str] = "REQUIRED"
    activeAmendment: Optional[str] = "CS-0001"
    impactStatus: Optional[str] = "AFFECTED"
    amendmentImpact: Optional[str] = "Affected"
    trainingRequirement: Optional[str] = "REQ-TRN-01: Site Staff Protocol Retraining"
    trainingCompletedAt: Optional[str] = None
    trainingCompletedBy: Optional[str] = None
    trainingVerifiedAt: Optional[str] = None
    trainingVerifiedBy: Optional[str] = None
    trainingVerificationNote: Optional[str] = None
    evidenceStatus: Optional[str] = "REQUIRED"
    verificationStatus: Optional[str] = "PENDING"
    rejectionReason: Optional[str] = None

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


class SiteTrainingRecordSchema(BaseModel):
    id: str
    changeSetId: str
    siteId: str
    requirementCode: str
    requirementName: str
    status: str
    evidenceStatus: Optional[str] = None
    verificationStatus: Optional[str] = None
    rejectionReason: Optional[str] = None
    completedAt: Optional[str] = None
    completedBy: Optional[str] = None
    verifiedAt: Optional[str] = None
    verifiedBy: Optional[str] = None
    verificationNote: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True


class SiteTrainingCompleteRequest(BaseModel):
    changeSetId: Optional[str] = "CS-0001"
    completedBy: Optional[str] = None
    notes: Optional[str] = None


class SiteTrainingVerifyRequest(BaseModel):
    changeSetId: Optional[str] = "CS-0001"
    verifiedBy: Optional[str] = None
    verificationNote: Optional[str] = None


class SiteTrainingRejectRequest(BaseModel):
    changeSetId: Optional[str] = "CS-0001"
    rejectionReason: Optional[str] = "Training logs require revision"
    verifiedBy: Optional[str] = None

