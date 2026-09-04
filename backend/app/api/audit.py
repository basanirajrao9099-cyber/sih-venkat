from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import AuditTrailRecord
from app.schemas.audit import AuditTimelineEventSchema, AuditVerificationResponse
from app.services.audit_service import verify_audit_chain

router = APIRouter(prefix="/api/v1/audit", tags=["Audit Trail"])


@router.get("/trail", response_model=List[AuditTimelineEventSchema])
def get_audit_trail(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """
    Retrieve chronological immutable audit trail records for a ChangeSet.
    Includes full provenance: who, what, when, why, evidence, outcome, and cryptographic parent/hash links.
    """
    records = (
        db.query(AuditTrailRecord)
        .filter(AuditTrailRecord.changeset_id == changeSetId)
        .order_by(AuditTrailRecord.created_at.asc(), AuditTrailRecord.id.asc())
        .all()
    )
    
    response = []
    for r in records:
        full_h = r.hash or ""
        display_h = f"{full_h[:12]}...{full_h[-4:]}" if len(full_h) > 20 else full_h
        
        response.append(
            AuditTimelineEventSchema(
                id=r.id,
                step=r.step,
                title=r.title,
                timestamp=r.timestamp_display,
                actor=r.actor,
                description=r.description,
                status=r.status,
                hash=display_h,
                who=r.who or r.actor,
                what=r.what,
                when=r.when_timestamp,
                why=r.why or r.description,
                evidence=r.evidence_ref,
                outcome=r.outcome or r.status,
                parentHash=r.parent_hash,
                fullHash=full_h,
            )
        )
    return response


@router.get("/verify", response_model=AuditVerificationResponse)
def verify_audit_trail(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """
    Cryptographically verify the Merkle hash chain for a ChangeSet.
    Walks from genesis to head, recalculates SHA-256 for each block, and detects
    any manual database tampering or broken links.
    """
    return verify_audit_chain(db, changeset_id=changeSetId)
