import enum
from typing import List, Dict
from sqlalchemy import Column, String, Boolean, DateTime, Enum, JSON
from sqlalchemy.sql import func
from app.database import Base


class RoleName(str, enum.Enum):
    # Existing backward-compatible roles
    PI = "Principal Investigator"
    COORDINATOR = "Trial Coordinator"
    MONITOR = "Monitor"
    ETHICS_REVIEWER = "Ethics Reviewer"
    PV = "Pharmacovigilance"
    ADMIN = "Admin"
    REGULATOR = "Regulator"

    # Enterprise Production Roles
    SUPER_ADMIN = "Super Admin"
    SPONSOR = "Sponsor"
    PRINCIPAL_INVESTIGATOR = "Principal Investigator"
    SITE_INVESTIGATOR = "Site Investigator"
    CLINICAL_RESEARCH_COORDINATOR = "Clinical Research Coordinator"
    ETHICS_COMMITTEE_MEMBER = "Ethics Committee Member"
    REGULATORY_REVIEWER = "Regulatory Reviewer"
    DATA_MANAGER = "Data Manager"
    AUDITOR = "Auditor"
    AI_ADVISOR = "AI Advisor"


class Permission(str, enum.Enum):
    TRIAL_READ = "trial:read"
    TRIAL_WRITE = "trial:write"
    CHANGESET_CREATE = "changeset:create"
    CHANGESET_READ = "changeset:read"
    CHANGESET_SUBMIT = "changeset:submit"
    IMPACT_READ = "impact:read"
    COMPILER_RUN = "compiler:run"
    COMPILER_READ = "compiler:read"
    EVIDENCE_UPLOAD = "evidence:upload"
    EVIDENCE_VERIFY = "evidence:verify"
    ETHICS_REVIEW = "ethics:review"
    REGULATORY_REVIEW = "regulatory:review"
    APPROVAL_CREATE = "approval:create"
    APPROVAL_READ = "approval:read"
    EXECUTION_PREPARE = "execution:prepare"
    EXECUTION_EXECUTE = "execution:execute"
    ROLLBACK_EXECUTE = "rollback:execute"
    AUDIT_READ = "audit:read"
    AUDIT_VERIFY = "audit:verify"
    AI_ADVISORY_READ = "ai_advisory:read"


# Centralized Role-to-Permissions Matrix (AI_ADVISOR is strictly READ-ONLY)
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    RoleName.SUPER_ADMIN.value: [p.value for p in Permission],
    RoleName.ADMIN.value: [p.value for p in Permission if p != Permission.AI_ADVISORY_READ],
    RoleName.SPONSOR.value: [
        Permission.TRIAL_READ.value,
        Permission.CHANGESET_READ.value,
        Permission.IMPACT_READ.value,
        Permission.COMPILER_READ.value,
        Permission.APPROVAL_READ.value,
        Permission.AUDIT_READ.value,
    ],
    RoleName.PI.value: [
        Permission.TRIAL_READ.value,
        Permission.TRIAL_WRITE.value,
        Permission.CHANGESET_CREATE.value,
        Permission.CHANGESET_READ.value,
        Permission.CHANGESET_SUBMIT.value,
        Permission.IMPACT_READ.value,
        Permission.COMPILER_RUN.value,
        Permission.COMPILER_READ.value,
        Permission.EVIDENCE_UPLOAD.value,
        Permission.APPROVAL_CREATE.value,
        Permission.APPROVAL_READ.value,
        Permission.AUDIT_READ.value,
        Permission.AUDIT_VERIFY.value,
        Permission.AI_ADVISORY_READ.value,
    ],
    RoleName.SITE_INVESTIGATOR.value: [
        Permission.TRIAL_READ.value,
        Permission.CHANGESET_READ.value,
        Permission.IMPACT_READ.value,
        Permission.EVIDENCE_UPLOAD.value,
        Permission.APPROVAL_READ.value,
        Permission.AUDIT_READ.value,
    ],
    RoleName.COORDINATOR.value: [
        Permission.TRIAL_READ.value,
        Permission.CHANGESET_READ.value,
        Permission.IMPACT_READ.value,
        Permission.EVIDENCE_UPLOAD.value,
        Permission.COMPILER_READ.value,
        Permission.AUDIT_READ.value,
    ],
    RoleName.CLINICAL_RESEARCH_COORDINATOR.value: [
        Permission.TRIAL_READ.value,
        Permission.CHANGESET_READ.value,
        Permission.IMPACT_READ.value,
        Permission.EVIDENCE_UPLOAD.value,
        Permission.COMPILER_READ.value,
        Permission.AUDIT_READ.value,
    ],
    RoleName.ETHICS_REVIEWER.value: [
        Permission.TRIAL_READ.value,
        Permission.CHANGESET_READ.value,
        Permission.IMPACT_READ.value,
        Permission.COMPILER_READ.value,
        Permission.EVIDENCE_VERIFY.value,
        Permission.ETHICS_REVIEW.value,
        Permission.APPROVAL_CREATE.value,
        Permission.APPROVAL_READ.value,
        Permission.AUDIT_READ.value,
        Permission.AUDIT_VERIFY.value,
    ],
    RoleName.ETHICS_COMMITTEE_MEMBER.value: [
        Permission.TRIAL_READ.value,
        Permission.CHANGESET_READ.value,
        Permission.IMPACT_READ.value,
        Permission.COMPILER_READ.value,
        Permission.EVIDENCE_VERIFY.value,
        Permission.ETHICS_REVIEW.value,
        Permission.APPROVAL_CREATE.value,
        Permission.APPROVAL_READ.value,
        Permission.AUDIT_READ.value,
        Permission.AUDIT_VERIFY.value,
    ],
    RoleName.MONITOR.value: [
        Permission.TRIAL_READ.value,
        Permission.CHANGESET_READ.value,
        Permission.IMPACT_READ.value,
        Permission.COMPILER_READ.value,
        Permission.EVIDENCE_VERIFY.value,
        Permission.AUDIT_READ.value,
        Permission.AUDIT_VERIFY.value,
    ],
    RoleName.REGULATOR.value: [
        Permission.TRIAL_READ.value,
        Permission.CHANGESET_READ.value,
        Permission.IMPACT_READ.value,
        Permission.COMPILER_READ.value,
        Permission.REGULATORY_REVIEW.value,
        Permission.APPROVAL_CREATE.value,
        Permission.APPROVAL_READ.value,
        Permission.AUDIT_READ.value,
        Permission.AUDIT_VERIFY.value,
    ],
    RoleName.REGULATORY_REVIEWER.value: [
        Permission.TRIAL_READ.value,
        Permission.CHANGESET_READ.value,
        Permission.IMPACT_READ.value,
        Permission.COMPILER_READ.value,
        Permission.REGULATORY_REVIEW.value,
        Permission.APPROVAL_CREATE.value,
        Permission.APPROVAL_READ.value,
        Permission.AUDIT_READ.value,
        Permission.AUDIT_VERIFY.value,
    ],
    RoleName.DATA_MANAGER.value: [
        Permission.TRIAL_READ.value,
        Permission.CHANGESET_READ.value,
        Permission.IMPACT_READ.value,
        Permission.COMPILER_READ.value,
        Permission.EXECUTION_PREPARE.value,
        Permission.AUDIT_READ.value,
    ],
    RoleName.AUDITOR.value: [
        Permission.TRIAL_READ.value,
        Permission.CHANGESET_READ.value,
        Permission.IMPACT_READ.value,
        Permission.COMPILER_READ.value,
        Permission.AUDIT_READ.value,
        Permission.AUDIT_VERIFY.value,
    ],
    # AI_ADVISOR is STRICTLY READ-ONLY: ZERO write, approval, or execution permissions
    RoleName.AI_ADVISOR.value: [
        Permission.TRIAL_READ.value,
        Permission.CHANGESET_READ.value,
        Permission.IMPACT_READ.value,
        Permission.COMPILER_READ.value,
        Permission.AUDIT_READ.value,
        Permission.AI_ADVISORY_READ.value,
    ],
}


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleName), nullable=False)
    institution = Column(String(255), nullable=True)
    avatar = Column(String(512), nullable=True)
    permissions = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

