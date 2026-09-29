from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Trial(Base):
    __tablename__ = "trials"

    id = Column(String(64), primary_key=True, index=True) # e.g. "trial-001"
    trial_id = Column(String(64), unique=True, index=True, nullable=False) # e.g. "AYU-2026-0001"
    alias = Column(String(64), index=True, nullable=True) # e.g. "ATF-001" for Part A legacy compatibility
    protocol_id = Column(String(64), index=True, nullable=False) # e.g. "AYU-CT-2026-042"
    title = Column(String(512), nullable=False)
    short_title = Column(String(255), nullable=True)
    system = Column(String(64), default="Ayurveda")
    phase = Column(String(32), default="Phase III")
    status = Column(String(32), default="recruiting")
    formulation = Column(String(512), nullable=True)
    indication = Column(String(512), nullable=True)
    target_enrollment = Column(Integer, default=360)
    enrolled_count = Column(Integer, default=284)
    active_sites = Column(Integer, default=3)
    number_of_sites = Column(Integer, default=3)
    number_of_participants = Column(Integer, default=47)
    recruitment_percentage = Column(Float, default=72.0)
    protocol_version = Column(String(64), default="v1.0 (Active) / v1.1 (Proposed)")
    start_date = Column(String(32), default="2025-11-15")
    estimated_end_date = Column(String(32), default="2026-12-30")
    sponsor = Column(String(255), default="Central Council for Research in Ayurvedic Sciences (CCRAS)")
    ctri_number = Column(String(64), default="CTRI/2020/06/025557")
    scientific_title = Column(String(512), nullable=True)
    study_type = Column(String(128), default="Interventional")
    study_design = Column(String(255), default="Randomized, Parallel Group, Active Controlled")
    health_condition = Column(String(255), nullable=True)
    intervention = Column(String(512), nullable=True)
    comparator = Column(String(512), nullable=True)
    primary_sponsor = Column(String(255), nullable=True)
    secondary_sponsor = Column(String(255), nullable=True)
    recruitment_status = Column(String(64), default="Completed")
    first_enrollment_date = Column(String(32), nullable=True)
    study_duration = Column(String(64), nullable=True)
    target_sample_size = Column(Integer, nullable=True)
    final_enrollment = Column(Integer, nullable=True)
    country = Column(String(64), default="India")
    source_registry = Column(String(64), default="CTRI")
    source_url = Column(String(512), nullable=True)
    source_fetched_at = Column(String(64), nullable=True)
    source_hash = Column(String(128), nullable=True)
    source_mode = Column(String(32), default="FIXTURE", nullable=True) # "LIVE" | "FIXTURE"
    pi_name = Column(String(255), default="Prof. Dr. Anandita Sharma")
    lead_investigator = Column(String(255), default="Dr. V. Sharma, MD (Ayu), PhD")
    active_amendment = Column(String(64), default="CS-0001")
    budget_allocated = Column(Float, default=14500000.0)
    budget_utilized = Column(Float, default=8200000.0)
    sae_count = Column(Integer, default=1)
    description = Column(String(1024), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    sites = relationship("Site", back_populates="trial", cascade="all, delete-orphan")
    participants = relationship("Participant", back_populates="trial", cascade="all, delete-orphan")
    changesets = relationship("ChangeSet", back_populates="trial", cascade="all, delete-orphan")
    version_snapshots = relationship("TrialVersionSnapshot", back_populates="trial", cascade="all, delete-orphan")


class TrialVersionSnapshot(Base):
    """
    Append-only snapshot history of external CTRI registry records with deterministic hashes.
    """
    __tablename__ = "trial_version_snapshots"

    id = Column(String(64), primary_key=True, index=True)
    trial_id = Column(String(64), ForeignKey("trials.trial_id"), nullable=False, index=True)
    ctri_number = Column(String(64), index=True, nullable=False)
    version_number = Column(Integer, default=1, nullable=False)
    source_hash = Column(String(128), nullable=False)
    source_mode = Column(String(32), default="LIVE", nullable=False)
    source_url = Column(String(512), nullable=True)
    snapshot_payload = Column(JSON, nullable=False)
    changed_fields = Column(JSON, default=list)
    retrieved_at = Column(DateTime(timezone=True), server_default=func.now())

    trial = relationship("Trial", back_populates="version_snapshots")



class Site(Base):
    __tablename__ = "sites"

    id = Column(String(64), primary_key=True, index=True) # e.g. "site-01"
    trial_id = Column(String(64), ForeignKey("trials.trial_id"), nullable=False, index=True)
    site_id = Column(String(64), index=True, nullable=False) # e.g. "SITE-001"
    site_code = Column(String(64), index=True, nullable=False) # e.g. "SITE-01-AIIA"
    name = Column(String(255), nullable=False)
    site_name = Column(String(255), nullable=True)
    address = Column(String(512), nullable=True)
    city = Column(String(128), nullable=False)
    state = Column(String(128), nullable=False)
    country = Column(String(64), default="India")
    location = Column(String(255), nullable=True)
    pi_name = Column(String(255), nullable=False)
    investigator = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=False)
    ethics_committee = Column(String(255), nullable=True)
    ethics_approval_status = Column(String(64), default="Approved")
    recruitment_status = Column(String(64), default="Open")
    source_registry = Column(String(64), default="CTRI")
    source_url = Column(String(512), nullable=True)
    source_fetched_at = Column(String(64), nullable=True)
    status = Column(String(32), default="active")
    activation_status = Column(String(32), default="ACTIVE")
    governance_status = Column(String(32), default="READY")
    target_enrollment = Column(Integer, default=60)
    current_enrollment = Column(Integer, default=54)
    participants = Column(Integer, default=18)
    training_pct = Column(Float, default=92.0)
    documents_pct = Column(Float, default=100.0)
    iec_approval_date = Column(String(32), default="2025-10-12")
    last_monitor_visit = Column(String(32), default="2026-02-18")
    open_queries = Column(Integer, default=3)
    compliance_rate = Column(Float, default=98.2)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trial = relationship("Trial", back_populates="sites")
    site_participants = relationship("Participant", back_populates="site_rel", cascade="all, delete-orphan")


class SiteTrainingRecord(Base):
    __tablename__ = "site_training_records"

    id = Column(String(64), primary_key=True, index=True) # e.g. "TRN-SITE-01-CS-0001"
    change_set_id = Column(String(64), ForeignKey("changesets.id"), nullable=False, index=True)
    site_id = Column(String(64), ForeignKey("sites.id"), nullable=False, index=True)
    requirement_code = Column(String(64), nullable=False, default="REQ-TRN-01")
    requirement_name = Column(String(255), nullable=False, default="Protocol Amendment Site Staff Retraining")
    status = Column(String(32), nullable=False, default="REQUIRED") # 'REQUIRED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED'
    completed_at = Column(DateTime(timezone=True), nullable=True)
    completed_by = Column(String(255), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String(255), nullable=True)
    verification_note = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    site = relationship("Site", backref="training_records")

