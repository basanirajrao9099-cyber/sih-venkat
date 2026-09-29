"""
Ayu-Trial Fabric: Cryptographic Audit Trail Service.
Implements append-only tamper-evident hash chaining across all state-changing actions
and AI advisory queries with concurrency-safe sequence locks.
"""

import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.audit import AuditTrailRecord, AuditChainState
from app.schemas.audit import AuditVerificationResponse, TamperDetail

logger = logging.getLogger("ayu_trial_fabric.audit")

GENESIS_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000"

ACTION_TEMPLATES: Dict[str, str] = {
    "CHANGESET_CREATED": "ChangeSet drafted targeting Protocol amendment; initiated blast radius dependency resolution.",
    "IMPACT_ANALYSIS": "Traversed trial data schema and resolved blast radius across sites, participants, and EDC forms.",
    "COMPILATION_FAILED": "Pre-flight compiler gate check triggered BUILD FAILED due to unfulfilled procedural and regulatory prerequisites.",
    "FINDINGS_GENERATED": "Formally evaluated rule registry and generated binding findings, severity ratings, and obligations.",
    "EVIDENCE_SUBMITTED": "Submitted regulatory or operational evidence dossier with verified provenance and checksum.",
    "EVIDENCE_VERIFIED": "Reviewed and verified evidence artifact against protocol acceptance criteria and statutory guidelines.",
    "EVIDENCE_REJECTED": "Rejected evidence submission due to missing compliance requirements or defective provenance.",
    "SITE_TRAINING_COMPLETED": "Site clinical staff completed mandatory protocol amendment training and comprehension assessment.",
    "SITE_TRAINING_VERIFIED": "Clinical Monitor (CRA) verified site training documentation and compliance logs.",
    "RECOMPILATION_PASSED": "Re-evaluated all governance pipeline checkpoints. Zero blocking findings detected; all rule constraints satisfied.",
    "RECOMPILATION_FAILED": "Re-evaluated governance pipeline; unfulfilled blocking constraints persist.",
    "READINESS_CERTIFIED": "ChangeSet certified for immediate, synchronized operational rollout across all active study centers.",
    "AI_ADVISORY_QUERY": "AI Advisory consultation requested for clinical trial interpretation. Advisory output generated without state mutation.",
    "CTRI_TRIAL_FETCHED": "Retrieved live public trial registry record from CTRI; verified source provenance and normalized schema.",
    "CTRI_TRIAL_FETCH_FAILED": "Attempted live retrieval from CTRI; encountered network timeout, malformed payload, or invalid registration ID.",
    "CTRI_TRIAL_UNCHANGED": "Compared latest CTRI registry record with existing snapshot; zero field modifications detected.",
    "CTRI_TRIAL_UPDATED": "Detected statutory protocol or operational modifications in live CTRI trial record; generated version diff.",
}


def compute_record_hash(
    parent_hash: str,
    changeset_id: str,
    who: str,
    what: str,
    when_timestamp: str,
    why: str,
    evidence_ref: str,
    outcome: str,
) -> str:
    """
    Compute full 256-bit SHA-256 cryptographic hash over canonical event fields.
    Returns format: '0x' + 64 hex characters.
    """
    canonical_str = (
        f"{parent_hash}|{changeset_id}|{who}|{what}|{when_timestamp}|{why}|{evidence_ref}|{outcome}"
    )
    digest = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
    return f"0x{digest.upper()}"


import threading

_audit_lock = threading.Lock()


def record_audit_event(
    db: Session,
    changeset_id: str,
    who: str,
    what: str,
    outcome: str,
    evidence_ref: Optional[str] = None,
    custom_why: Optional[str] = None,
    title: Optional[str] = None,
    step: Optional[str] = None,
    status: Optional[str] = None,
) -> AuditTrailRecord:
    with _audit_lock:
        return _record_audit_event_internal(
            db=db,
            changeset_id=changeset_id,
            who=who,
            what=what,
            outcome=outcome,
            evidence_ref=evidence_ref,
            custom_why=custom_why,
            title=title,
            step=step,
            status=status,
        )


def _record_audit_event_internal(
    db: Session,
    changeset_id: str,
    who: str,
    what: str,
    outcome: str,
    evidence_ref: Optional[str] = None,
    custom_why: Optional[str] = None,
    title: Optional[str] = None,
    step: Optional[str] = None,
    status: Optional[str] = None,
) -> AuditTrailRecord:
    """
    Append-only recording of an audit event into the tamper-evident hash chain.
    Thread-safe and concurrency-safe via AuditChainState locking.
    """
    evidence_str = evidence_ref or "N/A"
    why_str = custom_why or ACTION_TEMPLATES.get(what, "Operational clinical trial governance event recorded.")
    title_str = title or what.replace("_", " ").title()
    status_str = status or outcome
    
    now_utc = datetime.now(timezone.utc)
    when_str = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
    display_time = now_utc.strftime("Today, %H:%M:%S UTC")

    # Acquire lock on chain state for this changeset
    chain_state = (
        db.query(AuditChainState)
        .filter(AuditChainState.changeset_id == changeset_id)
        .with_for_update()
        .first()
    )

    if not chain_state:
        # Check existing records in DB for backward compatibility
        existing_records = (
            db.query(AuditTrailRecord)
            .filter(AuditTrailRecord.changeset_id == changeset_id)
            .order_by(AuditTrailRecord.created_at.asc(), AuditTrailRecord.id.asc())
            .all()
        )
        if existing_records:
            last_record = existing_records[-1]
            parent_hash = last_record.hash if (last_record.hash and len(last_record.hash) > 10) else GENESIS_HASH
            seq = len(existing_records)
        else:
            parent_hash = GENESIS_HASH
            seq = 0

        chain_state = AuditChainState(
            changeset_id=changeset_id,
            last_hash=parent_hash,
            sequence=seq,
        )
        db.add(chain_state)
        db.flush()
    else:
        parent_hash = chain_state.last_hash
        seq = chain_state.sequence

    new_seq = seq + 1
    step_str = step or f"STEP {new_seq}"
    evt_id = f"EVT-{new_seq:03d}"

    while db.query(AuditTrailRecord).filter(AuditTrailRecord.id == evt_id).first():
        new_seq += 1
        evt_id = f"EVT-{new_seq:03d}"

    full_hash = compute_record_hash(
        parent_hash=parent_hash,
        changeset_id=changeset_id,
        who=who,
        what=what,
        when_timestamp=when_str,
        why=why_str,
        evidence_ref=evidence_str,
        outcome=outcome,
    )

    record = AuditTrailRecord(
        id=evt_id,
        changeset_id=changeset_id,
        step=step_str,
        title=title_str,
        timestamp_display=display_time,
        actor=who,
        description=why_str,
        status=status_str,
        who=who,
        what=what,
        when_timestamp=when_str,
        why=why_str,
        evidence_ref=evidence_str,
        outcome=outcome,
        parent_hash=parent_hash,
        hash=full_hash,
    )

    db.add(record)
    
    # Update chain state
    chain_state.last_hash = full_hash
    chain_state.sequence = new_seq
    db.flush()

    logger.info(
        f"Audit record logged: {evt_id} ({what}) for {changeset_id} - Hash: {full_hash[:16]}..."
    )
    return record


def verify_audit_chain(db: Session, changeset_id: str) -> AuditVerificationResponse:
    """
    Traverse the audit chain for a ChangeSet from genesis to head.
    Recalculates SHA-256 for each block against its parent hash.
    Identifies exact tampered records if discrepancies are detected.
    """
    records: List[AuditTrailRecord] = (
        db.query(AuditTrailRecord)
        .filter(AuditTrailRecord.changeset_id == changeset_id)
        .order_by(AuditTrailRecord.created_at.asc(), AuditTrailRecord.id.asc())
        .all()
    )

    if not records:
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        return AuditVerificationResponse(
            changeSetId=changeset_id,
            totalRecords=0,
            chainValid=True,
            tamperDetected=False,
            genesisHash=GENESIS_HASH,
            headHash=GENESIS_HASH,
            verifiedAt=now_str,
            tamperDetails=[],
            message="Audit chain is empty. Genesis state intact.",
        )

    expected_parent = GENESIS_HASH
    tamper_details: List[TamperDetail] = []
    is_valid = True

    for idx, r in enumerate(records):
        # If record is an old fixture with truncated hash, allow historical continuity
        if not r.parent_hash and idx == 0:
            expected_parent = r.hash or GENESIS_HASH
            continue

        if r.parent_hash and r.parent_hash != expected_parent:
            is_valid = False
            tamper_details.append(
                TamperDetail(
                    recordId=r.id,
                    step=r.step,
                    action=r.what or "UNKNOWN_ACTION",
                    fieldCompromised="parent_hash",
                    expectedHash=expected_parent,
                    actualHash=r.parent_hash or "NULL",
                    detail=f"Broken hash link: expected parent {expected_parent[:16]}..., found {str(r.parent_hash)[:16]}...",
                )
            )

        # If it's a full Phase 5 record with all provenance fields, recompute full hash
        if r.who and r.what and r.when_timestamp and r.why:
            recomputed = compute_record_hash(
                parent_hash=r.parent_hash or GENESIS_HASH,
                changeset_id=r.changeset_id,
                who=r.who,
                what=r.what,
                when_timestamp=r.when_timestamp,
                why=r.why,
                evidence_ref=r.evidence_ref or "N/A",
                outcome=r.outcome or r.status,
            )

            if r.hash != recomputed:
                is_valid = False
                tamper_details.append(
                    TamperDetail(
                        recordId=r.id,
                        step=r.step,
                        action=r.what or "UNKNOWN_ACTION",
                        fieldCompromised="data_integrity_hash",
                        expectedHash=recomputed,
                        actualHash=r.hash or "NULL",
                        detail=f"Record content modification detected in {r.id}. Hash does not match canonical contents.",
                    )
                )

        expected_parent = r.hash

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    genesis_h = records[0].hash or GENESIS_HASH
    head_h = records[-1].hash or GENESIS_HASH

    msg = (
        f"Audit chain verification succeeded across {len(records)} records. Cryptographic integrity confirmed."
        if is_valid
        else f"TAMPER DETECTED: {len(tamper_details)} integrity violations detected in audit trail!"
    )

    return AuditVerificationResponse(
        changeSetId=changeset_id,
        totalRecords=len(records),
        chainValid=is_valid,
        tamperDetected=not is_valid,
        genesisHash=genesis_h,
        headHash=head_h,
        verifiedAt=now_str,
        tamperDetails=tamper_details if tamper_details else None,
        message=msg,
    )
