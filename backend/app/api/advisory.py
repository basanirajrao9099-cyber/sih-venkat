"""
Ayu-Trial Fabric: Safe Advisory AI API Router.
Exposes endpoints for ChangeSet summarization, Finding explanation with statutory citations,
and parameter-to-dependency mapping suggestions.
All endpoints strictly consume read-only DB sessions and execute under default-deny guardrails.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.guardrails.ai_guardrails import get_readonly_db
from app.services.advisory_service import (
    summarize_changeset,
    explain_finding,
    suggest_mappings,
)
from app.services.audit_service import record_audit_event
from app.schemas.advisory import (
    AdvisorySummaryRequest,
    AdvisorySummaryResponse,
    AdvisoryFindingExplanationRequest,
    AdvisoryFindingExplanationResponse,
    AdvisoryMappingSuggestionRequest,
    AdvisoryMappingSuggestionResponse,
)

router = APIRouter(prefix="/api/v1/advisory", tags=["Safe Advisory AI"])


@router.post("/summarize", response_model=AdvisorySummaryResponse)
def get_changeset_summary(
    payload: AdvisorySummaryRequest,
    readonly_db: Session = Depends(get_readonly_db),
    audit_db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
):
    """
    Summarize a protocol ChangeSet in plain English.
    Returns protocol delta, affected sites and participants, active blockers, and recommended steps.
    All outputs strictly labeled isAdvisory: True with mandatory legal disclaimer.
    """
    # 1. Audit the advisory inquiry in an independent audit transaction
    try:
        actor = f"{x_user_role or 'Lead PI'} (Advisory Requester)"
        record_audit_event(
            db=audit_db,
            changeset_id=payload.changeSetId,
            who=actor,
            what="AI_ADVISORY_QUERY",
            outcome="ADVISORY_GENERATED",
            evidence_ref="ChangeSet Synthesis Query",
            custom_why=f"User consulted AI Advisory for ChangeSet {payload.changeSetId} executive briefing.",
            title="AI Advisory: ChangeSet Summary Consultation",
            status="ADVISORY",
        )
        audit_db.commit()
    except Exception:
        audit_db.rollback()

    # 2. Synthesize advisory response in safe read-only context
    return summarize_changeset(
        changeset_id=payload.changeSetId,
        db=readonly_db,
        detail_level=payload.detailLevel or "comprehensive",
    )


@router.post("/explain-finding", response_model=AdvisoryFindingExplanationResponse)
def get_finding_explanation(
    payload: AdvisoryFindingExplanationRequest,
    readonly_db: Session = Depends(get_readonly_db),
    audit_db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
):
    """
    Explain a governance Finding in plain English.
    Retrieves verified statutory citations (ICMR 2017, NDCT 2019, Ayush GCP) from the immutable
    regulatory catalog and explains clinical safety context and concrete remediation steps.
    """
    # 1. Audit the advisory inquiry
    try:
        actor = f"{x_user_role or 'Lead PI'} (Advisory Requester)"
        record_audit_event(
            db=audit_db,
            changeset_id=payload.changeSetId or "CS-0001",
            who=actor,
            what="AI_ADVISORY_QUERY",
            outcome="ADVISORY_GENERATED",
            evidence_ref=f"Finding {payload.findingId}",
            custom_why=f"User consulted AI Advisory to explain Finding {payload.findingId} and regulatory rationale.",
            title=f"AI Advisory: Finding {payload.findingId} Consultation",
            status="ADVISORY",
        )
        audit_db.commit()
    except Exception:
        audit_db.rollback()

    # 2. Synthesize explanation
    return explain_finding(
        finding_id=payload.findingId,
        changeset_id=payload.changeSetId or "CS-0001",
        db=readonly_db,
    )


@router.post("/suggest-mappings", response_model=AdvisoryMappingSuggestionResponse)
def get_mapping_suggestions(
    payload: AdvisoryMappingSuggestionRequest,
    readonly_db: Session = Depends(get_readonly_db),
    audit_db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
):
    """
    Suggest impacted CRF forms, EDC variables, and regulatory checkpoints
    for a proposed change parameter.
    """
    # 1. Audit the advisory inquiry
    try:
        actor = f"{x_user_role or 'Lead PI'} (Advisory Requester)"
        record_audit_event(
            db=audit_db,
            changeset_id="CS-0001",
            who=actor,
            what="AI_ADVISORY_QUERY",
            outcome="ADVISORY_GENERATED",
            evidence_ref=f"Param: {payload.changeParameter}",
            custom_why=f"User requested AI Advisory mapping suggestions for parameter '{payload.changeParameter}'.",
            title=f"AI Advisory: Mapping Suggestion for '{payload.changeParameter}'",
            status="ADVISORY",
        )
        audit_db.commit()
    except Exception:
        audit_db.rollback()

    # 2. Synthesize suggestions
    return suggest_mappings(
        param=payload.changeParameter,
        old_val=payload.oldValue,
        new_val=payload.newValue,
        trial_id=payload.trialId or "ATF-001",
        db=readonly_db,
    )
