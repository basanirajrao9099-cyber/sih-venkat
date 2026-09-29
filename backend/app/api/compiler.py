from typing import List, Optional
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.governance import Finding, Obligation, EvidenceItem, CompilationRun
from app.models.trial import SiteTrainingRecord
from app.models.audit import AuditTrailRecord
from app.services.audit_service import record_audit_event
from app.services.training_service import compute_training_completion, get_impacted_sites_for_changeset
from app.models.user import RoleName
from app.auth.dependencies import require_governance_role
from app.schemas.governance import (
    FindingSchema,
    ObligationSchema,
    EvidenceItemSchema,
    SiteTrainingEvidenceSchema,
    EvidenceSubmissionRequest,
    EvidenceVerificationRequest,
    ReadinessDimensionSchema,
    ReadinessBlockerSchema,
    ReadinessSummarySchema,
    CompilationRunDataSchema,
    CompilationRunSummarySchema,
    CompilationRunRequest,
    CompilationStepSchema,
)
from app.rules.models import EvaluationReport

router = APIRouter(prefix="/api/v1/compiler", tags=["Governance Compiler"])


def to_evidence_schema(e: EvidenceItem, db: Optional[Session] = None) -> EvidenceItemSchema:
    status = e.status
    button_text = e.button_text or "ADD EVIDENCE"
    rejection_reason = e.rejection_reason
    verified_by = e.verified_by
    verified_at = e.verified_at.isoformat() if e.verified_at else None
    affected_sites_count: Optional[int] = None
    verified_sites_count: Optional[int] = None
    site_evidence: Optional[List[SiteTrainingEvidenceSchema]] = None

    if e.id == "EVD-03" and db is not None:
        impacted_sites = get_impacted_sites_for_changeset(e.changeset_id or "CS-0001", db)
        affected_sites_count = len(impacted_sites)
        site_evidence = []
        verified_count = 0
        has_changes_requested = False
        has_completed = False
        changes_reason = None

        for s in impacted_sites:
            rec = db.query(SiteTrainingRecord).filter(
                SiteTrainingRecord.site_id == s.id,
                SiteTrainingRecord.change_set_id == (e.changeset_id or "CS-0001"),
            ).first()

            s_trn_status = rec.status if rec else "REQUIRED"
            if s_trn_status == "VERIFIED":
                s_evd_status = "VERIFIED"
                s_ver_status = "VERIFIED"
                verified_count += 1
            elif s_trn_status == "COMPLETED":
                s_evd_status = "AWAITING_REVIEW"
                s_ver_status = "PENDING"
                has_completed = True
            elif s_trn_status in ["CHANGES_REQUESTED", "REJECTED"]:
                s_evd_status = "CHANGES_REQUESTED"
                s_ver_status = "CHANGES_REQUESTED"
                has_changes_requested = True
                if rec and rec.verification_note:
                    changes_reason = rec.verification_note
            elif s_trn_status == "IN_PROGRESS":
                s_evd_status = "REQUIRED"
                s_ver_status = "PENDING"
            else:
                s_trn_status = "REQUIRED"
                s_evd_status = "REQUIRED"
                s_ver_status = "PENDING"

            site_evidence.append(
                SiteTrainingEvidenceSchema(
                    id=rec.id if rec else f"TRN-{s.id.upper()}-{e.changeset_id or 'CS-0001'}",
                    siteId=s.site_id or s.id,
                    siteCode=s.site_code or s.site_id,
                    siteName=s.name or s.site_name,
                    location=s.location or f"{s.city}, {s.state}",
                    impactStatus="AFFECTED",
                    trainingStatus=s_trn_status,
                    evidenceStatus=s_evd_status,
                    verificationStatus=s_ver_status,
                    completedBy=rec.completed_by if rec else None,
                    completedAt=rec.completed_at.isoformat() if rec and rec.completed_at else None,
                    verifiedBy=rec.verified_by if rec else None,
                    verifiedAt=rec.verified_at.isoformat() if rec and rec.verified_at else None,
                    verificationNote=rec.verification_note if rec else None,
                    rejectionReason=rec.verification_note if (rec and rec.status in ["CHANGES_REQUESTED", "REJECTED"]) else None,
                )
            )

        verified_sites_count = verified_count

        if has_changes_requested:
            status = "REJECTED"
            button_text = "RE-SUBMIT"
            rejection_reason = changes_reason or e.rejection_reason or "Site training evidence requires revision."
        elif affected_sites_count > 0 and verified_count == affected_sites_count:
            status = "VERIFIED"
            button_text = "VERIFIED"
            rejection_reason = None
            verified_by = verified_by or "Lead Clinical Monitor"
        elif verified_count > 0 or has_completed or e.status == "SUBMITTED":
            status = "SUBMITTED"
            button_text = "AWAITING REVIEW"
            rejection_reason = None
        else:
            status = e.status if e.status in ["AVAILABLE"] else "MISSING"
            button_text = "SUBMIT EVIDENCE"
            rejection_reason = None

    return EvidenceItemSchema(
        id=e.id,
        title=e.title,
        status=status,
        buttonText=button_text,
        fileHint=e.file_hint,
        fileUrl=e.file_url,
        documentType=e.document_type,
        uploadedBy=e.uploaded_by,
        uploaderRole=e.uploader_role,
        fileName=e.file_name,
        fileSizeBytes=e.file_size_bytes,
        checksumSha256=e.checksum_sha256,
        submittedAt=e.submitted_at.isoformat() if e.submitted_at else None,
        verifiedBy=verified_by,
        reviewerRole=e.reviewer_role,
        verificationHash=e.verification_hash,
        rejectionReason=rejection_reason,
        verifiedAt=verified_at,
        description=e.file_hint,
        affectedSitesCount=affected_sites_count,
        verifiedSitesCount=verified_sites_count,
        siteEvidence=site_evidence,
        isDemoFixture=e.is_demo_fixture,
        source=e.source,
    )


def compute_readiness_summary(
    changeSetId: Optional[str],
    db: Session,
    protocol: str = "v1.1",
    sites_count: int = 3,
    participants_count: int = 47,
) -> ReadinessSummarySchema:
    cs_id = changeSetId or "CS-0001"

    blocking = db.query(Finding).filter(
        Finding.changeset_id == cs_id,
        Finding.type == "BLOCK",
        Finding.status == "OPEN",
    ).count()

    warnings = db.query(Finding).filter(
        Finding.changeset_id == cs_id,
        Finding.type == "WARNING",
    ).count()

    evidence_items = db.query(EvidenceItem).filter(EvidenceItem.changeset_id == cs_id).all()
    evidence_schemas = [to_evidence_schema(e, db) for e in evidence_items]
    total_evidence = len(evidence_schemas)
    verified_evidence = sum(1 for e in evidence_schemas if e.status in ["VERIFIED", "AVAILABLE"])
    submitted_evidence = sum(1 for e in evidence_schemas if e.status in ["SUBMITTED", "VERIFIED", "AVAILABLE"])

    evd_map = {e.id: e for e in evidence_schemas}
    evd_01 = evd_map.get("EVD-01")
    evd_02 = evd_map.get("EVD-02")
    evd_03 = evd_map.get("EVD-03")

    training_status = compute_training_completion(cs_id, db)
    is_impact_complete = True
    is_ethics_approved = bool(evd_01 and evd_01.status in ["VERIFIED", "AVAILABLE"])
    is_training_completed = training_status.is_training_completed
    is_consent_verified = bool(evd_02 and evd_02.status in ["VERIFIED", "AVAILABLE"])
    is_evidence_submitted = (total_evidence > 0 and submitted_evidence == total_evidence)
    is_evidence_verified = (total_evidence > 0 and verified_evidence == total_evidence)
    is_compliance_resolved = (blocking == 0 and is_consent_verified)

    remaining_reqs: List[str] = []
    if not is_ethics_approved:
        remaining_reqs.append("IEC approval")
    if not is_training_completed:
        remaining_reqs.append("Site retraining")
    if not is_consent_verified:
        remaining_reqs.append("Participant re-consent addendum")

    if blocking > 0:
        open_blockers = db.query(Finding).filter(
            Finding.changeset_id == cs_id,
            Finding.type == "BLOCK",
            Finding.status == "OPEN",
        ).all()
        for f in open_blockers:
            if f.id not in ["F-001", "F-002", "F-003"] and f.title not in remaining_reqs:
                remaining_reqs.append(f.title)

    is_ready_overall = (blocking == 0 and is_evidence_verified and is_training_completed)

    last_run = db.query(CompilationRun).filter(
        CompilationRun.changeset_id == cs_id
    ).order_by(CompilationRun.created_at.desc()).first()

    if is_ready_overall:
        if last_run and last_run.status == "PASSED":
            readiness_stage = "READY"
        else:
            readiness_stage = "READY_FOR_IMPLEMENTATION"
    elif submitted_evidence > 0 or verified_evidence > 0:
        readiness_stage = "REQUIREMENTS_IN_PROGRESS"
    else:
        readiness_stage = "NOT_READY"

    dimensions = [
        ReadinessDimensionSchema(
            name="Impact",
            status="COMPLETE",
            details=f"Complete ({sites_count} sites, {participants_count} participants, 1 visit, 1 CRF)",
            isComplete=True,
        ),
        ReadinessDimensionSchema(
            name="Evidence",
            status="COMPLETE" if is_evidence_verified else ("IN_PROGRESS" if submitted_evidence > 0 else "PENDING"),
            details=f"{verified_evidence} / {total_evidence} verified",
            isComplete=is_evidence_verified,
        ),
        ReadinessDimensionSchema(
            name="Ethics review",
            status="COMPLETE" if is_ethics_approved else "PENDING",
            details="Approved" if is_ethics_approved else "IEC approval pending",
            isComplete=is_ethics_approved,
        ),
        ReadinessDimensionSchema(
            name="Training",
            status="COMPLETE" if is_training_completed else "PENDING",
            details=training_status.details,
            isComplete=is_training_completed,
        ),
        ReadinessDimensionSchema(
            name="Compliance",
            status="COMPLETE" if is_compliance_resolved else "PENDING",
            details="0 blocking findings" if is_compliance_resolved else f"{blocking} open blockers",
            isComplete=is_compliance_resolved,
        ),
    ]

    blockers: List[ReadinessBlockerSchema] = []

    # 1. Site-level training blockers for affected sites
    if evd_03 and evd_03.siteEvidence:
        for site_ev in evd_03.siteEvidence:
            if site_ev.impactStatus == "NOT_AFFECTED":
                continue
            if site_ev.trainingStatus == "REJECTED" or site_ev.evidenceStatus == "CHANGES_REQUESTED":
                blockers.append(
                    ReadinessBlockerSchema(
                        id=f"BLK-TRAIN-{site_ev.siteId}",
                        title=site_ev.siteName,
                        requirementName="Training evidence",
                        category="TRAINING",
                        siteId=site_ev.siteId,
                        siteName=site_ev.siteName,
                        status="Changes requested",
                        explanation=site_ev.rejectionReason or "Monitor requested changes to the training completion evidence.",
                        suggestedAction="Resubmit training log (PI / Coordinator)",
                        allowedRoles=["Principal Investigator", "Coordinator", "Admin"],
                    )
                )
            elif site_ev.trainingStatus in ["REQUIRED", "IN_PROGRESS"] or site_ev.evidenceStatus == "REQUIRED":
                blockers.append(
                    ReadinessBlockerSchema(
                        id=f"BLK-TRAIN-{site_ev.siteId}",
                        title=site_ev.siteName,
                        requirementName="Training completion",
                        category="TRAINING",
                        siteId=site_ev.siteId,
                        siteName=site_ev.siteName,
                        status="Required",
                        explanation="Site training has not yet been completed.",
                        suggestedAction="Complete site training (PI / Coordinator)",
                        allowedRoles=["Principal Investigator", "Coordinator", "Admin"],
                    )
                )
            elif site_ev.trainingStatus == "COMPLETED" and site_ev.verificationStatus in ["PENDING", "AWAITING_REVIEW"]:
                blockers.append(
                    ReadinessBlockerSchema(
                        id=f"BLK-TRAIN-{site_ev.siteId}",
                        title=site_ev.siteName,
                        requirementName="Monitor verification",
                        category="TRAINING",
                        siteId=site_ev.siteId,
                        siteName=site_ev.siteName,
                        status="Awaiting review",
                        explanation="Training completed by site; monitor verification pending.",
                        suggestedAction="Verify site training (Monitor / CRA)",
                        allowedRoles=["Monitor", "Admin"],
                    )
                )

    # 2. Evidence blockers for EVD-01 and EVD-02
    if not is_ethics_approved:
        status_label = "Changes requested" if (evd_01 and evd_01.status == "REJECTED") else ("Awaiting review" if (evd_01 and evd_01.status == "SUBMITTED") else "Required")
        explanation = (evd_01.rejectionReason if (evd_01 and evd_01.status == "REJECTED" and evd_01.rejectionReason) else "Institutional Ethics Committee sign-off required before protocol rollout.")
        suggested_act = ("Review ethics clearance dossier (Ethics Reviewer)" if (evd_01 and evd_01.status == "SUBMITTED") else "Submit signed IEC notification receipt (PI / Coordinator)")
        roles = ["Ethics Reviewer", "Admin"] if (evd_01 and evd_01.status == "SUBMITTED") else ["Principal Investigator", "Coordinator", "Admin"]
        blockers.append(
            ReadinessBlockerSchema(
                id="BLK-EVD-01",
                title="Institutional Ethics Committee",
                requirementName="IEC Notification Dossier (EVD-01)",
                category="ETHICS",
                status=status_label,
                explanation=explanation,
                suggestedAction=suggested_act,
                allowedRoles=roles,
            )
        )

    if not is_consent_verified:
        status_label = "Changes requested" if (evd_02 and evd_02.status == "REJECTED") else ("Awaiting review" if (evd_02 and evd_02.status == "SUBMITTED") else "Required")
        explanation = (evd_02.rejectionReason if (evd_02 and evd_02.status == "REJECTED" and evd_02.rejectionReason) else "Approved participant re-consent addendum required.")
        suggested_act = ("Verify consent addendum (Monitor / Ethics Reviewer)" if (evd_02 and evd_02.status == "SUBMITTED") else "Submit updated consent addendum (PI / Coordinator)")
        roles = ["Monitor", "Ethics Reviewer", "Admin"] if (evd_02 and evd_02.status == "SUBMITTED") else ["Principal Investigator", "Coordinator", "Admin"]
        blockers.append(
            ReadinessBlockerSchema(
                id="BLK-EVD-02",
                title="Participant Re-Consent",
                requirementName="Patient Information Sheet Addendum (EVD-02)",
                category="EVIDENCE",
                status=status_label,
                explanation=explanation,
                suggestedAction=suggested_act,
                allowedRoles=roles,
            )
        )

    # 3. Any other open blocking findings
    if blocking > 0:
        open_blockers = db.query(Finding).filter(
            Finding.changeset_id == cs_id,
            Finding.type == "BLOCK",
            Finding.status == "OPEN",
        ).all()
        for f in open_blockers:
            if f.id not in ["F-001", "F-002", "F-003"]:
                blockers.append(
                    ReadinessBlockerSchema(
                        id=f"BLK-FINDING-{f.id}",
                        title=f.title,
                        requirementName=f.id,
                        category="COMPLIANCE",
                        status="Open",
                        explanation=f.description,
                        suggestedAction="Resolve compliance finding",
                        allowedRoles=["Principal Investigator", "Admin"],
                    )
                )

    if is_ready_overall:
        blockers = []
        overall_state = "READY"
    else:
        overall_state = "NOT READY"

    return ReadinessSummarySchema(
        protocol=protocol,
        changeSet=cs_id,
        sites=sites_count,
        participants=participants_count,
        blockingFindings=blocking,
        warnings=warnings,
        evidence=f"{verified_evidence} / {total_evidence}",
        status="READY" if is_ready_overall else "BLOCKED",
        overallState=overall_state,
        readinessStage=readiness_stage,
        remainingRequirementsCount=len(remaining_reqs),
        remainingRequirements=remaining_reqs,
        dimensions=dimensions,
        blockers=blockers,
        isImpactComplete=is_impact_complete,
        isEvidenceSubmitted=is_evidence_submitted,
        isEvidenceVerified=is_evidence_verified,
        isEthicsApproved=is_ethics_approved,
        isTrainingCompleted=is_training_completed,
        isComplianceResolved=is_compliance_resolved,
    )


@router.get("/readiness", response_model=ReadinessSummarySchema)
def get_readiness(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """Calculate implementation readiness dynamically based on active workflow conditions."""
    return compute_readiness_summary(changeSetId=changeSetId, db=db)


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


@router.get("/evidence", response_model=List[EvidenceItemSchema])
def get_evidence(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """Retrieve evidence checklist items."""
    evidence = db.query(EvidenceItem).filter(EvidenceItem.changeset_id == changeSetId).all()
    return [to_evidence_schema(e, db) for e in evidence]






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
    if payload.description or payload.fileHint:
        evd.file_hint = payload.description or payload.fileHint
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

    return to_evidence_schema(evd, db)


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
        return to_evidence_schema(evd, db)
    if req.decision == "REJECT" and evd.status == "REJECTED":
        return to_evidence_schema(evd, db)

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

        if evidence_id == "EVD-03":
            # Harmonize all impacted sites' SiteTrainingRecords to VERIFIED
            impacted = get_impacted_sites_for_changeset(changeSetId, db)
            for s in impacted:
                trn = db.query(SiteTrainingRecord).filter(
                    SiteTrainingRecord.site_id == s.id,
                    SiteTrainingRecord.change_set_id == changeSetId,
                ).first()
                if not trn:
                    trn = SiteTrainingRecord(
                        id=f"TRN-{s.id.upper()}-{changeSetId}",
                        site_id=s.id,
                        change_set_id=changeSetId,
                        requirement_code="REQ-TRN-01",
                        requirement_name=f"Protocol Amendment {changeSetId} Site Staff Retraining",
                    )
                    db.add(trn)
                trn.status = "VERIFIED"
                trn.completed_at = trn.completed_at or datetime.now(timezone.utc)
                trn.completed_by = trn.completed_by or req.verifiedBy or "Clinical Coordinator"
                trn.verified_at = datetime.now(timezone.utc)
                trn.verified_by = req.verifiedBy or "Lead Clinical Monitor"
                trn.verification_note = req.comments or "Docket-level training verification"

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

        if evidence_id == "EVD-03":
            impacted = get_impacted_sites_for_changeset(changeSetId, db)
            for s in impacted:
                trn = db.query(SiteTrainingRecord).filter(
                    SiteTrainingRecord.site_id == s.id,
                    SiteTrainingRecord.change_set_id == changeSetId,
                ).first()
                if trn:
                    trn.status = "CHANGES_REQUESTED"
                    trn.verification_note = req.rejectionReason or req.comments or "Site training evidence requires revision."

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

    return to_evidence_schema(evd, db)



@router.post("/reset")
def reset_compiler_state(
    changeSetId: Optional[str] = Query("CS-0001"),
    db: Session = Depends(get_db),
):
    """
    Reset compiler demo state back to initial unverified state with open blockers.
    """
    # Delete non-fixture findings/obligations/evidence for CS-0001
    fixture_finding_ids = {"F-001", "F-002", "F-003", "F-004"}
    db.query(Finding).filter(
        Finding.changeset_id == changeSetId,
        ~Finding.id.in_(fixture_finding_ids),
    ).delete(synchronize_session=False)

    fixture_obl_ids = {"OBL-01", "OBL-02", "OBL-03", "OBL-04"}
    db.query(Obligation).filter(
        Obligation.changeset_id == changeSetId,
        ~Obligation.id.in_(fixture_obl_ids),
    ).delete(synchronize_session=False)

    fixture_evd_ids = {"EVD-01", "EVD-02", "EVD-03", "EVD-04"}
    db.query(EvidenceItem).filter(
        EvidenceItem.changeset_id == changeSetId,
        ~EvidenceItem.id.in_(fixture_evd_ids),
    ).delete(synchronize_session=False)

    for evd in db.query(EvidenceItem).filter(EvidenceItem.changeset_id == changeSetId).all():
        if evd.id != "EVD-04":
            evd.status = "MISSING"
            evd.button_text = "ADD EVIDENCE"
            evd.rejection_reason = None
            evd.verified_by = None
            evd.verified_at = None
        evd.is_demo_fixture = True
        evd.source = "seed"

    for obl in db.query(Obligation).filter(Obligation.changeset_id == changeSetId).all():
        obl.status = "OPEN"
        obl.is_demo_fixture = True
        obl.source = "seed"

    for f in db.query(Finding).filter(Finding.changeset_id == changeSetId).all():
        f.status = "OPEN"
        f.is_demo_fixture = True
        f.source = "seed"

    # Delete non-fixture SiteTrainingRecords
    db.query(SiteTrainingRecord).filter(
        SiteTrainingRecord.change_set_id == changeSetId,
    ).delete()

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



