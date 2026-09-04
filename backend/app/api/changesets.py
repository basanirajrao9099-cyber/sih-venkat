from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.governance import ChangeSet, ImpactNode
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
        trialName=cs.trial_name,
        protocol=cs.protocol,
        type=cs.type,
        previousState=cs.previous_state,
        newState=cs.new_state,
        change=cs.change,
        affectedEntities=cs.affected_entities or [],
        effectiveDate=cs.effective_date,
        status=cs.status,
        created=cs.created,
    )


@router.get("", response_model=List[ChangeSetRecordSchema])
def list_changesets(db: Session = Depends(get_db)):
    """List all proposed and active ChangeSets."""
    changesets = db.query(ChangeSet).all()
    return [map_changeset_to_schema(cs) for cs in changesets]


@router.post("", response_model=ChangeSetRecordSchema, status_code=status.HTTP_201_CREATED)
def create_changeset(payload: ChangeSetRecordSchema, db: Session = Depends(get_db)):
    """Create a new ChangeSet proposal."""
    existing = db.query(ChangeSet).filter(ChangeSet.id == payload.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ChangeSet with ID '{payload.id}' already exists",
        )

    new_cs = ChangeSet(
        id=payload.id,
        trial_id=payload.trialId,
        trial_name=payload.trialName,
        protocol=payload.protocol,
        type=payload.type,
        previous_state=payload.previousState,
        new_state=payload.newState,
        change=payload.change,
        affected_entities=payload.affectedEntities,
        effective_date=payload.effectiveDate,
        status=payload.status,
        created=payload.created,
    )
    db.add(new_cs)
    db.commit()
    db.refresh(new_cs)
    return map_changeset_to_schema(new_cs)


@router.get("/{changeset_id}/impact", response_model=ImpactReportSchema)
def get_changeset_impact(changeset_id: str, db: Session = Depends(get_db)):
    """
    Get the resolved blast radius impact graph and metrics for a ChangeSet.
    Outputs the exact nodes and metrics expected by Part A React Flow graph.
    """
    cs = db.query(ChangeSet).filter(ChangeSet.id == changeset_id).first()
    if not cs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ChangeSet '{changeset_id}' not found",
        )

    from app.pipeline.dependency_resolver import dependency_resolver
    return dependency_resolver.resolve(changeset_id, db)
