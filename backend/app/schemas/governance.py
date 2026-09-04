from typing import List, Optional
from pydantic import BaseModel


class ChangeSetRecordSchema(BaseModel):
    id: str
    trialId: str
    trialName: Optional[str] = None
    protocol: Optional[str] = "v1.1"
    type: str
    previousState: str
    newState: str
    change: str
    affectedEntities: List[str] = []
    effectiveDate: str
    status: str
    created: Optional[str] = "Today"

    class Config:
        from_attributes = True


class FindingSchema(BaseModel):
    id: str
    type: str # 'BLOCK' | 'WARNING'
    title: str
    description: str
    severity: str # 'HIGH' | 'MEDIUM' | 'LOW'
    status: str # 'OPEN' | 'RESOLVED'
    rule: Optional[str] = None
    affectedEntity: Optional[str] = None
    obligationId: Optional[str] = None
    isDemoFixture: Optional[bool] = False
    source: Optional[str] = "compiler"

    class Config:
        from_attributes = True


class ObligationSchema(BaseModel):
    id: str
    obligation: str
    owner: str
    status: str # 'OPEN' | 'COMPLETED' | 'IN PROGRESS'
    deadline: Optional[str] = None
    severity: Optional[str] = None
    findingId: Optional[str] = None
    isDemoFixture: Optional[bool] = False
    source: Optional[str] = "compiler"

    class Config:
        from_attributes = True


class EvidenceItemSchema(BaseModel):
    id: str
    title: str
    status: str # 'MISSING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'AVAILABLE'
    buttonText: str
    fileHint: Optional[str] = None
    fileUrl: Optional[str] = None
    documentType: Optional[str] = None
    uploadedBy: Optional[str] = None
    uploaderRole: Optional[str] = None
    fileName: Optional[str] = None
    fileSizeBytes: Optional[int] = None
    checksumSha256: Optional[str] = None
    submittedAt: Optional[str] = None
    verifiedBy: Optional[str] = None
    reviewerRole: Optional[str] = None
    verificationHash: Optional[str] = None
    rejectionReason: Optional[str] = None
    verifiedAt: Optional[str] = None
    isDemoFixture: Optional[bool] = False
    source: Optional[str] = "compiler"

    class Config:
        from_attributes = True


class EvidenceSubmissionRequest(BaseModel):
    evidenceId: str
    changeSetId: Optional[str] = "CS-0001"
    title: Optional[str] = None
    documentType: Optional[str] = "Ethics Clearance Notice"
    uploadedBy: Optional[str] = "Dr. V. Sharma (Lead PI)"
    uploaderRole: Optional[str] = "Principal Investigator"
    fileName: Optional[str] = "dossier_signed.pdf"
    fileSizeBytes: Optional[int] = 1048576
    checksumSha256: Optional[str] = "0x7F9B2C1A8E3D"
    fileHint: Optional[str] = None
    findingId: Optional[str] = None
    obligationId: Optional[str] = None


class EvidenceVerificationRequest(BaseModel):
    decision: str = "ACCEPT" # 'ACCEPT' | 'REJECT'
    verifiedBy: Optional[str] = "Central Ethics Committee Chair"
    reviewerRole: Optional[str] = "Ethics Reviewer"
    comments: Optional[str] = None
    rejectionReason: Optional[str] = None


class ReadinessSummarySchema(BaseModel):
    protocol: str
    changeSet: str
    sites: int
    participants: int
    blockingFindings: int
    warnings: int
    evidence: str
    status: str # 'BLOCKED' | 'READY'


class CompilationStepSchema(BaseModel):
    name: str # 'CHANGESET' | 'IMPACT' | 'COMPILE' | ...
    status: str # 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED'


class CompilationRunRequest(BaseModel):
    changeSetId: str
    trialId: str
    triggeredBy: Optional[str] = None
    pipeline: Optional[str] = "FULL_VALIDATION"


class CompilationRunDataSchema(BaseModel):
    runId: str
    changeSetId: str
    trialId: str
    protocol: str
    timestamp: str
    status: str
    readiness: ReadinessSummarySchema
    pipelineSteps: List[CompilationStepSchema] = []
    auditHash: str
    isDemoFixture: Optional[bool] = False
    source: Optional[str] = "compiler"


class CompilationRunSummarySchema(BaseModel):
    runId: str
    changeSetId: str
    trialId: str
    protocol: str
    status: str
    readinessStatus: str
    blockingCount: int
    warningsCount: int
    evidenceCount: str
    timestamp: str
    auditHash: str

    class Config:
        from_attributes = True

