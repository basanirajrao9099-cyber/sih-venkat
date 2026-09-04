from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ChangeSet(Base):
    __tablename__ = "changesets"

    id = Column(String(64), primary_key=True, index=True) # e.g. "CS-0001"
    trial_id = Column(String(64), ForeignKey("trials.trial_id"), nullable=False, index=True)
    trial_name = Column(String(255), nullable=True)
    protocol = Column(String(64), default="v1.1")
    type = Column(String(128), default="Protocol Amendment")
    previous_state = Column(String(128), default="Day 25–31")
    new_state = Column(String(128), default="Day 25–35")
    change = Column(String(255), default="Visit 4 schedule: Day 25–31 → Day 25–35")
    affected_entities = Column(JSON, default=list)
    effective_date = Column(String(32), default="2026-03-15")
    status = Column(String(32), default="IN REVIEW")
    created = Column(String(64), default="Today")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trial = relationship("Trial", back_populates="changesets")
    impact_nodes = relationship("ImpactNode", back_populates="changeset", cascade="all, delete-orphan")


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


class CompilationRunCounter(Base):
    """
    Dedicated table for atomic, concurrency-safe compilation run sequence generation.
    Avoids race conditions and gaps from application-level max/count queries.
    """
    __tablename__ = "compilation_run_counters"

    key = Column(String(64), primary_key=True) # e.g. "global_runs"
    current_val = Column(Integer, nullable=False, default=127)

