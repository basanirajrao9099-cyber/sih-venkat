import pytest
import uuid
from sqlalchemy.orm import Session
from app.models.user import User, RoleName, Permission, ROLE_PERMISSIONS
from app.models.governance import (
    ChangeSet,
    ChangeSetState,
    ImpactNode,
    CompilationRun,
    Finding,
    Obligation,
    EvidenceItem,
    ApprovalRecord,
    ApprovalDecision,
    ExecutionPlan,
    ExecutionPlanStatus,
    ExecutionEvent,
    RollbackPlan,
    RollbackStatus,
)
from app.services.audit_service import record_audit_event, verify_audit_chain
from app.guardrails.ai_guardrails import advisory_context


def test_1_existing_users_load(db_session: Session):
    """Test 1: Existing seeded users can still load with backward-compatible roles."""
    users = db_session.query(User).all()
    assert len(users) >= 1
    pi_user = db_session.query(User).filter(User.id == "usr-pi-01").first()
    assert pi_user is not None
    assert pi_user.role == RoleName.PI or pi_user.role.value == "Principal Investigator"
    assert pi_user.email == "pi@aiia.gov.in"


def test_2_existing_changesets_load(db_session: Session):
    """Test 2: Existing ChangeSets can still load from the database."""
    changesets = db_session.query(ChangeSet).all()
    assert len(changesets) >= 1


def test_3_existing_demo_changeset_cs_0001_loads(db_session: Session):
    """Test 3: Existing demo ChangeSet CS-0001 still loads with all attributes."""
    cs = db_session.query(ChangeSet).filter(ChangeSet.id == "CS-0001").first()
    assert cs is not None
    assert cs.trial_id == "AYU-2026-0001" or cs.trial_id == "ATF-001" or len(cs.trial_id) > 0
    assert cs.status in ["IN REVIEW", "SUBMITTED", "APPROVED", "COMPLETED"]
    assert cs.change == "Visit 4 schedule: Day 25–31 → Day 25–35" or "Visit 4" in cs.change


def test_4_existing_compiler_functionality(client):
    """Test 4: Existing compiler evaluate endpoint still works."""
    response = client.post("/api/v1/compiler/evaluate", json={"changeSetId": "CS-0001"})
    assert response.status_code == 200
    data = response.json()
    assert "findings" in data
    assert len(data["findings"]) >= 1


def test_5_new_approval_record_creation(db_session: Session):
    """Test 5: New ApprovalRecord can be created and linked to a ChangeSet."""
    cs = db_session.query(ChangeSet).first()
    assert cs is not None

    approval_id = f"APR-{uuid.uuid4().hex[:6].upper()}"
    approval = ApprovalRecord(
        id=approval_id,
        changeset_id=cs.id,
        actor_user_id="usr-pi-01",
        actor_role=RoleName.PI.value,
        stage="IEC_REVIEW",
        decision=ApprovalDecision.APPROVED.value,
        reason="Ethical clearance documents verified and protocol addendum acknowledged.",
        signature="0xSIG_MOCK_APPROVAL_HASH_2026",
    )
    db_session.add(approval)
    db_session.commit()

    retrieved = db_session.query(ApprovalRecord).filter(ApprovalRecord.id == approval_id).first()
    assert retrieved is not None
    assert retrieved.changeset_id == cs.id
    assert retrieved.decision == "APPROVED"
    assert retrieved.stage == "IEC_REVIEW"


def test_6_new_execution_plan_creation(db_session: Session):
    """Test 6: New ExecutionPlan can be created with idempotency key and state diffs."""
    cs = db_session.query(ChangeSet).first()
    assert cs is not None

    plan_id = f"EXP-{uuid.uuid4().hex[:6].upper()}"
    idempotency_key = f"IDEMP-{uuid.uuid4().hex}"
    
    plan = ExecutionPlan(
        id=plan_id,
        changeset_id=cs.id,
        idempotency_key=idempotency_key,
        target_system="REDCap EDC",
        status=ExecutionPlanStatus.PREPARED.value,
        created_by="usr-pi-01",
        before_state={"visit_window": "Day 25-31", "crf_version": "v1.1"},
        after_state={"visit_window": "Day 25-35", "crf_version": "v1.2"},
        execution_metadata={"affected_sites": 3, "affected_patients": 47},
    )
    db_session.add(plan)
    db_session.commit()

    retrieved = db_session.query(ExecutionPlan).filter(ExecutionPlan.id == plan_id).first()
    assert retrieved is not None
    assert retrieved.idempotency_key == idempotency_key
    assert retrieved.status == "PREPARED"
    assert retrieved.after_state["visit_window"] == "Day 25-35"


def test_7_new_execution_event_creation(db_session: Session):
    """Test 7: New ExecutionEvent can be created and linked to an ExecutionPlan."""
    cs = db_session.query(ChangeSet).first()
    plan_id = f"EXP-{uuid.uuid4().hex[:6].upper()}"
    plan = ExecutionPlan(
        id=plan_id,
        changeset_id=cs.id,
        idempotency_key=f"IDEMP-{uuid.uuid4().hex}",
        target_system="REDCap EDC",
        status=ExecutionPlanStatus.EXECUTING.value,
        created_by="usr-pi-01",
    )
    db_session.add(plan)
    db_session.commit()

    event_id = f"EXE-{uuid.uuid4().hex[:6].upper()}"
    event = ExecutionEvent(
        id=event_id,
        execution_plan_id=plan_id,
        event_type="VISIT_WINDOW_UPDATE",
        status="SUCCESS",
        target_system="REDCap EDC",
        external_record_id="REDCAP-PROJ-8912",
        before_value={"window_max": 31},
        after_value={"window_max": 35},
    )
    db_session.add(event)
    db_session.commit()

    retrieved = db_session.query(ExecutionEvent).filter(ExecutionEvent.id == event_id).first()
    assert retrieved is not None
    assert retrieved.event_type == "VISIT_WINDOW_UPDATE"
    assert retrieved.status == "SUCCESS"


def test_8_new_rollback_plan_creation(db_session: Session):
    """Test 8: New RollbackPlan can be created with compensating actions."""
    cs = db_session.query(ChangeSet).first()
    plan_id = f"EXP-{uuid.uuid4().hex[:6].upper()}"
    plan = ExecutionPlan(
        id=plan_id,
        changeset_id=cs.id,
        idempotency_key=f"IDEMP-{uuid.uuid4().hex}",
        target_system="REDCap EDC",
        status=ExecutionPlanStatus.COMPLETED.value,
        created_by="usr-pi-01",
    )
    db_session.add(plan)
    db_session.commit()

    rbp_id = f"RBP-{uuid.uuid4().hex[:6].upper()}"
    rollback = RollbackPlan(
        id=rbp_id,
        execution_plan_id=plan_id,
        status=RollbackStatus.READY.value,
        compensating_action={
            "action": "RESTORE_VISIT_WINDOW",
            "target_window": "Day 25-31",
            "notify_sites": True,
        },
        created_by="usr-pi-01",
    )
    db_session.add(rollback)
    db_session.commit()

    retrieved = db_session.query(RollbackPlan).filter(RollbackPlan.id == rbp_id).first()
    assert retrieved is not None
    assert retrieved.status == "READY"
    assert retrieved.compensating_action["target_window"] == "Day 25-31"


def test_9_ai_advisory_remains_strictly_read_only(db_session: Session):
    """Test 9: AI advisory context intercepts and prohibits any database write."""
    with pytest.raises(RuntimeError) as exc_info:
        with advisory_context():
            new_finding = Finding(
                id="F-AI-MUTATION",
                changeset_id="CS-0001",
                type="BLOCK",
                title="AI Unauthorized Finding",
                description="Should be blocked",
                severity="HIGH",
            )
            db_session.add(new_finding)
            db_session.flush()

    assert "CRITICAL SECURITY VIOLATION" in str(exc_info.value) or "Advisory AI" in str(exc_info.value)
    db_session.rollback()


def test_10_existing_audit_chain_verification(client):
    """Test 10: Existing audit-chain verification still works and verifies chain integrity."""
    response = client.get("/api/v1/audit/verify?changesetId=CS-0001")
    assert response.status_code == 200
    data = response.json()
    assert "chainValid" in data
    assert "tamperDetected" in data
    assert data["tamperDetected"] is False
    assert data["chainValid"] is True
    assert data["totalRecords"] >= 1

