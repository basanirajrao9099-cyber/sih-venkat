from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.governance import ChangeSet, ImpactNode
from app.models.user import RoleName
from app.auth.dependencies import require_governance_role
from app.services.audit_service import record_audit_event
from app.schemas.governance import ChangeSetRecordSchema
from app.schemas.impact import (
    ImpactReportSchema,
    ImpactSummaryMetricsSchema,
    ImpactNodeSchema,
)

router = APIRouter(prefix="/api/v1/changesets", tags=["ChangeSets & Impact"])


def map_changeset_to_schema(cs: ChangeSet) -> ChangeSetRecordSchema:
    return ChangeSetRecordSchema(
        id=cs.id,
        trialId=cs.trial_id,
        trialName=cs.trial_name or "Ashwagandha–Guduchi PVFS Clinical Study",
        protocol=cs.protocol or "v1.1",
        type=cs.type,
        title=getattr(cs, "title", None) or cs.change or cs.type,
        reason=getattr(cs, "reason", None) or "Protocol optimization and clinical assessment window adjustment.",
        previousState=cs.previous_state,
        newState=cs.new_state,
        change=cs.change,
        affectedEntities=cs.affected_entities or [],
        effectiveDate=cs.effective_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        status=cs.status or "Draft",
        created=cs.created or "Today",
    )


@router.get("", response_model=List[ChangeSetRecordSchema])
def list_changesets(db: Session = Depends(get_db)):
    """List all proposed and active ChangeSets."""
    changesets = db.query(ChangeSet).order_by(ChangeSet.created_at.desc()).all()
    return [map_changeset_to_schema(cs) for cs in changesets]


@router.post("", response_model=ChangeSetRecordSchema, status_code=status.HTTP_201_CREATED)
def create_changeset(
    payload: ChangeSetRecordSchema,
    user_ctx: dict = Depends(require_governance_role([RoleName.PI, RoleName.ADMIN])),
    db: Session = Depends(get_db),
):
    """Create a new ChangeSet proposal as Draft and record audit trail."""
    cs_id = payload.id
    if not cs_id:
        existing_all = db.query(ChangeSet).all()
        max_num = 1
        for c in existing_all:
            if c.id and c.id.startswith("CS-"):
                try:
                    num = int(c.id.split("-")[1])
                    if num > max_num:
                        max_num = num
                except (ValueError, IndexError):
                    pass
        cs_id = f"CS-{max_num + 1:04d}"

    existing = db.query(ChangeSet).filter(ChangeSet.id == cs_id).first()
    if existing:
        return map_changeset_to_schema(existing)

    change_desc = payload.change or f"{payload.previousState} → {payload.newState}"
    new_cs = ChangeSet(
        id=cs_id,
        trial_id=payload.trialId or "AYU-CT-2026-042",
        trial_name=payload.trialName or "Ashwagandha–Guduchi PVFS Clinical Study",
        protocol=payload.protocol or "v1.1",
        type=payload.type or "Visit schedule",
        title=payload.title or f"{payload.type} Amendment",
        reason=payload.reason or "Protocol assessment window adjustment for clinical sites.",
        previous_state=payload.previousState,
        new_state=payload.newState,
        change=change_desc,
        affected_entities=payload.affectedEntities or ["Sites", "Participants", "Visits", "CRFs", "Consent", "Training", "Ethics"],
        effective_date=payload.effectiveDate or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        status=payload.status or "Draft",
        created=payload.created or "Today",
    )
    db.add(new_cs)
    db.commit()
    db.refresh(new_cs)

    # Record audit trail event
    record_audit_event(
        db=db,
        changeset_id=new_cs.id,
        who="Dr. V. Sharma (Principal Investigator)",
        what="CHANGESET_CREATED",
        outcome="DRAFT_SAVED",
        custom_why=f"Drafted amendment proposal {new_cs.id}: {new_cs.type} ({new_cs.change}). Status: {new_cs.status}.",
        title="Amendment Created",
        step="STEP 1",
        status="PASSED",
    )
    db.commit()

    return map_changeset_to_schema(new_cs)


@router.get("/{changeset_id}", response_model=ChangeSetRecordSchema)
def get_changeset_by_id(changeset_id: str, db: Session = Depends(get_db)):
    """Retrieve single ChangeSet detail."""
    cs = db.query(ChangeSet).filter(ChangeSet.id == changeset_id).first()
    if not cs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ChangeSet '{changeset_id}' not found",
        )
    return map_changeset_to_schema(cs)


@router.patch("/{changeset_id}", response_model=ChangeSetRecordSchema)
def update_changeset(
    changeset_id: str,
    payload: dict,
    user_ctx: dict = Depends(require_governance_role([RoleName.PI, RoleName.ADMIN])),
    db: Session = Depends(get_db),
):
    """Update ChangeSet status or metadata."""
    cs = db.query(ChangeSet).filter(ChangeSet.id == changeset_id).first()
    if not cs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ChangeSet '{changeset_id}' not found",
        )

    if "status" in payload:
        cs.status = payload["status"]
    if "title" in payload:
        cs.title = payload["title"]
    if "reason" in payload:
        cs.reason = payload["reason"]

    record_audit_event(
        db=db,
        changeset_id=cs.id,
        who="Dr. V. Sharma (Principal Investigator)",
        what="CHANGESET_UPDATED",
        outcome="UPDATED",
        custom_why=f"Updated amendment {cs.id} status to {cs.status}.",
        title="Amendment Updated",
        step="STEP 1",
        status="PASSED",
    )
    db.commit()
    db.refresh(cs)
    return map_changeset_to_schema(cs)


@router.get("/{changeset_id}/impact", response_model=ImpactReportSchema)
def get_changeset_impact(changeset_id: str, db: Session = Depends(get_db)):
    """
    Execute backend blast radius impact resolution for a ChangeSet.
    Outputs authoritative affected sites, participants, visits, CRFs, and governance requirements.
    """
    cs = db.query(ChangeSet).filter(ChangeSet.id == changeset_id).first()
    if not cs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ChangeSet '{changeset_id}' not found",
        )

    from app.pipeline.dependency_resolver import dependency_resolver
    report = dependency_resolver.resolve(changeset_id, db)

    # If changeset was Draft, update to Impact analyzed
    if cs.status in ["Draft", "DRAFT"]:
        cs.status = "Impact analyzed"
        db.commit()

    # Record audit event
    record_audit_event(
        db=db,
        changeset_id=changeset_id,
        who="System Intelligence (Dependency Resolver)",
        what="IMPACT_ANALYSIS",
        outcome="RESOLVED",
        custom_why=f"Traversed clinical schema for {changeset_id}: {report.summary.sitesCount} sites, {report.summary.participantsCount} participants, {report.summary.visitsCount} visit affected.",
        title="Impact Analysis Run",
        step="STEP 2",
        status="PASSED",
    )
    db.commit()

    return report
