from typing import List, Optional
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.governance import Finding, Obligation, EvidenceItem, CompilationRun
from app.models.audit import AuditTrailRecord
from app.services.audit_service import record_audit_event
from app.models.user import RoleName
from app.auth.dependencies import require_governance_role
from app.schemas.governance import (
    FindingSchema,
    ObligationSchema,
    EvidenceItemSchema,
    EvidenceSubmissionRequest,
    EvidenceVerificationRequest,
    ReadinessSummarySchema,
    CompilationRunDataSchema,
    CompilationRunSummarySchema,
    CompilationRunRequest,
    CompilationStepSchema,
)
from app.rules.models import EvaluationReport

router = APIRouter(prefix="/api/v1/compiler", tags=["Governance Compiler"])


@router.get("/findings", response_model=List[FindingSchema])
def get_findings(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """Retrieve governance findings (3 BLOCK, 1 WARNING)."""
    findings = db.query(Finding).filter(Finding.changeset_id == changeSetId).all()
    return [
        FindingSchema(
            id=f.id,
            type=f.type,
            title=f.title,
            description=f.description,
            severity=f.severity,
            status=f.status,
            rule=f.rule,
            affectedEntity=f.affected_entity,
            obligationId=f.obligation_id,
            isDemoFixture=f.is_demo_fixture,
            source=f.source,
        )
        for f in findings
    ]


@router.get("/obligations", response_model=List[ObligationSchema])
def get_obligations(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """Retrieve governance obligations."""
    obligations = db.query(Obligation).filter(Obligation.changeset_id == changeSetId).all()
    return [
        ObligationSchema(
            id=o.id,
            obligation=o.obligation,
            owner=o.owner,
            status=o.status,
            deadline=o.deadline,
            severity=o.severity,
            findingId=o.finding_id,
            isDemoFixture=o.is_demo_fixture,
            source=o.source,
        )
        for o in obligations
    ]


def to_evidence_schema(e: EvidenceItem) -> EvidenceItemSchema:
    return EvidenceItemSchema(
        id=e.id,
        title=e.title,
        status=e.status,
        buttonText=e.button_text or "ADD EVIDENCE",
        fileHint=e.file_hint,
        fileUrl=e.file_url,
        documentType=e.document_type,
        uploadedBy=e.uploaded_by,
        uploaderRole=e.uploader_role,
        fileName=e.file_name,
        fileSizeBytes=e.file_size_bytes,
        checksumSha256=e.checksum_sha256,
        submittedAt=e.submitted_at.isoformat() if e.submitted_at else None,
        verifiedBy=e.verified_by,
        reviewerRole=e.reviewer_role,
        verificationHash=e.verification_hash,
        rejectionReason=e.rejection_reason,
        verifiedAt=e.verified_at.isoformat() if e.verified_at else None,
        isDemoFixture=e.is_demo_fixture,
        source=e.source,
    )


@router.get("/evidence", response_model=List[EvidenceItemSchema])
def get_evidence(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """Retrieve evidence checklist items."""
    evidence = db.query(EvidenceItem).filter(EvidenceItem.changeset_id == changeSetId).all()
    return [to_evidence_schema(e) for e in evidence]



@router.get("/readiness", response_model=ReadinessSummarySchema)
def get_readiness(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """Calculate implementation readiness based on open blocking findings."""
    blocking = db.query(Finding).filter(
        Finding.changeset_id == changeSetId,
        Finding.type == "BLOCK",
        Finding.status == "OPEN",
    ).count()

    warnings = db.query(Finding).filter(
        Finding.changeset_id == changeSetId,
        Finding.type == "WARNING",
    ).count()

    total_evidence = db.query(EvidenceItem).filter(EvidenceItem.changeset_id == changeSetId).count()
    verified_evidence = db.query(EvidenceItem).filter(
        EvidenceItem.changeset_id == changeSetId,
        EvidenceItem.status.in_(["VERIFIED", "AVAILABLE"]),
    ).count()

    is_ready = blocking == 0

    return ReadinessSummarySchema(
        protocol="v1.1",
        changeSet=changeSetId or "CS-0001",
        sites=3,
        participants=47,
        blockingFindings=blocking,
        warnings=warnings,
        evidence=f"{verified_evidence} / {total_evidence}",
        status="READY" if is_ready else "BLOCKED",
    )


@router.get("/status")
def get_compiler_status(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """Returns 'READY' or 'BLOCKED' for Part A status polling."""
    blocking = db.query(Finding).filter(
        Finding.changeset_id == changeSetId,
        Finding.type == "BLOCK",
        Finding.status == "OPEN",
    ).count()
    return {"status": "READY" if blocking == 0 else "BLOCKED"}


@router.post("/run", response_model=CompilationRunDataSchema)
@router.post("/recompile", response_model=CompilationRunDataSchema)
def run_compiler(payload: CompilationRunRequest, db: Session = Depends(get_db)):
    """
    Execute the full governance compiler pipeline deterministically:
    ChangeSet -> Validate -> Resolve Dependencies -> Load Rules -> Evaluate
    -> Generate Findings -> Generate Obligations -> Calculate Readiness.
    Creates an immutable CompilationRun record without overwriting prior runs.
    """
    from app.pipeline.compiler_pipeline import compiler_pipeline
    return compiler_pipeline.compile(payload, db)


@router.get("/runs", response_model=List[CompilationRunSummarySchema])
def list_compilation_runs(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """
    Retrieve all historical, immutable compilation runs for a ChangeSet in chronological order.
    Proves both CMP-000128 (FAILED) and CMP-000129 (PASSED) persist independently.
    """
    runs = db.query(CompilationRun).filter(
        CompilationRun.changeset_id == changeSetId
    ).order_by(CompilationRun.created_at.asc()).all()

    return [
        CompilationRunSummarySchema(
            runId=r.run_id,
            changeSetId=r.changeset_id,
            trialId=r.trial_id,
            protocol=r.protocol,
            status=r.status,
            readinessStatus=r.readiness_status,
            blockingCount=int(r.blocking_count or 0),
            warningsCount=int(r.warnings_count or 0),
            evidenceCount=r.evidence_count or "0 / 4",
            timestamp=r.created_at.isoformat() if r.created_at else datetime.now(timezone.utc).isoformat(),
            auditHash=r.audit_hash or "0x9F4C2A7B8E3D",
        )
        for r in runs
    ]


@router.get("/runs/{run_id}", response_model=CompilationRunDataSchema)
def get_compilation_run_by_id(run_id: str, db: Session = Depends(get_db)):
    """
    Retrieve an exact, frozen historical snapshot of a compilation run by run ID (e.g. CMP-000128).
    Returns the latest run matching the run_id.
    """
    run = db.query(CompilationRun).filter(
        CompilationRun.run_id == run_id
    ).order_by(CompilationRun.created_at.desc()).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Compilation run {run_id} not found")


    readiness = ReadinessSummarySchema(
        protocol=run.protocol,
        changeSet=run.changeset_id,
        sites=3,
        participants=47,
        blockingFindings=int(run.blocking_count or 0),
        warnings=int(run.warnings_count or 0),
        evidence=run.evidence_count or "0 / 4",
        status=run.readiness_status,
    )

    steps = [CompilationStepSchema(**s) for s in (run.pipeline_steps or [])]

    return CompilationRunDataSchema(
        runId=run.run_id,
        changeSetId=run.changeset_id,
        trialId=run.trial_id,
        protocol=run.protocol,
        timestamp=run.created_at.isoformat() if run.created_at else datetime.now(timezone.utc).isoformat(),
        status=run.status,
        readiness=readiness,
        pipelineSteps=steps,
        auditHash=run.audit_hash or "0x9F4C2A7B8E3D",
        isDemoFixture=run.is_demo_fixture,
        source=run.source,
    )


@router.post("/evaluate", response_model=EvaluationReport)
def evaluate_changeset(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """
    Evaluate proposed ChangeSet against all 10 clinical governance rules.
    Returns explainable, non-black-box findings with rule codes, reasons, and suggested remediations.
    """
    from app.rules.evaluator import evaluator
    ctx = evaluator.build_context_from_db(changeSetId, db)
    report = evaluator.evaluate(ctx, db=db)
    return report


@router.post("/evidence/submit", response_model=EvidenceItemSchema)
def submit_evidence(
    payload: EvidenceSubmissionRequest,
    user_ctx: dict = Depends(require_governance_role([RoleName.COORDINATOR, RoleName.PI, RoleName.ADMIN])),
    db: Session = Depends(get_db),
):
    """
    Ingest uploaded regulatory/clinical evidence metadata and provenance checksum.
    Permits resubmission if previously REJECTED.
    """
    evd = db.query(EvidenceItem).filter(
        EvidenceItem.id == payload.evidenceId,
        EvidenceItem.changeset_id == payload.changeSetId,
    ).first()
    if not evd:
        raise HTTPException(status_code=404, detail=f"Evidence item {payload.evidenceId} not found")

    if evd.status == "VERIFIED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Evidence is already verified and locked. Cannot overwrite.",
        )

    evd.status = "SUBMITTED"
    evd.button_text = "SUBMITTED"
    evd.title = payload.title or evd.title
    evd.document_type = payload.documentType or "Regulatory Dossier"
    evd.uploaded_by = payload.uploadedBy or user_ctx.get("email") or "Clinical Coordinator"
    evd.uploader_role = payload.uploaderRole or user_ctx.get("role", RoleName.COORDINATOR).value
    evd.file_name = payload.fileName or "evidence_document.pdf"
    evd.file_size_bytes = payload.fileSizeBytes or 1048576
    evd.checksum_sha256 = payload.checksumSha256 or "0x7F9B2C1A8E3D"
    evd.submitted_at = datetime.now(timezone.utc)
    evd.rejection_reason = None # Clear prior rejection reason upon fresh resubmission

    record_audit_event(
        db=db,
        changeset_id=payload.changeSetId,
        who=f"{evd.uploaded_by} ({evd.uploader_role})",
        what="EVIDENCE_SUBMITTED",
        outcome="SUBMITTED",
        evidence_ref=f"{evd.id} ({evd.file_name})",
        custom_why=f"Submitted {evd.title} ({evd.file_name}, SHA-256: {evd.checksum_sha256[:10]}...). Status: PENDING REVIEW.",
        title="Evidence Submitted",
        step="STEP 5",
        status="SUBMITTED",
    )
    db.commit()
    db.refresh(evd)

    return to_evidence_schema(evd)


@router.post("/evidence/{evidence_id}/verify", response_model=EvidenceItemSchema)
def verify_evidence(
    evidence_id: str,
    payload: Optional[EvidenceVerificationRequest] = None,
    changeSetId: Optional[str] = Query("CS-0001"),
    user_ctx: dict = Depends(require_governance_role([
        RoleName.ETHICS_REVIEWER, RoleName.MONITOR, RoleName.PV, RoleName.ADMIN
    ])),
    db: Session = Depends(get_db),
):
    """
    Reviewer determination (ACCEPT / REJECT) with RBAC, idempotency guards,
    and automatic finding/obligation synchronization.
    """
    req = payload or EvidenceVerificationRequest()
    evd = db.query(EvidenceItem).filter(
        EvidenceItem.id == evidence_id,
        EvidenceItem.changeset_id == changeSetId,
    ).first()
    if not evd:
        raise HTTPException(status_code=404, detail=f"Evidence item {evidence_id} not found")

    caller_role = user_ctx.get("role")
    if evidence_id in ["EVD-01", "EVD-02"] and caller_role not in [RoleName.ETHICS_REVIEWER, RoleName.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Role '{caller_role.value}' cannot verify Ethics Committee evidence ({evidence_id}). Required: Ethics Reviewer.",
        )
    elif evidence_id == "EVD-03" and caller_role not in [RoleName.MONITOR, RoleName.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Role '{caller_role.value}' cannot verify Site Training logs ({evidence_id}). Required: Monitor.",
        )

    # Idempotency checks
    if req.decision == "ACCEPT" and evd.status == "VERIFIED":
        return to_evidence_schema(evd)
    if req.decision == "REJECT" and evd.status == "REJECTED":
        return to_evidence_schema(evd)

    num = int(evidence_id.split("-")[-1])
    obl_id = f"OBL-{num:02d}"
    find_id = f"F-{num:03d}"

    obl = db.query(Obligation).filter(
        Obligation.id == obl_id,
        Obligation.changeset_id == changeSetId,
    ).first()
    finding = db.query(Finding).filter(
        Finding.id == find_id,
        Finding.changeset_id == changeSetId,
    ).first()

    if req.decision == "ACCEPT":
        evd.status = "VERIFIED"
        evd.button_text = "VERIFIED"
        evd.verified_by = req.verifiedBy or "Central Ethics Committee"
        evd.reviewer_role = req.reviewerRole or (caller_role.value if caller_role else "Ethics Reviewer")
        evd.verification_hash = "0x8A1F9E3B"
        evd.verified_at = datetime.now(timezone.utc)
        evd.rejection_reason = None

        if obl:
            obl.status = "COMPLETED"
        if finding:
            finding.status = "RESOLVED"

        audit_desc = f"Verified & approved {evd.title}. Finding {find_id} resolved, obligation {obl_id} completed."
        audit_status = "PASSED"
    else: # REJECT
        evd.status = "REJECTED"
        evd.button_text = "RE-SUBMIT"
        evd.verified_by = req.verifiedBy or "Reviewer"
        evd.reviewer_role = req.reviewerRole or (caller_role.value if caller_role else "Reviewer")
        evd.rejection_reason = req.rejectionReason or req.comments or "Evidence document rejected due to discrepancy"
        evd.verification_hash = None
        evd.verified_at = datetime.now(timezone.utc)

        if obl:
            obl.status = "OPEN"
        if finding:
            finding.status = "OPEN"

        audit_desc = f"Evidence {evidence_id} rejected: {evd.rejection_reason}. Finding {find_id} remains BLOCK."
        audit_status = "FAILED"

    action_what = "EVIDENCE_VERIFIED" if req.decision == "ACCEPT" else "EVIDENCE_REJECTED"
    record_audit_event(
        db=db,
        changeset_id=changeSetId,
        who=f"{evd.verified_by} ({evd.reviewer_role})",
        what=action_what,
        outcome=audit_status,
        evidence_ref=f"{evd.id} ({evd.title})",
        custom_why=audit_desc,
        title=f"Evidence {req.decision.title()}ed",
        step="STEP 5",
        status=audit_status,
    )
    db.commit()
    db.refresh(evd)

    return to_evidence_schema(evd)



@router.post("/reset")
def reset_compiler_state(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """
    Reset compiler demo state back to initial unverified state with open blockers.
    """
    for evd in db.query(EvidenceItem).filter(EvidenceItem.changeset_id == changeSetId).all():
        if evd.id != "EVD-04":
            evd.status = "MISSING"
            evd.button_text = "ADD EVIDENCE"
            evd.rejection_reason = None
            evd.verified_by = None
            evd.verified_at = None
    for obl in db.query(Obligation).filter(Obligation.changeset_id == changeSetId).all():
        obl.status = "OPEN"
    for f in db.query(Finding).filter(Finding.changeset_id == changeSetId).all():
        f.status = "OPEN"

    # Reset run counter for CS-0001
    from app.models.governance import CompilationRunCounter
    counter = db.query(CompilationRunCounter).filter(CompilationRunCounter.key == "global_runs").first()
    if counter:
        counter.current_val = 127

    # Delete non-fixture compilation runs so previous tests don't leak runs
    db.query(CompilationRun).filter(
        CompilationRun.changeset_id == changeSetId,
        CompilationRun.is_demo_fixture == False,
    ).delete()

    # Delete non-fixture audit records so tests don't leak events
    fixture_ids = {"EVT-001", "EVT-002", "EVT-003", "EVT-004", "EVT-005", "EVT-006", "EVT-007"}
    db.query(AuditTrailRecord).filter(
        AuditTrailRecord.changeset_id == changeSetId,
        ~AuditTrailRecord.id.in_(fixture_ids),
    ).delete(synchronize_session=False)

    # Reset AuditChainState
    from app.models.audit import AuditChainState
    evt7 = db.query(AuditTrailRecord).filter(AuditTrailRecord.id == "EVT-007").first()
    chain_state = db.query(AuditChainState).filter(AuditChainState.changeset_id == changeSetId).first()
    if chain_state and evt7:
        chain_state.last_hash = evt7.hash
        chain_state.sequence = 7

    db.commit()
    return {"message": "Compiler state reset successfully"}



