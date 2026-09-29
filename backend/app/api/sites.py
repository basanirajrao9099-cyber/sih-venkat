from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.trial import Site, SiteTrainingRecord
from app.models.user import RoleName
from app.auth.dependencies import require_governance_role
from app.services.audit_service import record_audit_event
from app.schemas.trial import (
    TrialSiteSchema,
    SiteTrainingRecordSchema,
    SiteTrainingCompleteRequest,
    SiteTrainingVerifyRequest,
    SiteTrainingRejectRequest,
)
from app.api.trials import map_site_to_schema

router = APIRouter(prefix="/api/v1/sites", tags=["Sites"])


def get_site_or_404(identifier: str, db: Session) -> Site:
    """Helper to resolve a Site by site_id, site_code, or internal id."""
    site = db.query(Site).filter(
        or_(
            Site.site_id == identifier,
            Site.site_code == identifier,
            Site.id == identifier,
        )
    ).first()

    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trial Site '{identifier}' not found",
        )
    return site


def map_training_record_to_schema(r: SiteTrainingRecord) -> SiteTrainingRecordSchema:
    if r.status == "VERIFIED":
        evd_status = "VERIFIED"
        ver_status = "VERIFIED"
        rej_reason = None
    elif r.status == "COMPLETED":
        evd_status = "AWAITING_REVIEW"
        ver_status = "PENDING"
        rej_reason = None
    elif r.status in ["CHANGES_REQUESTED", "REJECTED"]:
        evd_status = "CHANGES_REQUESTED"
        ver_status = "CHANGES_REQUESTED"
        rej_reason = r.verification_note or "Training log requires revision."
    elif r.status == "NOT_REQUIRED":
        evd_status = "NOT_REQUIRED"
        ver_status = "NOT_REQUIRED"
        rej_reason = None
    else:
        evd_status = "REQUIRED"
        ver_status = "PENDING"
        rej_reason = None

    return SiteTrainingRecordSchema(
        id=r.id,
        changeSetId=r.change_set_id,
        siteId=r.site_id,
        requirementCode=r.requirement_code,
        requirementName=r.requirement_name,
        status=r.status,
        evidenceStatus=evd_status,
        verificationStatus=ver_status,
        rejectionReason=rej_reason,
        completedAt=r.completed_at.isoformat() if r.completed_at else None,
        completedBy=r.completed_by,
        verifiedAt=r.verified_at.isoformat() if r.verified_at else None,
        verifiedBy=r.verified_by,
        verificationNote=r.verification_note,
        createdAt=r.created_at.isoformat() if r.created_at else None,
        updatedAt=r.updated_at.isoformat() if r.updated_at else None,
    )


@router.get("", response_model=List[TrialSiteSchema])
def list_all_sites(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """List all clinical study sites across trials with active governance training state."""
    sites = db.query(Site).all()
    cs_id = changeSetId or "CS-0001"
    return [map_site_to_schema(s, db=db, change_set_id=cs_id) for s in sites]


@router.get("/{identifier}", response_model=TrialSiteSchema)
def get_site_by_id(
    identifier: str,
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """Get site details by siteId, siteCode, or id."""
    site = get_site_or_404(identifier, db)
    cs_id = changeSetId or "CS-0001"
    return map_site_to_schema(site, db=db, change_set_id=cs_id)


@router.get("/{site_identifier}/training", response_model=SiteTrainingRecordSchema)
def get_site_training_record(
    site_identifier: str,
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """
    Retrieve the training record for a site under a specific amendment.
    If the site is affected and no record exists yet, creates and returns an initial REQUIRED record.
    If the site is not affected, returns status NOT_REQUIRED.
    """
    site = get_site_or_404(site_identifier, db)
    cs_id = changeSetId or "CS-0001"

    from app.services.training_service import is_site_impacted_by_changeset
    is_affected = is_site_impacted_by_changeset(site, cs_id, db)
    if not is_affected:
        return SiteTrainingRecordSchema(
            id=f"TRN-{site.id.upper()}-{cs_id}",
            changeSetId=cs_id,
            siteId=site.id,
            requirementCode="REQ-TRN-NONE",
            requirementName=f"Not required for amendment {cs_id}",
            status="NOT_REQUIRED",
            completedAt=None,
            completedBy=None,
            verifiedAt=None,
            verifiedBy=None,
            verificationNote=f"Site '{site.name}' ({site.site_code}) is not affected by amendment {cs_id}.",
            createdAt=None,
            updatedAt=None,
        )

    record = db.query(SiteTrainingRecord).filter(
        SiteTrainingRecord.site_id == site.id,
        SiteTrainingRecord.change_set_id == cs_id,
    ).first()

    if not record:
        record = SiteTrainingRecord(
            id=f"TRN-{site.id.upper()}-{cs_id}",
            site_id=site.id,
            change_set_id=cs_id,
            requirement_code="REQ-TRN-01",
            requirement_name=f"Protocol Amendment {cs_id} Site Staff Retraining",
            status="REQUIRED",
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    return map_training_record_to_schema(record)


@router.post("/{site_identifier}/training/complete", response_model=SiteTrainingRecordSchema)
def complete_site_training(
    site_identifier: str,
    payload: Optional[SiteTrainingCompleteRequest] = None,
    user_ctx: dict = Depends(require_governance_role([
        RoleName.COORDINATOR, RoleName.PI, RoleName.ADMIN, RoleName.MONITOR
    ])),
    db: Session = Depends(get_db),
):
    """
    Mark site training as COMPLETED (REQUIRED / IN_PROGRESS -> COMPLETED).
    Rejects completion for unaffected sites.
    Does NOT mark the training VERIFIED.
    """
    req = payload or SiteTrainingCompleteRequest()
    site = get_site_or_404(site_identifier, db)
    cs_id = req.changeSetId or "CS-0001"

    from app.services.training_service import is_site_impacted_by_changeset
    if not is_site_impacted_by_changeset(site, cs_id, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Site '{site.name}' ({site.site_code}) is not affected by amendment {cs_id}. Training is not required.",
        )

    record = db.query(SiteTrainingRecord).filter(
        SiteTrainingRecord.site_id == site.id,
        SiteTrainingRecord.change_set_id == cs_id,
    ).first()

    if not record:
        record = SiteTrainingRecord(
            id=f"TRN-{site.id.upper()}-{cs_id}",
            site_id=site.id,
            change_set_id=cs_id,
            requirement_code="REQ-TRN-01",
            requirement_name=f"Protocol Amendment {cs_id} Site Staff Retraining",
            status="REQUIRED",
        )
        db.add(record)

    if record.status == "VERIFIED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Training record is already VERIFIED and locked.",
        )

    completer_name = req.completedBy or user_ctx.get("email") or "Site Coordinator"

    record.status = "COMPLETED"
    record.completed_at = datetime.now(timezone.utc)
    record.completed_by = completer_name

    # Record audit event
    role_label = user_ctx.get("role").value if hasattr(user_ctx.get("role"), "value") else str(user_ctx.get("role"))
    record_audit_event(
        db=db,
        changeset_id=cs_id,
        who=f"{completer_name} ({role_label})",
        what="SITE_TRAINING_COMPLETED",
        outcome="COMPLETED",
        evidence_ref=f"{record.id} ({site.site_code})",
        custom_why=f"Mandatory protocol amendment retraining completed for {site.name} ({site.site_code}). Awaiting monitor verification.",
        title="Site Training Completed",
        step="STEP 5",
        status="COMPLETED",
    )

    # Harmonize EVD-03 to SUBMITTED if currently pending review
    from app.models.governance import EvidenceItem
    evd_03 = db.query(EvidenceItem).filter(
        EvidenceItem.id == "EVD-03",
        EvidenceItem.changeset_id == cs_id,
    ).first()
    if evd_03 and evd_03.status not in ["VERIFIED", "SUBMITTED"]:
        evd_03.status = "SUBMITTED"
        evd_03.button_text = "SUBMITTED"
        evd_03.uploaded_by = completer_name
        evd_03.uploader_role = role_label
        evd_03.file_name = f"training_completion_log_{site.site_code.lower()}.pdf"
        evd_03.file_hint = f"Site staff retraining log submitted for {site.name} ({site.site_code}). Awaiting CRA/Monitor review."
        evd_03.submitted_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(record)

    return map_training_record_to_schema(record)


@router.post("/{site_identifier}/training/verify", response_model=SiteTrainingRecordSchema)
def verify_site_training(
    site_identifier: str,
    payload: Optional[SiteTrainingVerifyRequest] = None,
    user_ctx: dict = Depends(require_governance_role([
        RoleName.MONITOR, RoleName.ADMIN
    ])),
    db: Session = Depends(get_db),
):
    """
    Verify completed site training (COMPLETED -> VERIFIED).
    Rejects verification for unaffected sites.
    Only MONITOR/CRA and ADMIN may verify.
    Requires status == COMPLETED.
    """
    req = payload or SiteTrainingVerifyRequest()
    site = get_site_or_404(site_identifier, db)
    cs_id = req.changeSetId or "CS-0001"

    from app.services.training_service import is_site_impacted_by_changeset
    if not is_site_impacted_by_changeset(site, cs_id, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Site '{site.name}' ({site.site_code}) is not affected by amendment {cs_id}. Training is not required.",
        )

    record = db.query(SiteTrainingRecord).filter(
        SiteTrainingRecord.site_id == site.id,
        SiteTrainingRecord.change_set_id == cs_id,
    ).first()

    if not record or record.status != "COMPLETED":
        current_status = record.status if record else "NOT_FOUND"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot verify site training: current status is '{current_status}'. Training must be COMPLETED before verification.",
        )

    verifier_name = req.verifiedBy or user_ctx.get("email") or "Clinical Monitor (CRA)"

    record.status = "VERIFIED"
    record.verified_at = datetime.now(timezone.utc)
    record.verified_by = verifier_name
    record.verification_note = req.verificationNote or "Site training verified against protocol criteria"

    # Record audit event
    role_label = user_ctx.get("role").value if hasattr(user_ctx.get("role"), "value") else str(user_ctx.get("role"))
    record_audit_event(
        db=db,
        changeset_id=cs_id,
        who=f"{verifier_name} ({role_label})",
        what="SITE_TRAINING_VERIFIED",
        outcome="VERIFIED",
        evidence_ref=f"{record.id} ({site.site_code})",
        custom_why=f"Clinical Monitor verified training logs and comprehension certificates for {site.name} ({site.site_code}). Note: {record.verification_note}",
        title="Site Training Verified",
        step="STEP 5",
        status="VERIFIED",
    )

    db.commit()
    db.refresh(record)

    # If all impacted sites are now verified, sync ChangeSet-level EVD-03 / F-003 / OBL-03
    from app.services.training_service import compute_training_completion
    from app.models.governance import EvidenceItem, Finding, Obligation

    training_status = compute_training_completion(cs_id, db)
    if training_status.is_training_completed:
        evd_03 = db.query(EvidenceItem).filter(
            EvidenceItem.id == "EVD-03",
            EvidenceItem.changeset_id == cs_id,
        ).first()
        if evd_03 and evd_03.status != "VERIFIED":
            evd_03.status = "VERIFIED"
            evd_03.button_text = "VERIFIED"
            evd_03.verified_by = verifier_name
            evd_03.reviewer_role = role_label
            evd_03.verification_hash = "0x8A1F9E3B"
            evd_03.verified_at = datetime.now(timezone.utc)

        obl_03 = db.query(Obligation).filter(
            Obligation.id == "OBL-03",
            Obligation.changeset_id == cs_id,
        ).first()
        if obl_03:
            obl_03.status = "COMPLETED"

        find_03 = db.query(Finding).filter(
            Finding.id == "F-003",
            Finding.changeset_id == cs_id,
        ).first()
        if find_03:
            find_03.status = "RESOLVED"

        db.commit()

    return map_training_record_to_schema(record)


@router.post("/{site_identifier}/training/request-changes", response_model=SiteTrainingRecordSchema)
@router.post("/{site_identifier}/training/reject", response_model=SiteTrainingRecordSchema)
def request_changes_site_training(
    site_identifier: str,
    payload: Optional[SiteTrainingRejectRequest] = None,
    user_ctx: dict = Depends(require_governance_role([
        RoleName.MONITOR, RoleName.ADMIN
    ])),
    db: Session = Depends(get_db),
):
    """
    Monitor / CRA requests changes or rejects a site's training evidence.
    Marks SiteTrainingRecord as CHANGES_REQUESTED and synchronizes EVD-03.
    """
    req = payload or SiteTrainingRejectRequest()
    site = get_site_or_404(site_identifier, db)
    cs_id = req.changeSetId or "CS-0001"

    from app.services.training_service import is_site_impacted_by_changeset
    if not is_site_impacted_by_changeset(site, cs_id, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Site '{site.name}' ({site.site_code}) is not affected by amendment {cs_id}. Training is not required.",
        )

    record = db.query(SiteTrainingRecord).filter(
        SiteTrainingRecord.site_id == site.id,
        SiteTrainingRecord.change_set_id == cs_id,
    ).first()

    if not record or record.status not in ["COMPLETED", "VERIFIED", "SUBMITTED"]:
        current_status = record.status if record else "NOT_FOUND"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot request changes for site training: current status is '{current_status}'. Training must be completed before requesting changes.",
        )

    reviewer_name = req.verifiedBy or user_ctx.get("email") or "Clinical Monitor (CRA)"
    reason = req.rejectionReason or "Site training evidence requires revision."

    record.status = "CHANGES_REQUESTED"
    record.verification_note = reason
    record.verified_at = datetime.now(timezone.utc)
    record.verified_by = reviewer_name

    # Record audit event
    role_label = user_ctx.get("role").value if hasattr(user_ctx.get("role"), "value") else str(user_ctx.get("role"))
    record_audit_event(
        db=db,
        changeset_id=cs_id,
        who=f"{reviewer_name} ({role_label})",
        what="EVIDENCE_REJECTED",
        outcome="CHANGES_REQUESTED",
        evidence_ref=f"{record.id} ({site.site_code})",
        custom_why=f"Clinical Monitor requested changes on training evidence for {site.name} ({site.site_code}): {reason}",
        title="Training Evidence Changes Requested",
        step="STEP 5",
        status="CHANGES_REQUESTED",
    )

    # Sync EVD-03, OBL-03, F-003 to reflect change request
    from app.models.governance import EvidenceItem, Finding, Obligation
    evd_03 = db.query(EvidenceItem).filter(
        EvidenceItem.id == "EVD-03",
        EvidenceItem.changeset_id == cs_id,
    ).first()
    if evd_03:
        evd_03.status = "REJECTED"
        evd_03.button_text = "RE-SUBMIT"
        evd_03.rejection_reason = reason

    obl_03 = db.query(Obligation).filter(
        Obligation.id == "OBL-03",
        Obligation.changeset_id == cs_id,
    ).first()
    if obl_03:
        obl_03.status = "OPEN"

    find_03 = db.query(Finding).filter(
        Finding.id == "F-003",
        Finding.changeset_id == cs_id,
    ).first()
    if find_03:
        find_03.status = "OPEN"

    db.commit()
    db.refresh(record)

    return map_training_record_to_schema(record)

