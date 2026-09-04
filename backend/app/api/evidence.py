from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.governance import EvidenceItem, Finding, Obligation
from app.schemas.governance import EvidenceItemSchema

router = APIRouter(prefix="/api/v1/evidence", tags=["Evidence"])


class EvidenceUploadPayload(BaseModel):
    evidenceId: str
    changeSetId: str = "CS-0001"
    fileName: str = "dossier_signed.pdf"
    actor: str = "Clinical Operations & QA"


@router.post("/upload", response_model=EvidenceItemSchema)
def upload_or_verify_evidence(payload: EvidenceUploadPayload, db: Session = Depends(get_db)):
    """
    Upload or verify an evidence artifact.
    Marks the evidence as VERIFIED, and resolves the linked obligation and blocking finding.
    """
    evidence = db.query(EvidenceItem).filter(
        EvidenceItem.id == payload.evidenceId,
        EvidenceItem.changeset_id == payload.changeSetId,
    ).first()

    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence '{payload.evidenceId}' not found for ChangeSet '{payload.changeSetId}'",
        )

    evidence.status = "VERIFIED"
    evidence.button_text = "VERIFIED"
    evidence.verified_by = payload.actor
    evidence.verification_hash = "0x8F9C2B4E"
    evidence.file_url = f"/evidence/{payload.evidenceId.lower()}_{payload.fileName}"

    # Auto-resolve linked obligation and finding
    mapping = {
        "EVD-01": ("OBL-01", "F-001"),
        "EVD-02": ("OBL-02", "F-002"),
        "EVD-03": ("OBL-03", "F-003"),
        "EVD-04": ("OBL-04", "F-004"),
    }

    if payload.evidenceId in mapping:
        obl_id, f_id = mapping[payload.evidenceId]
        obl = db.query(Obligation).filter(Obligation.id == obl_id).first()
        if obl:
            obl.status = "COMPLETED"
        f = db.query(Finding).filter(Finding.id == f_id).first()
        if f and f.type == "BLOCK":
            f.status = "RESOLVED"

    db.commit()
    db.refresh(evidence)

    return EvidenceItemSchema(
        id=evidence.id,
        title=evidence.title,
        status=evidence.status,
        buttonText=evidence.button_text,
        fileHint=evidence.file_hint,
        fileUrl=evidence.file_url,
        verifiedBy=evidence.verified_by,
        verificationHash=evidence.verification_hash,
        isDemoFixture=evidence.is_demo_fixture,
        source=evidence.source,
    )
