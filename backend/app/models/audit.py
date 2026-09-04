from sqlalchemy import Column, String, DateTime, Integer, Text
from sqlalchemy.sql import func
from app.database import Base


class AuditTrailRecord(Base):
    __tablename__ = "audit_trail"

    id = Column(String(64), primary_key=True, index=True)  # e.g. "EVT-001"
    changeset_id = Column(String(64), index=True, nullable=False)  # e.g. "CS-0001"
    step = Column(String(64), nullable=False)  # "STEP 1"
    title = Column(String(255), nullable=False)
    timestamp_display = Column(String(64), nullable=False)  # "Today, 10:14:02 IST"
    actor = Column(String(255), nullable=False)  # e.g. "Dr. V. Sharma (Lead PI)"
    description = Column(String(1024), nullable=False)
    status = Column(String(32), nullable=False)  # 'PASSED' | 'FAILED' | 'READY' | 'SUBMITTED' | 'WARNING' | 'ADVISORY'
    
    # Phase 5 Provenance & Hash Chain extensions
    who = Column(String(255), nullable=True)  # Actor ID & role: e.g. "Dr. V. Sharma (Lead PI)"
    what = Column(String(64), nullable=True)  # Action code: e.g. "CHANGESET_CREATED", "COMPILATION_FAILED", "AI_ADVISORY_QUERY"
    when_timestamp = Column(String(64), nullable=True)  # ISO 8601 UTC timestamp: e.g. "2026-03-04T10:14:02Z"
    why = Column(Text, nullable=True)  # Standardized clinical/regulatory justification
    evidence_ref = Column(String(255), nullable=True)  # Linked evidence reference: e.g. "EVD-01", "checksum:..."
    outcome = Column(String(64), nullable=True)  # e.g. "SUBMITTED", "PASSED", "FAILED", "VERIFIED", "REJECTED", "READY", "BLOCKED", "ADVISORY_GENERATED"
    
    parent_hash = Column(String(128), nullable=True)  # Full 64-char SHA-256 hash of predecessor link
    hash = Column(String(128), nullable=True)  # Full 64-char hex SHA-256 hash
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditChainState(Base):
    """
    Dedicated concurrency and sequence lock table for cryptographic hash chains.
    Ensures that parallel actions for a changeset acquire a row lock before
    reading the parent hash and appending a new audit record.
    """
    __tablename__ = "audit_chain_states"

    changeset_id = Column(String(64), primary_key=True, index=True)
    last_hash = Column(String(128), nullable=False)
    sequence = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
