import enum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON, Integer, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ChangeSetState(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    IMPACT_ANALYZED = "IMPACT_ANALYZED"
    COMPLIANCE_CHECK = "COMPLIANCE_CHECK"
    EVIDENCE_PENDING = "EVIDENCE_PENDING"
    EVIDENCE_VERIFIED = "EVIDENCE_VERIFIED"
    IEC_REVIEW = "IEC_REVIEW"
    REGULATORY_REVIEW = "REGULATORY_REVIEW"
    APPROVED = "APPROVED"
    SCHEDULED_FOR_EXECUTION = "SCHEDULED_FOR_EXECUTION"
    EXECUTING = "EXECUTING"
    EXECUTED = "EXECUTED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    BLOCKED = "BLOCKED"
    ROLLED_BACK = "ROLLED_BACK"


class ApprovalDecision(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ExecutionPlanStatus(str, enum.Enum):
    PREPARED = "PREPARED"
    SCHEDULED = "SCHEDULED"
    EXECUTING = "EXECUTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PARTIAL_FAILURE = "PARTIAL_FAILURE"
    ROLLED_BACK = "ROLLED_BACK"


class RollbackStatus(str, enum.Enum):
    NOT_REQUIRED = "NOT_REQUIRED"
    READY = "READY"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ChangeSet(Base):
    __tablename__ = "changesets"

    id = Column(String(64), primary_key=True, index=True) # e.g. "CS-0001"
    trial_id = Column(String(64), ForeignKey("trials.trial_id"), nullable=False, index=True)
    trial_name = Column(String(255), nullable=True)
    protocol = Column(String(64), default="v1.1")
    type = Column(String(128), default="Protocol Amendment")
    title = Column(String(255), nullable=True)
    reason = Column(String(512), nullable=True)
    previous_state = Column(String(128), default="Day 25–31")
    new_state = Column(String(128), default="Day 25–35")
    change = Column(String(255), default="Visit 4 schedule: Day 25–31 → Day 25–35")
    affected_entities = Column(JSON, default=list)
    effective_date = Column(String(32), default="2026-03-15")
    status = Column(String(32), default="IN REVIEW") # Backward compatibility status field
    lifecycle_state = Column(String(32), default=ChangeSetState.SUBMITTED.value, nullable=True)
    created = Column(String(64), default="Today")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trial = relationship("Trial", back_populates="changesets")
    impact_nodes = relationship("ImpactNode", back_populates="changeset", cascade="all, delete-orphan")
    approvals = relationship("ApprovalRecord", back_populates="changeset", cascade="all, delete-orphan")
    execution_plans = relationship("ExecutionPlan", back_populates="changeset", cascade="all, delete-orphan")


class ImpactNode(Base):
    __tablename__ = "impact_nodes"

    id = Column(String(64), primary_key=True, index=True)
    changeset_id = Column(String(64), ForeignKey("changesets.id"), nullable=False, index=True)
    label = Column(String(128), nullable=False)
    entity = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False) # 'Root' | 'Sites' | 'Participants' | 'Protocol' | 'Systems' | 'Governance'
    severity = Column(String(32), nullable=False) # 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL'
    reason = Column(String(512), nullable=False)
    relationship_desc = Column(String(255), nullable=True)
    related_changeset = Column(String(64), default="CS-0001")
    parent_id = Column(String(64), nullable=True)
    has_children = Column(Boolean, default=False)
    meta_info = Column(JSON, default=dict)

    changeset = relationship("ChangeSet", back_populates="impact_nodes")


class CompilationRun(Base):
    __tablename__ = "compilation_runs"

    id = Column(String(64), primary_key=True, index=True) # e.g. "CMP-000128"
    run_id = Column(String(64), index=True, nullable=False)
    changeset_id = Column(String(64), ForeignKey("changesets.id"), nullable=False, index=True)
    trial_id = Column(String(64), nullable=False)
    protocol = Column(String(64), default="v1.1")
    status = Column(String(32), nullable=False) # 'FAILED' | 'PASSED' | 'RUNNING'
    readiness_status = Column(String(32), default="BLOCKED") # 'BLOCKED' | 'READY'
    blocking_count = Column(String(32), default="3")
    warnings_count = Column(String(32), default="1")
    evidence_count = Column(String(32), default="1 / 4")
    pipeline_steps = Column(JSON, default=list)
    audit_hash = Column(String(128), default="0x9F4C2A7B8E3D")
    is_demo_fixture = Column(Boolean, default=False)
    source = Column(String(64), default="compiler") # "seed" vs "compiler"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(64), primary_key=True, index=True) # e.g. "F-001"
    changeset_id = Column(String(64), ForeignKey("changesets.id"), nullable=False, index=True)
    type = Column(String(32), nullable=False) # 'BLOCK' | 'WARNING'
    title = Column(String(255), nullable=False)
    description = Column(String(512), nullable=False)
    severity = Column(String(32), nullable=False) # 'HIGH' | 'MEDIUM' | 'LOW'
    status = Column(String(32), default="OPEN") # 'OPEN' | 'RESOLVED'
    rule = Column(String(64), nullable=True) # "RULE-ETHICS-01"
    affected_entity = Column(String(128), nullable=True)
    obligation_id = Column(String(64), nullable=True) # "OBL-01"
    is_demo_fixture = Column(Boolean, default=False)
    source = Column(String(64), default="compiler") # "seed" vs "compiler"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Obligation(Base):
    __tablename__ = "obligations"

    id = Column(String(64), primary_key=True, index=True) # e.g. "OBL-01"
    changeset_id = Column(String(64), ForeignKey("changesets.id"), nullable=False, index=True)
    obligation = Column(String(255), nullable=False)
    owner = Column(String(128), nullable=False) # 'Regulatory' | 'Ethics' | 'Trial Operations' | 'Data Management'
    status = Column(String(32), default="OPEN") # 'OPEN' | 'COMPLETED' | 'IN PROGRESS'
    deadline = Column(String(32), nullable=True)
    severity = Column(String(32), nullable=True)
    finding_id = Column(String(64), nullable=True)
    is_demo_fixture = Column(Boolean, default=False)
    source = Column(String(64), default="compiler")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(String(64), primary_key=True, index=True) # e.g. "EVD-01"
    changeset_id = Column(String(64), ForeignKey("changesets.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    status = Column(String(32), default="MISSING") # 'MISSING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'AVAILABLE'
    button_text = Column(String(64), default="ADD EVIDENCE")
    file_hint = Column(String(512), nullable=True)
    file_url = Column(String(512), nullable=True)
    
    # Phase 4 Provenance & Metadata fields
    document_type = Column(String(128), nullable=True) # e.g. "Ethics Clearance Notice", "ICF Addendum"
    uploaded_by = Column(String(128), nullable=True) # e.g. "Dr. V. Sharma (Lead PI)"
    uploader_role = Column(String(64), nullable=True) # e.g. "Principal Investigator", "Coordinator"
    file_name = Column(String(255), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    checksum_sha256 = Column(String(64), nullable=True) # SHA-256 provenance hash
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Review & Verification fields
    verified_by = Column(String(128), nullable=True)
    reviewer_role = Column(String(64), nullable=True)
    verification_hash = Column(String(128), nullable=True)
    rejection_reason = Column(String(512), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    is_demo_fixture = Column(Boolean, default=False)
    source = Column(String(64), default="compiler")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ApprovalRecord(Base):
    """
    Formal human authorization decision on a ChangeSet workflow stage.
    """
    __tablename__ = "approval_records"

    id = Column(String(64), primary_key=True, index=True) # e.g. "APR-001"
    changeset_id = Column(String(64), ForeignKey("changesets.id"), nullable=False, index=True)
    actor_user_id = Column(String(64), ForeignKey("users.id"), nullable=True, index=True)
    actor_role = Column(String(64), nullable=False) # e.g. "Principal Investigator", "Ethics Committee Member"
    stage = Column(String(64), nullable=False) # e.g. "IEC_REVIEW", "REGULATORY_REVIEW", "FINAL_AUTHORIZATION"
    decision = Column(String(32), nullable=False, default=ApprovalDecision.APPROVED.value) # 'APPROVED' | 'REJECTED'
    reason = Column(String(1024), nullable=True)
    signature = Column(String(255), nullable=True) # Cryptographic signature or hash reference
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    changeset = relationship("ChangeSet", back_populates="approvals")


class ExecutionPlan(Base):
    """
    Prepared change package before external system synchronization can be triggered.
    """
    __tablename__ = "execution_plans"

    id = Column(String(64), primary_key=True, index=True) # e.g. "EXP-001"
    changeset_id = Column(String(64), ForeignKey("changesets.id"), nullable=False, index=True)
    idempotency_key = Column(String(128), unique=True, nullable=False, index=True)
    target_system = Column(String(64), nullable=False, default="REDCap EDC")
    status = Column(String(32), nullable=False, default=ExecutionPlanStatus.PREPARED.value)
    created_by = Column(String(64), nullable=False)
    before_state = Column(JSON, default=dict)
    after_state = Column(JSON, default=dict)
    execution_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    changeset = relationship("ChangeSet", back_populates="execution_plans")
    events = relationship("ExecutionEvent", back_populates="execution_plan", cascade="all, delete-orphan")
    rollback_plan = relationship("RollbackPlan", back_populates="execution_plan", uselist=False, cascade="all, delete-orphan")


class ExecutionEvent(Base):
    """
    Individual external system write/sync execution log entry.
    """
    __tablename__ = "execution_events"

    id = Column(String(64), primary_key=True, index=True) # e.g. "EXE-001"
    execution_plan_id = Column(String(64), ForeignKey("execution_plans.id"), nullable=False, index=True)
    event_type = Column(String(64), nullable=False) # e.g. "CONFIG_UPDATE", "VISIT_WINDOW_UPDATE", "CRF_SCHEMA_SYNC"
    status = Column(String(32), nullable=False) # 'SUCCESS' | 'FAILED' | 'SKIPPED'
    target_system = Column(String(64), nullable=False) # e.g. "REDCap EDC"
    external_record_id = Column(String(128), nullable=True)
    before_value = Column(JSON, nullable=True)
    after_value = Column(JSON, nullable=True)
    error_message = Column(String(1024), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    execution_plan = relationship("ExecutionPlan", back_populates="events")


class RollbackPlan(Base):
    """
    Compensating action plan if execution fails or requires manual revocation.
    """
    __tablename__ = "rollback_plans"

    id = Column(String(64), primary_key=True, index=True) # e.g. "RBP-001"
    execution_plan_id = Column(String(64), ForeignKey("execution_plans.id"), nullable=False, unique=True, index=True)
    status = Column(String(32), nullable=False, default=RollbackStatus.READY.value)
    compensating_action = Column(JSON, nullable=False, default=dict)
    created_by = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    execution_plan = relationship("ExecutionPlan", back_populates="rollback_plan")


class CompilationRunCounter(Base):
    """
    Dedicated table for atomic, concurrency-safe compilation run sequence generation.
    Avoids race conditions and gaps from application-level max/count queries.
    """
    __tablename__ = "compilation_run_counters"

    key = Column(String(64), primary_key=True) # e.g. "global_runs"
    current_val = Column(Integer, nullable=False, default=127)


