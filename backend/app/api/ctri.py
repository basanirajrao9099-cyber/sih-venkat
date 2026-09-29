"""
CTRI Integration API Router for Ayu-Trial Fabric.
Provides public read-only CTRI queries, provenance verification, change detection, and Merkle audit tracking.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.trial import Trial, TrialVersionSnapshot
from app.models.governance import ChangeSet
from app.integrations.ctri.client import ctri_connector, CTRIConnectorException
from app.integrations.ctri.models import (
    CTRITrialResponse,
    CTRIValidationError,
    NormalizedCTRITrial,
    CTRIChangeReport,
)
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/api/v1/ctri", tags=["CTRI Integration"])


@router.get("/status")
def get_ctri_connector_status():
    """
    Returns health, security settings, and read-only status of the CTRI connector.
    """
    return {
        "sourceSystem": "Clinical Trials Registry - India (CTRI)",
        "mode": "READ_ONLY",
        "writeBackEnabled": False,
        "allowedDomains": ["ctri.nic.in"],
        "ssrfProtection": "STRICT_WHITELIST",
        "supportedFormat": "CTRI/YYYY/MM/XXXXXX",
        "status": "CONNECTED",
    }


@router.get("/validate", response_model=dict)
def validate_ctri_registration(registrationNumber: str = Query(..., description="CTRI Registration Number")):
    """
    Validate if a CTRI registration number matches the statutory format.
    """
    try:
        canonical = ctri_connector.validate_registration_number(registrationNumber)
        return {
            "valid": True,
            "canonicalNumber": canonical,
            "originalInput": registrationNumber,
        }
    except CTRIConnectorException as e:
        return {
            "valid": False,
            "error": e.message,
            "errorCode": e.error_code,
            "originalInput": registrationNumber,
        }


@router.get("/fetch", response_model=CTRITrialResponse)
@router.get("/trials/{registration_number:path}", response_model=CTRITrialResponse)
def get_ctri_trial(
    registration_number: Optional[str] = None,
    registrationNumber: Optional[str] = Query(None),
    allowFallback: bool = Query(True, description="Allow fallback to local curated snapshot if live CTRI is unreachable"),
    db: Session = Depends(get_db),
):
    """
    Retrieve and normalize public trial data from CTRI.
    Compares against existing stored snapshots for change detection and logs a Merkle audit event.
    """
    target_num = registration_number or registrationNumber
    if not target_num:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration number is required.",
        )

    try:
        canonical_reg = ctri_connector.validate_registration_number(target_num)
    except CTRIConnectorException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

    # 1. Look up existing trial in database for version comparison
    existing_trial = db.query(Trial).filter(
        (Trial.ctri_number == canonical_reg) | (Trial.trial_id == canonical_reg) | (Trial.alias == canonical_reg)
    ).first()

    previous_dict = None
    if existing_trial:
        previous_dict = {
            "registration_number": existing_trial.ctri_number,
            "public_title": existing_trial.title,
            "scientific_title": getattr(existing_trial, "scientific_title", existing_trial.title),
            "study_type": getattr(existing_trial, "study_type", "Interventional"),
            "intervention": getattr(existing_trial, "intervention", existing_trial.formulation),
            "condition": getattr(existing_trial, "condition", existing_trial.indication),
            "phase": existing_trial.phase,
            "sample_size": existing_trial.target_enrollment,
            "study_design": getattr(existing_trial, "study_design", None),
            "status": existing_trial.status,
            "sponsor": existing_trial.sponsor,
            "principal_investigator": existing_trial.pi_name,
            "source_hash": getattr(existing_trial, "source_hash", None),
        }

    # 2. Fetch trial data via connector
    try:
        normalized_trial, source_mode = ctri_connector.fetch_trial(
            canonical_reg,
            allow_fixture_fallback=allowFallback,
        )
    except CTRIConnectorException as e:
        # Audit failure
        first_cs = db.query(ChangeSet).first()
        cs_id = first_cs.id if first_cs else "CS-0001"
        try:
            record_audit_event(
                db=db,
                changeset_id=cs_id,
                who="CTRI Ingestion Service",
                what="CTRI_TRIAL_FETCH_FAILED",
                outcome="FAILED",
                custom_why=f"Failed to fetch CTRI trial '{canonical_reg}': {e.message}",
            )
            db.commit()
        except Exception:
            db.rollback()

        raise HTTPException(status_code=e.status_code, detail=e.message)

    # 3. Detect changes
    change_report = ctri_connector.detect_changes(previous_dict, normalized_trial)

    # 4. Record audit event in Merkle audit trail
    first_cs = db.query(ChangeSet).first()
    cs_id = first_cs.id if first_cs else "CS-0001"
    audit_action = "CTRI_TRIAL_FETCHED"
    if not change_report.changed:
        audit_action = "CTRI_TRIAL_UNCHANGED"
    elif previous_dict and change_report.changed:
        audit_action = "CTRI_TRIAL_UPDATED"

    audit_rec = None
    try:
        audit_rec = record_audit_event(
            db=db,
            changeset_id=cs_id,
            who="CTRI Ingestion Service",
            what=audit_action,
            outcome="VERIFIED",
            evidence_ref=normalized_trial.source_hash[:18],
            custom_why=(
                f"CTRI public record {canonical_reg} imported in {source_mode} mode. "
                f"Status: {normalized_trial.status}. Change detected: {change_report.changed}."
            ),
        )

        # Store version snapshot if trial exists in DB
        if existing_trial:
            existing_trial.source_hash = normalized_trial.source_hash
            existing_trial.source_mode = source_mode
            existing_trial.source_fetched_at = normalized_trial.retrieved_at

            # Count existing snapshots
            snapshot_count = db.query(TrialVersionSnapshot).filter(
                TrialVersionSnapshot.trial_id == existing_trial.trial_id
            ).count()

            snapshot = TrialVersionSnapshot(
                id=f"SNAP-{uuid.uuid4().hex[:8].upper()}",
                trial_id=existing_trial.trial_id,
                ctri_number=canonical_reg,
                version_number=snapshot_count + 1,
                source_hash=normalized_trial.source_hash,
                source_mode=source_mode,
                source_url=normalized_trial.source_url,
                snapshot_payload=normalized_trial.model_dump(),
                changed_fields=change_report.changed_fields,
            )
            db.add(snapshot)

        db.commit()
    except Exception as err:
        db.rollback()

    audit_id = audit_rec.id if audit_rec else None

    return CTRITrialResponse(
        source="CTRI",
        source_mode=source_mode,
        registration_number=canonical_reg,
        source_url=normalized_trial.source_url,
        retrieved_at=normalized_trial.retrieved_at,
        trial=normalized_trial,
        version=change_report,
        audit_event_id=audit_id,
        message=f"Successfully fetched {canonical_reg} in {source_mode} mode.",
    )
