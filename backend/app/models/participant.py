from sqlalchemy import Column, String, Integer, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Participant(Base):
    __tablename__ = "participants"

    id = Column(String(64), primary_key=True, index=True) # e.g. "pt-ops-001"
    participant_id = Column(String(64), unique=True, index=True, nullable=False) # e.g. "PT-001"
    subject_code = Column(String(64), index=True, nullable=True) # e.g. "SUBJ-101-004"
    trial_id = Column(String(64), ForeignKey("trials.trial_id"), nullable=False, index=True)
    site_id = Column(String(64), ForeignKey("sites.site_id"), nullable=False, index=True)
    site_code = Column(String(64), nullable=True)
    site_name = Column(String(255), nullable=True)
    site = Column(String(255), nullable=True) # "Hyderabad Clinical Centre (SITE-001)"
    enrollment_date = Column(String(32), default="2025-11-20")
    visit_status = Column(String(64), default="Visit 1 Complete")
    consent = Column(String(64), default="Signed (e-ICF v2.1)")
    safety = Column(String(64), default="No AE")
    protocol_version = Column(String(64), default="Protocol v1.0")
    cohort_arm = Column(String(128), default="Arm A (Investigational Formulation)")
    arm = Column(String(128), default="Arm A (Ayurveda + Standard Care)")
    age = Column(Integer, default=42)
    gender = Column(String(16), default="Female")
    prakriti = Column(String(64), default="Vata-Pitta")
    agni = Column(String(64), default="Samagni")
    dosha = Column(String(64), default="Vata-Pitta")
    status = Column(String(32), default="active")
    current_visit = Column(String(64), default="Week 8 (V4)")
    adherence_rate = Column(Float, default=96.5)
    adverse_events_count = Column(Integer, default=0)
    timeline = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trial = relationship("Trial", back_populates="participants")
    site_rel = relationship("Site", back_populates="site_participants")
